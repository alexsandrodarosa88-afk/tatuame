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

function getAsaasConfig() {
  const key = process.env.ASAAS_API_KEY;
  if (!key) throw new Error("ASAAS_API_KEY não configurada");
  // Sandbox keys start with $aact_hmlg_ or contain 'hmlg'/'sandbox'; production with $aact_prod_
  const isSandbox = /hmlg|sandbox/i.test(key);
  const baseUrl = isSandbox
    ? "https://api-sandbox.asaas.com/v3"
    : "https://api.asaas.com/v3";
  return { key, baseUrl };
}

async function asaasFetch(path: string, init: RequestInit = {}) {
  const { key, baseUrl } = getAsaasConfig();
  const res = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      access_token: key,
      "User-Agent": "Tatuame",
      ...(init.headers ?? {}),
    },
  });
  const body = await res.text();
  let json: any = null;
  try { json = body ? JSON.parse(body) : null; } catch { /* keep raw */ }
  if (!res.ok) {
    const msg = json?.errors?.[0]?.description || json?.message || body || `HTTP ${res.status}`;
    console.error("Asaas API error:", res.status, msg);
    throw new Error("Asaas: " + msg);
  }
  return json;
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

    // Load user profile for Asaas customer
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

    // ===== ASAAS =====
    // 1. Create or fetch customer
    let customerId: string;
    const existing = await asaasFetch(`/customers?cpfCnpj=${cleanCpf}&limit=1`);
    if (existing?.data?.[0]?.id) {
      customerId = existing.data[0].id;
    } else {
      const created = await asaasFetch(`/customers`, {
        method: "POST",
        body: JSON.stringify({
          name: profile.nome_completo,
          cpfCnpj: cleanCpf,
          email: profile.email ?? undefined,
          mobilePhone: profile.telefone ? String(profile.telefone).replace(/\D/g, "") : undefined,
          externalReference: userId,
        }),
      });
      customerId = created.id;
    }

    // 2. Create payment (UNDEFINED = cliente escolhe PIX/cartão/boleto na página do Asaas)
    const dueDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const payment = await asaasFetch(`/payments`, {
      method: "POST",
      body: JSON.stringify({
        customer: customerId,
        billingType: "UNDEFINED",
        value: Number(total.toFixed(2)),
        dueDate,
        description: `Pedido TATUAME #${order.id.slice(0, 8)}`,
        externalReference: order.id,
        callback: {
          successUrl: `${data.returnUrl}?order_id=${order.id}`,
          autoRedirect: true,
        },
      }),
    });

    if (!payment?.invoiceUrl) {
      throw new Error("Asaas não retornou URL de pagamento.");
    }

    await admin
      .from("orders")
      .update({ asaas_payment_id: payment.id })
      .eq("id", order.id);

    // Clear cart
    await admin.from("cart_items").delete().eq("user_id", userId);

    return { orderId: order.id, checkoutUrl: payment.invoiceUrl };
  });
