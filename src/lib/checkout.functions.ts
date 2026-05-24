import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { createMpPreference, isMpSandbox } from "./mercadopago.server";

function adminClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

export const createPixCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { returnUrl: string }) => {
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

    // Load user profile for Mercado Pago payer
    const { data: profile } = await admin
      .from("profiles")
      .select("nome_completo, cpf, email, telefone")
      .eq("id", userId)
      .maybeSingle();

    if (!profile?.nome_completo || !profile?.cpf) {
      throw new Error("Complete seu cadastro (nome e CPF) antes de finalizar a compra.");
    }
    const cleanCpf = String(profile.cpf).replace(/\D/g, "");
    if (cleanCpf.length !== 11 && cleanCpf.length !== 14) {
      throw new Error("CPF inválido no seu cadastro.");
    }

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

    // ===== MERCADO PAGO =====
    const origin = new URL(data.returnUrl).origin;
    const notificationUrl = `${origin}/api/public/mercadopago-webhook`;

    const items = rows.map((r) => ({
      title: `Cota TATUAME`,
      description: `Tatuagem premiada — ${r.quantity}x cota`,
      quantity: r.quantity,
      unit_price: Number(r.campaigns.price_per_quota),
    }));

    const [firstName, ...rest] = profile.nome_completo.trim().split(/\s+/);
    const phoneDigits = profile.telefone ? String(profile.telefone).replace(/\D/g, "") : "";
    const phone =
      phoneDigits.length >= 10
        ? { area_code: phoneDigits.slice(0, 2), number: phoneDigits.slice(2) }
        : undefined;

    const preference = await createMpPreference({
      items,
      payer: {
        name: firstName,
        surname: rest.join(" ") || undefined,
        email: profile.email ?? undefined,
        identification: cleanCpf.length === 11
          ? { type: "CPF", number: cleanCpf }
          : { type: "CNPJ", number: cleanCpf },
        phone,
      } as any,
      externalReference: order.id,
      notificationUrl,
      backUrls: {
        success: `${data.returnUrl}?order_id=${order.id}`,
        failure: `${data.returnUrl}?order_id=${order.id}&canceled=1`,
        pending: `${data.returnUrl}?order_id=${order.id}&pending=1`,
      },
      expiresInMinutes: 30,
    });

    const checkoutUrl: string | undefined = isMpSandbox()
      ? preference?.sandbox_init_point || preference?.init_point
      : preference?.init_point;
    if (!checkoutUrl) {
      console.error("MP preference sem init_point:", preference);
      throw new Error("Mercado Pago não retornou URL de pagamento.");
    }

    if (preference?.id) {
      await admin
        .from("orders")
        .update({ asaas_payment_id: preference.id })
        .eq("id", order.id);
    }

    // Clear cart
    await admin.from("cart_items").delete().eq("user_id", userId);

    return { orderId: order.id, checkoutUrl };
  });
