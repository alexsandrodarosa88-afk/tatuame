import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { fetchMpPayment, verifyMpSignature } from "@/lib/mercadopago.server";

function adminClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

function firstOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

/**
 * Mercado Pago webhook
 * Payload: { action, type, data: { id }, ... }
 * We only care about type === "payment".
 */
export const Route = createFileRoute("/api/public/mercadopago-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const url = new URL(request.url);
        const rawBody = await request.text();
        let payload: any = null;
        try { payload = rawBody ? JSON.parse(rawBody) : null; } catch { /* */ }

        // MP can send id either in body.data.id or in query (?data.id=...&type=payment)
        const dataId =
          payload?.data?.id?.toString?.() ||
          url.searchParams.get("data.id") ||
          url.searchParams.get("id") ||
          null;
        const type =
          payload?.type ||
          url.searchParams.get("type") ||
          url.searchParams.get("topic") ||
          "";

        const sigOk = verifyMpSignature({
          xSignature: request.headers.get("x-signature"),
          xRequestId: request.headers.get("x-request-id"),
          dataId,
        });
        if (!sigOk) {
          console.warn("[mp-webhook] assinatura inválida");
          return new Response("Invalid signature", { status: 401 });
        }

        if (!dataId || !/payment/i.test(type)) {
          return new Response("ok");
        }

        let payment: any;
        try {
          payment = await fetchMpPayment(dataId);
        } catch (e) {
          console.error("[mp-webhook] falha ao buscar payment:", e);
          return new Response("ok");
        }

        const status: string = payment?.status ?? "";
        const externalRef: string = payment?.external_reference ?? "";
        const admin = adminClient();

        // ===== ASSINATURA TATUADOR =====
        if (externalRef.startsWith("artist_sub:")) {
          const artistId = externalRef.replace("artist_sub:", "");
          const { data: artist } = await admin
            .from("tattoo_artists")
            .select("id")
            .eq("id", artistId)
            .maybeSingle();
          if (!artist) return new Response("ok");

          const refMonth = firstOfMonth(new Date());

          // Try to find existing row by mp payment_id OR by preference (asaas_payment_id stores both during transition)
          const { data: existing } = await admin
            .from("artist_subscriptions")
            .select("id")
            .eq("artist_id", artist.id)
            .eq("reference_month", refMonth)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (status === "approved") {
            const paidAt = new Date().toISOString();
            if (existing) {
              await admin
                .from("artist_subscriptions")
                .update({
                  status: "paid",
                  paid_at: paidAt,
                  asaas_payment_id: String(payment.id),
                  billing_type: payment.payment_type_id ?? null,
                })
                .eq("id", existing.id);
            } else {
              await admin.from("artist_subscriptions").insert({
                artist_id: artist.id,
                reference_month: refMonth,
                amount: Number(payment.transaction_amount ?? 0),
                status: "paid",
                paid_at: paidAt,
                due_date: new Date().toISOString().slice(0, 10),
                asaas_payment_id: String(payment.id),
                billing_type: payment.payment_type_id ?? null,
              });
            }

            const nextDue = (() => {
              const n = new Date();
              n.setMonth(n.getMonth() + 1);
              return n.toISOString().slice(0, 10);
            })();
            await admin
              .from("tattoo_artists")
              .update({ subscription_status: "active", subscription_next_due: nextDue })
              .eq("id", artist.id);
          } else if (status === "rejected" || status === "cancelled") {
            await admin
              .from("tattoo_artists")
              .update({ subscription_status: "overdue" })
              .eq("id", artist.id);
          }
          return new Response("ok");
        }

        // ===== PEDIDO DE COTAS =====
        const orderId = externalRef || null;
        let order: { id: string; user_id: string; status: string } | null = null;
        if (orderId) {
          const { data } = await admin
            .from("orders")
            .select("id, user_id, status")
            .eq("id", orderId)
            .maybeSingle();
          order = data ?? null;
        }
        if (!order) {
          console.warn("[mp-webhook] pedido não encontrado para external_reference:", externalRef);
          return new Response("ok");
        }

        if (status === "approved") {
          if (order.status === "paid") return new Response("ok");

          const { data: items } = await admin
            .from("order_items")
            .select("campaign_id, quantity")
            .eq("order_id", order.id);
          if (items) {
            for (const it of items) {
              const { error: allocErr } = await admin.rpc("allocate_lucky_numbers", {
                _user_id: order.user_id,
                _campaign_id: it.campaign_id,
                _order_id: order.id,
                _quantity: it.quantity,
              });
              if (allocErr) console.error("[mp-webhook] alloc err:", allocErr);
            }
          }

          await admin
            .from("orders")
            .update({
              status: "paid",
              paid_at: new Date().toISOString(),
              asaas_payment_id: String(payment.id),
            })
            .eq("id", order.id);
        } else if (status === "cancelled" || status === "rejected" || status === "refunded") {
          await admin
            .from("orders")
            .update({ status: "canceled" })
            .eq("id", order.id)
            .eq("status", "pending");
        }

        return new Response("ok");
      },

      GET: async () => new Response("ok"),
    },
  },
});