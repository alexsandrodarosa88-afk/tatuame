import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { createMpPreference, isMpSandbox } from "./mercadopago.server";

export const ARTIST_MONTHLY_FEE = 39.9;

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
  .inputValidator((data: { billingType: "PIX" | "CREDIT_CARD"; returnUrl?: string }) => {
    if (data.billingType !== "PIX" && data.billingType !== "CREDIT_CARD") {
      throw new Error("Forma de pagamento inválida");
    }
    return data;
  })
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const admin = adminClient();

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
    const phoneDigits = phoneRaw ? String(phoneRaw).replace(/\D/g, "") : "";

    if (!fullName || fullName.length < 3) throw new Error("Preencha seus dados (nome) antes de assinar.");
    if (cleanCpf.length !== 11) throw new Error("CPF inválido nos seus dados.");

    // ===== MERCADO PAGO — invoice for current month =====
    const returnUrl = data.returnUrl ?? "https://tatuame.com/tatuador/assinatura";
    const origin = new URL(returnUrl).origin;
    const notificationUrl = `${origin}/api/public/mercadopago-webhook`;
    const nowMonth = firstOfMonth(new Date());
    const dueDate = new Date().toISOString().slice(0, 10);

    // Reuse existing pending invoice for this month if present
    const { data: existingPending } = await admin
      .from("artist_subscriptions")
      .select("id, asaas_payment_id, invoice_url")
      .eq("artist_id", artist.id)
      .eq("reference_month", nowMonth)
      .eq("status", "pending")
      .maybeSingle();

    if (existingPending?.invoice_url) {
      await admin
        .from("tattoo_artists")
        .update({ subscription_billing_type: data.billingType })
        .eq("id", artist.id);
      return { invoiceUrl: existingPending.invoice_url, subscriptionId: existingPending.asaas_payment_id };
    }

    const [firstName, ...rest] = fullName.trim().split(/\s+/);
    const phone =
      phoneDigits.length >= 10
        ? { area_code: phoneDigits.slice(0, 2), number: phoneDigits.slice(2) }
        : undefined;

    const preference = await createMpPreference({
      items: [
        {
          title: "Mensalidade TATUAME — Tatuador",
          description: `Referência ${nowMonth}`,
          quantity: 1,
          unit_price: ARTIST_MONTHLY_FEE,
        },
      ],
      payer: {
        name: firstName,
        surname: rest.join(" ") || undefined,
        email,
        identification: { type: "CPF", number: cleanCpf },
        phone,
      } as any,
      externalReference: `artist_sub:${artist.id}`,
      notificationUrl,
      backUrls: {
        success: `${returnUrl}?paid=1`,
        failure: `${returnUrl}?canceled=1`,
        pending: `${returnUrl}?pending=1`,
      },
      expiresInMinutes: 60 * 24 * 7, // 7 dias
    });

    const invoiceUrl: string | undefined = isMpSandbox()
      ? preference?.sandbox_init_point || preference?.init_point
      : preference?.init_point;
    if (!invoiceUrl) {
      console.error("MP preference sub sem init_point:", preference);
      throw new Error("Mercado Pago não retornou URL de pagamento.");
    }

    await admin
      .from("tattoo_artists")
      .update({
        asaas_subscription_id: preference.id ?? null,
        subscription_billing_type: data.billingType,
        subscription_status: "pending",
        subscription_next_due: dueDate,
      })
      .eq("id", artist.id);

    if (existingPending) {
      await admin
        .from("artist_subscriptions")
        .update({
          asaas_payment_id: preference.id,
          invoice_url: invoiceUrl,
          billing_type: data.billingType,
          due_date: dueDate,
        })
        .eq("id", existingPending.id);
    } else {
      await admin.from("artist_subscriptions").insert({
        artist_id: artist.id,
        reference_month: nowMonth,
        amount: ARTIST_MONTHLY_FEE,
        status: "pending",
        due_date: dueDate,
        asaas_payment_id: preference.id,
        invoice_url: invoiceUrl,
        billing_type: data.billingType,
      });
    }

    return { invoiceUrl, subscriptionId: preference.id };
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
      .select("invoice_url")
      .eq("id", data.invoiceId)
      .eq("artist_id", artist.id)
      .maybeSingle();
    if (!row) throw new Error("Fatura não encontrada.");
    if (row.invoice_url) return { invoiceUrl: row.invoice_url };
    throw new Error("Fatura sem link. Gere uma nova.");
  });