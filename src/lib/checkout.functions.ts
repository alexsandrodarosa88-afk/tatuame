import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { type StripeEnv, createStripeClient } from "@/lib/stripe.server";

function adminClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

export const createPixCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { environment: StripeEnv; returnUrl: string }) => {
    if (data.environment !== "sandbox" && data.environment !== "live")
      throw new Error("Invalid environment");
    if (!/^https?:\/\//.test(data.returnUrl)) throw new Error("Invalid returnUrl");
    return data;
  })
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;

    // Load cart
    const { data: cart, error: cartErr } = await supabase
      .from("cart_items")
      .select("quantity, campaign_id, campaigns(id, price_per_quota, total_quotas, sold_quotas, status)")
      .eq("user_id", userId);
    if (cartErr) {
      console.error("createPixCheckout cart error:", cartErr);
      throw new Error("Não foi possível carregar o carrinho.");
    }
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
    if (orderErr || !order) {
      if (orderErr) console.error("createPixCheckout order error:", orderErr);
      throw new Error("Falha ao criar pedido. Tente novamente.");
    }

    // Create order items
    const itemsPayload = rows.map((r) => ({
      order_id: order.id,
      campaign_id: r.campaign_id,
      quantity: r.quantity,
      unit_price: r.campaigns.price_per_quota,
    }));
    const { error: itemsErr } = await admin.from("order_items").insert(itemsPayload);
    if (itemsErr) {
      console.error("createPixCheckout items error:", itemsErr);
      throw new Error("Falha ao registrar itens do pedido.");
    }

    // Create Stripe Embedded Checkout Session with PIX
    const stripe = createStripeClient(data.environment);
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      ui_mode: "embedded_page",
      payment_method_types: ["pix"],
      return_url: `${data.returnUrl}?order_id=${order.id}&session_id={CHECKOUT_SESSION_ID}`,
      client_reference_id: order.id,
      metadata: { order_id: order.id, user_id: userId },
      payment_intent_data: { metadata: { order_id: order.id, user_id: userId } },
      line_items: rows.map((r) => ({
        price_data: {
          currency: "brl",
          product_data: { name: `Cota TATUAME — campanha ${r.campaign_id.slice(0, 8)}` },
          unit_amount: Math.round(Number(r.campaigns.price_per_quota) * 100),
        },
        quantity: r.quantity,
      })),
    });

    if (!session.client_secret) throw new Error("Falha ao criar sessão Stripe");

    await admin
      .from("orders")
      .update({ stripe_payment_intent_id: session.id })
      .eq("id", order.id);

    // Clear cart
    await admin.from("cart_items").delete().eq("user_id", userId);

    return { orderId: order.id, clientSecret: session.client_secret };
  });
