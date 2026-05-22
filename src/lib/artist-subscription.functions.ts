import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export const ARTIST_MONTHLY_FEE = 39.9;

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
    console.error("Asaas API error (artist sub):", res.status, msg);
    throw new Error("Asaas: " + msg);
  }
  return json;
}

function firstOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

export const getMyArtistSubscription = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: artist } = await supabase
      .from("tattoo_artists")
      .select("id, subscription_status, subscription_next_due, subscription_billing_type, asaas_subscription_id")
      .eq("user_id", userId)
      .maybeSingle();
    if (!artist) return { artistFound: false as const };

    const { data: pending } = await supabase
      .from("artist_subscriptions")
      .select("id, amount, status, reference_month, due_date, invoice_url, billing_type")
      .eq("artist_id", artist.id)
      .eq("status", "pending")
      .order("reference_month", { ascending: false })
      .limit(1)
      .maybeSingle();

    return {
      artistFound: true as const,
      status: artist.subscription_status as "pending" | "active" | "overdue" | "canceled",
      nextDue: artist.subscription_next_due,
      billingType: artist.subscription_billing_type,
      hasSubscription: !!artist.asaas_subscription_id,
      monthlyFee: ARTIST_MONTHLY_FEE,
      pendingInvoice: pending
        ? {
            id: pending.id,
            amount: Number(pending.amount),
            referenceMonth: pending.reference_month,
            dueDate: pending.due_date,
            invoiceUrl: pending.invoice_url,
            billingType: pending.billing_type,
          }
        : null,
    };
  });

export const createArtistSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { billingType: "PIX" | "CREDIT_CARD" }) => {
    if (data.billingType !== "PIX" && data.billingType !== "CREDIT_CARD") {
      throw new Error("Forma de pagamento inválida");
    }
    return data;
  })
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const admin = adminClient();

    // Load artist + profile
    const { data: artist, error: artistErr } = await supabase
      .from("tattoo_artists")
      .select("id, name, asaas_customer_id, asaas_subscription_id")
      .eq("user_id", userId)
      .maybeSingle();
    if (artistErr) throw new Error("Falha ao carregar tatuador.");
    if (!artist) throw new Error("Cadastro de tatuador não aprovado.");

    const { data: bank } = await admin
      .from("artist_bank_details")
      .select("full_name, cpf, email, phone")
      .eq("artist_id", artist.id)
      .maybeSingle();
    const { data: profile } = await admin
      .from("profiles")
      .select("nome_completo, cpf, email, telefone")
      .eq("id", userId)
      .maybeSingle();
    const { data: application } = await admin
      .from("artist_applications")
      .select("full_name, cpf, email, phone")
      .eq("user_id", userId)
      .maybeSingle();

    const fullName = bank?.full_name ?? profile?.nome_completo ?? application?.full_name ?? artist.name;
    const cpfRaw = bank?.cpf ?? profile?.cpf ?? application?.cpf ?? "";
    const cleanCpf = String(cpfRaw).replace(/\D/g, "");
    const email = bank?.email ?? profile?.email ?? application?.email ?? undefined;
    const phoneRaw = bank?.phone ?? profile?.telefone ?? application?.phone ?? "";
    const phone = phoneRaw ? String(phoneRaw).replace(/\D/g, "") : undefined;

    if (!fullName || fullName.length < 3) throw new Error("Preencha seus dados (nome) antes de assinar.");
    if (cleanCpf.length !== 11) throw new Error("CPF inválido nos seus dados.");

    // 1. Create or fetch Asaas customer
    let customerId = artist.asaas_customer_id ?? null;
    if (!customerId) {
      const existing = await asaasFetch(`/customers?cpfCnpj=${cleanCpf}&limit=1`);
      if (existing?.data?.[0]?.id) {
        customerId = existing.data[0].id;
      } else {
        const created = await asaasFetch(`/customers`, {
          method: "POST",
          body: JSON.stringify({
            name: fullName,
            cpfCnpj: cleanCpf,
            email,
            mobilePhone: phone,
            externalReference: `artist:${artist.id}`,
          }),
        });
        customerId = created.id;
      }
      await admin.from("tattoo_artists").update({ asaas_customer_id: customerId }).eq("id", artist.id);
    }

    // 2. Cancel previous subscription if any (different billing type)
    if (artist.asaas_subscription_id) {
      try {
        await asaasFetch(`/subscriptions/${artist.asaas_subscription_id}`, { method: "DELETE" });
      } catch (e) {
        console.warn("Falha ao cancelar assinatura anterior:", e);
      }
    }

    // 3. Create subscription — first due today (so first invoice is generated now)
    const nextDueDate = new Date().toISOString().slice(0, 10);
    const sub = await asaasFetch(`/subscriptions`, {
      method: "POST",
      body: JSON.stringify({
        customer: customerId,
        billingType: data.billingType,
        cycle: "MONTHLY",
        value: ARTIST_MONTHLY_FEE,
        nextDueDate,
        description: `Mensalidade TATUAME — Tatuador`,
        externalReference: `artist_sub:${artist.id}`,
      }),
    });

    // 4. Find first generated payment to grab invoiceUrl
    let invoiceUrl: string | undefined;
    let firstPaymentId: string | undefined;
    try {
      const payments = await asaasFetch(`/subscriptions/${sub.id}/payments`);
      const p = payments?.data?.[0];
      if (p) {
        invoiceUrl = p.invoiceUrl;
        firstPaymentId = p.id;
      }
    } catch (e) {
      console.warn("Não foi possível buscar fatura inicial:", e);
    }

    // 5. Save to DB
    await admin
      .from("tattoo_artists")
      .update({
        asaas_subscription_id: sub.id,
        subscription_billing_type: data.billingType,
        subscription_status: "pending",
        subscription_next_due: nextDueDate,
      })
      .eq("id", artist.id);

    if (firstPaymentId) {
      await admin.from("artist_subscriptions").insert({
        artist_id: artist.id,
        reference_month: firstOfMonth(new Date()),
        amount: ARTIST_MONTHLY_FEE,
        status: "pending",
        due_date: nextDueDate,
        asaas_payment_id: firstPaymentId,
        invoice_url: invoiceUrl ?? null,
        billing_type: data.billingType,
      });
    }

    return { invoiceUrl: invoiceUrl ?? null, subscriptionId: sub.id };
  });

export const getArtistInvoiceUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { invoiceId: string }) => {
    if (!data.invoiceId) throw new Error("invoiceId obrigatório");
    return data;
  })
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: artist } = await supabase
      .from("tattoo_artists")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();
    if (!artist) throw new Error("Tatuador não encontrado.");

    const { data: row } = await supabase
      .from("artist_subscriptions")
      .select("invoice_url, asaas_payment_id")
      .eq("id", data.invoiceId)
      .eq("artist_id", artist.id)
      .maybeSingle();
    if (!row) throw new Error("Fatura não encontrada.");
    if (row.invoice_url) return { invoiceUrl: row.invoice_url };
    if (!row.asaas_payment_id) throw new Error("Fatura sem identificador no Asaas.");

    const pay = await asaasFetch(`/payments/${row.asaas_payment_id}`);
    if (!pay?.invoiceUrl) throw new Error("Asaas não retornou link da fatura.");

    const admin = adminClient();
    await admin.from("artist_subscriptions").update({ invoice_url: pay.invoiceUrl }).eq("id", data.invoiceId);
    return { invoiceUrl: pay.invoiceUrl };
  });