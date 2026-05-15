import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function admin() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.text();
        let event: any;
        try { event = JSON.parse(body); } catch { return new Response("invalid json", { status: 400 }); }

        const type = event.type as string | undefined;
        if (!type) return new Response("no type", { status: 400 });

        // Stripe payment success events
        if (type === "checkout.session.completed" || type === "payment_intent.succeeded" || type === "transaction.completed") {
          const obj = event.data?.object ?? event.data ?? {};
          const orderId: string | undefined =
            obj.metadata?.order_id ??
            obj.client_reference_id ??
            obj.payment_intent?.metadata?.order_id;

          if (!orderId) {
            console.warn("[webhook] no order_id in event", type);
            return new Response("ok", { status: 200 });
          }

          const sb = admin();
          const { data: order } = await sb
            .from("orders")
            .select("id, user_id, status, total_amount, order_items(campaign_id, quantity, unit_price)")
            .eq("id", orderId)
            .single();

          if (!order) return new Response("order not found", { status: 404 });
          if (order.status === "paid") return new Response("already paid", { status: 200 });

          // Allocate lucky numbers per campaign
          for (const item of order.order_items as any[]) {
            const { error } = await sb.rpc("allocate_lucky_numbers", {
              _user_id: order.user_id,
              _campaign_id: item.campaign_id,
              _order_id: order.id,
              _quantity: item.quantity,
            });
            if (error) {
              console.error("[webhook] allocate failed", error);
              return new Response("allocate failed", { status: 500 });
            }
          }

          // Create credit (full order total = credit)
          await sb.from("credits").insert({
            user_id: order.user_id,
            amount: order.total_amount,
            source_order_id: order.id,
          });

          // Mark paid
          await sb.from("orders").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", order.id);
          return new Response("ok", { status: 200 });
        }

        return new Response("ignored", { status: 200 });
      },
    },
  },
});
