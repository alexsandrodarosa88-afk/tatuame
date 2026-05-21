import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function adminClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

// Eventos do Asaas: PAYMENT_CONFIRMED, PAYMENT_RECEIVED, PAYMENT_OVERDUE,
// PAYMENT_REFUNDED, PAYMENT_DELETED, PAYMENT_RESTORED, etc.
// Doc: https://docs.asaas.com/docs/sobre-os-webhooks

export const Route = createFileRoute("/api/public/asaas-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Opcional: validar token configurado no painel do Asaas
        const expectedToken = process.env.ASAAS_WEBHOOK_TOKEN;
        if (expectedToken) {
          const token = request.headers.get("asaas-access-token");
          if (token !== expectedToken) {
            return new Response("Unauthorized", { status: 401 });
          }
        }

        let payload: any;
        try {
          payload = await request.json();
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        const event: string = payload?.event ?? "";
        const payment = payload?.payment;
        if (!payment?.id) return new Response("ok"); // ignora eventos sem payment

        const admin = adminClient();

        // Localiza o pedido por asaas_payment_id ou pelo externalReference
        const orderId: string | undefined = payment.externalReference || undefined;
        let order;
        if (orderId) {
          const { data } = await admin
            .from("orders")
            .select("id, user_id, status")
            .eq("id", orderId)
            .maybeSingle();
          order = data;
        }
        if (!order) {
          const { data } = await admin
            .from("orders")
            .select("id, user_id, status")
            .eq("asaas_payment_id", payment.id)
            .maybeSingle();
          order = data;
        }
        if (!order) {
          console.warn("[asaas-webhook] Pedido não encontrado:", payment.id, orderId);
          return new Response("ok");
        }

        // PAGAMENTOS CONFIRMADOS
        if (event === "PAYMENT_CONFIRMED" || event === "PAYMENT_RECEIVED") {
          if (order.status === "paid") return new Response("ok"); // idempotente

          // Buscar itens do pedido para alocar números
          const { data: items } = await admin
            .from("order_items")
            .select("campaign_id, quantity")
            .eq("order_id", order.id);

          if (items && items.length > 0) {
            for (const it of items) {
              const { error: allocErr } = await admin.rpc("allocate_lucky_numbers", {
                _user_id: order.user_id,
                _campaign_id: it.campaign_id,
                _order_id: order.id,
                _quantity: it.quantity,
              });
              if (allocErr) {
                console.error("[asaas-webhook] Erro alocando números:", allocErr);
              }
            }
          }

          await admin
            .from("orders")
            .update({
              status: "paid",
              paid_at: new Date().toISOString(),
              asaas_payment_id: payment.id,
            })
            .eq("id", order.id);

          return new Response("ok");
        }

        // CANCELAMENTOS / EXPIRADOS
        if (event === "PAYMENT_DELETED" || event === "PAYMENT_REFUNDED" || event === "PAYMENT_REFUND_IN_PROGRESS") {
          await admin
            .from("orders")
            .update({ status: "cancelled" })
            .eq("id", order.id)
            .eq("status", "pending");
          return new Response("ok");
        }

        return new Response("ok");
      },
    },
  },
});