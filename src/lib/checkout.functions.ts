import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function adminClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

export const createPixCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    // Load cart
    const { data: cart, error: cartErr } = await supabase
      .from("cart_items")
      .select("quantity, campaign_id, campaigns(id, price_per_quota, total_quotas, sold_quotas, status)")
      .eq("user_id", userId);
    if (cartErr) throw cartErr;
    if (!cart || cart.length === 0) throw new Error("Carrinho vazio");

    type Row = (typeof cart)[number] & { campaigns: { id: string; price_per_quota: number; total_quotas: number; sold_quotas: number; status: string } };
    const rows = cart as unknown as Row[];

    let total = 0;
    for (const r of rows) {
      if (!r.campaigns || r.campaigns.status !== "active") throw new Error("Campanha indisponível");
      if (r.campaigns.sold_quotas + r.quantity > r.campaigns.total_quotas)
        throw new Error("Cotas insuficientes nessa campanha");
      total += Number(r.campaigns.price_per_quota) * r.quantity;
    }

    const admin = adminClient();

    // Create order
    const { data: order, error: orderErr } = await admin
      .from("orders")
      .insert({
        user_id: userId,
        status: "pending",
        total_amount: total,
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      })
      .select("id")
      .single();
    if (orderErr || !order) throw orderErr ?? new Error("Falha ao criar pedido");

    // Create order items
    const itemsPayload = rows.map((r) => ({
      order_id: order.id,
      campaign_id: r.campaign_id,
      quantity: r.quantity,
      unit_price: r.campaigns.price_per_quota,
    }));
    const { error: itemsErr } = await admin.from("order_items").insert(itemsPayload);
    if (itemsErr) throw itemsErr;

    // Create Stripe Checkout Session with PIX
    const stripeKey = process.env.STRIPE_SANDBOX_API_KEY ?? process.env.STRIPE_API_KEY;
    if (!stripeKey) throw new Error("Stripe não configurado");

    const baseUrl =
      process.env.LOVABLE_APP_URL ||
      `https://project--f870966e-4064-4b40-9e98-a8f3aef0b837-dev.lovable.app`;

    const params = new URLSearchParams();
    params.append("mode", "payment");
    params.append("payment_method_types[]", "pix");
    params.append("success_url", `${baseUrl}/checkout/${order.id}?status=success`);
    params.append("cancel_url", `${baseUrl}/carrinho`);
    params.append("client_reference_id", order.id);
    params.append("metadata[order_id]", order.id);
    params.append("metadata[user_id]", userId);
    params.append("payment_intent_data[metadata][order_id]", order.id);
    params.append("payment_intent_data[metadata][user_id]", userId);
    rows.forEach((r, i) => {
      params.append(`line_items[${i}][price_data][currency]`, "brl");
      params.append(`line_items[${i}][price_data][product_data][name]`, `Cota Tatua.me — campanha ${r.campaign_id.slice(0, 8)}`);
      params.append(`line_items[${i}][price_data][unit_amount]`, String(Math.round(Number(r.campaigns.price_per_quota) * 100)));
      params.append(`line_items[${i}][quantity]`, String(r.quantity));
    });

    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });
    const session = (await res.json()) as { id?: string; url?: string; error?: { message: string } };
    if (!res.ok || !session.url) throw new Error(session.error?.message ?? "Falha no Stripe");

    await admin
      .from("orders")
      .update({ stripe_payment_intent_id: session.id })
      .eq("id", order.id);

    // Clear cart
    await admin.from("cart_items").delete().eq("user_id", userId);

    return { orderId: order.id, checkoutUrl: session.url };
  });
