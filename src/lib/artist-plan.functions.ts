import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { createMpPreference, isMpSandbox } from "./mercadopago.server";

export const PREMIUM_MONTHLY = 49.9;
export const PREMIUM_6 = +(PREMIUM_MONTHLY * 6).toFixed(2); // 299.40
export const PREMIUM_12 = +(PREMIUM_MONTHLY * 12).toFixed(2); // 598.80

function adminClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

/** Monday of the current week (UTC date) */
function currentWeekStart(): string {
  const d = new Date();
  const day = d.getUTCDay(); // 0..6 (Sun..Sat)
  const diff = (day + 6) % 7; // days since Monday
  d.setUTCDate(d.getUTCDate() - diff);
  return d.toISOString().slice(0, 10);
}

export const getMyArtistPlan = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: artist } = await supabase
      .from("tattoo_artists")
      .select("id, name, plan, plan_term_months, plan_expires_at, is_lifetime_free, subscription_status")
      .eq("user_id", userId)
      .maybeSingle();
    if (!artist) return { artistFound: false as const };
    const now = Date.now();
    const expiresAt = artist.plan_expires_at ? new Date(artist.plan_expires_at).getTime() : null;
    const premiumActive = !!(
      artist.is_lifetime_free ||
      (artist.plan === "premium" && expiresAt !== null && expiresAt > now)
    );
    return {
      artistFound: true as const,
      artistId: artist.id,
      plan: (artist.plan ?? "free") as "free" | "premium",
      planTermMonths: artist.plan_term_months,
      planExpiresAt: artist.plan_expires_at,
      premiumActive,
      isLifetimeFree: !!artist.is_lifetime_free,
      prices: { monthly: PREMIUM_MONTHLY, six: PREMIUM_6, twelve: PREMIUM_12 },
    };
  });

/** Tatuador escolhe plano Free — não dá direito a rateio mas libera o resto */
export const chooseFreePlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: artist } = await supabase
      .from("tattoo_artists")
      .select("id, plan, is_lifetime_free")
      .eq("user_id", userId)
      .maybeSingle();
    if (!artist) throw new Error("Cadastro de tatuador não aprovado.");
    if (artist.is_lifetime_free) throw new Error("Sua conta é vitalícia gratuita.");
    const { error } = await supabase
      .from("tattoo_artists")
      .update({ plan: "free" })
      .eq("id", artist.id);
    if (error) throw new Error("Não foi possível mudar o plano.");
    return { ok: true };
  });

/** Tatuador compra pacote Premium 6 ou 12 meses (pagamento via Mercado Pago) */
export const createPremiumCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { termMonths: 6 | 12; returnUrl?: string }) => {
    if (data.termMonths !== 6 && data.termMonths !== 12) {
      throw new Error("Escolha 6 ou 12 meses.");
    }
    return data;
  })
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const admin = adminClient();

    const { data: artist } = await supabase
      .from("tattoo_artists")
      .select("id, name")
      .eq("user_id", userId)
      .maybeSingle();
    if (!artist) throw new Error("Cadastro de tatuador não aprovado.");

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

    const fullName = profile?.nome_completo ?? application?.full_name ?? artist.name;
    const cpfRaw = profile?.cpf ?? application?.cpf ?? "";
    const cleanCpf = String(cpfRaw).replace(/\D/g, "");
    const email = profile?.email ?? application?.email ?? undefined;
    if (!fullName || cleanCpf.length !== 11) {
      throw new Error("Preencha seus dados (nome e CPF) antes de assinar o Premium.");
    }

    const amount = data.termMonths === 12 ? PREMIUM_12 : PREMIUM_6;
    const returnUrl = data.returnUrl ?? "https://tatuame.com/tatuador/plano";
    const origin = new URL(returnUrl).origin;
    const notificationUrl = `${origin}/api/public/mercadopago-webhook`;
    const [firstName, ...rest] = fullName.trim().split(/\s+/);

    const refMonth = new Date().toISOString().slice(0, 7) + "-01";
    const { data: invoice, error: invErr } = await admin
      .from("artist_subscriptions")
      .insert({
        artist_id: artist.id,
        reference_month: refMonth,
        amount,
        status: "pending",
        due_date: new Date().toISOString().slice(0, 10),
        term_months: data.termMonths,
        notes: `Pacote Premium ${data.termMonths} meses`,
      })
      .select("id")
      .single();
    if (invErr || !invoice) {
      // pode haver constraint de unique (artist_id, reference_month) — reutilizar a existente
      const { data: existing } = await admin
        .from("artist_subscriptions")
        .select("id")
        .eq("artist_id", artist.id)
        .eq("reference_month", refMonth)
        .eq("status", "pending")
        .maybeSingle();
      if (!existing) throw new Error("Não foi possível criar a fatura.");
      await admin
        .from("artist_subscriptions")
        .update({
          amount,
          term_months: data.termMonths,
          notes: `Pacote Premium ${data.termMonths} meses`,
        })
        .eq("id", existing.id);
    }

    const invoiceId = invoice?.id ?? (await admin
      .from("artist_subscriptions")
      .select("id")
      .eq("artist_id", artist.id)
      .eq("reference_month", refMonth)
      .eq("status", "pending")
      .single()).data!.id;

    const preference = await createMpPreference({
      items: [{
        title: `TATUAME Premium — ${data.termMonths} meses`,
        description: `Acesso Premium com direito a rateio (${data.termMonths} meses)`,
        quantity: 1,
        unit_price: amount,
      }],
      payer: {
        name: firstName,
        surname: rest.join(" ") || undefined,
        email,
        identification: { type: "CPF", number: cleanCpf },
      } as any,
      externalReference: `artist_plan:${artist.id}:${data.termMonths}:${invoiceId}`,
      notificationUrl,
      backUrls: {
        success: `${returnUrl}?paid=1`,
        failure: `${returnUrl}?canceled=1`,
        pending: `${returnUrl}?pending=1`,
      },
      expiresInMinutes: 60 * 24 * 7,
    });

    const invoiceUrl: string | undefined = isMpSandbox()
      ? preference?.sandbox_init_point || preference?.init_point
      : preference?.init_point;
    if (!invoiceUrl) throw new Error("Mercado Pago não retornou URL de pagamento.");

    await admin
      .from("artist_subscriptions")
      .update({ asaas_payment_id: preference.id, invoice_url: invoiceUrl, billing_type: "PIX" })
      .eq("id", invoiceId);

    return { invoiceUrl, invoiceId };
  });

/** ===== Promotion tasks ===== */

export const getMyPromotionWeek = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: artist } = await supabase
      .from("tattoo_artists")
      .select("id, plan")
      .eq("user_id", userId)
      .maybeSingle();
    if (!artist) throw new Error("Tatuador não encontrado.");
    const week = currentWeekStart();
    const admin = adminClient();
    await admin.rpc("ensure_week_promotion_tasks", { _artist_id: artist.id, _week_start: week });
    const { data: tasks } = await supabase
      .from("artist_promotion_tasks")
      .select("id, task_type, task_index, status, instagram_url, submitted_at, reviewed_at, notes")
      .eq("artist_id", artist.id)
      .eq("week_start", week)
      .order("task_type")
      .order("task_index");
    return { weekStart: week, tasks: tasks ?? [] };
  });

export const submitPromotionTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { taskId: string; instagramUrl?: string }) => {
    if (!data.taskId) throw new Error("taskId obrigatório");
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
    const { error } = await supabase
      .from("artist_promotion_tasks")
      .update({
        status: "submitted",
        instagram_url: data.instagramUrl ?? null,
        submitted_at: new Date().toISOString(),
      })
      .eq("id", data.taskId)
      .eq("artist_id", artist.id);
    if (error) throw new Error("Não foi possível enviar.");
    return { ok: true };
  });

/** ===== Admin: revisão das tarefas ===== */

export const adminListPromotionQueue = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Apenas admins.");
    const { data } = await supabase
      .from("artist_promotion_tasks")
      .select("id, artist_id, week_start, task_type, task_index, status, instagram_url, submitted_at, reviewed_at, notes, tattoo_artists(name)")
      .in("status", ["submitted", "approved", "rejected"])
      .order("submitted_at", { ascending: false })
      .limit(200);
    return { items: data ?? [] };
  });

export const adminReviewPromotionTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { taskId: string; approve: boolean; notes?: string }) => {
    if (!data.taskId) throw new Error("taskId obrigatório");
    return data;
  })
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Apenas admins.");
    const { error } = await supabase
      .from("artist_promotion_tasks")
      .update({
        status: data.approve ? "approved" : "rejected",
        reviewed_at: new Date().toISOString(),
        reviewed_by: userId,
        notes: data.notes ?? null,
      })
      .eq("id", data.taskId);
    if (error) throw new Error("Falha ao revisar.");
    return { ok: true };
  });

/** Admin: muda plano ou estende vencimento manualmente */
export const adminSetArtistPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { artistId: string; plan: "free" | "premium"; termMonths?: 6 | 12 }) => {
    if (!data.artistId) throw new Error("artistId obrigatório");
    if (data.plan !== "free" && data.plan !== "premium") throw new Error("Plano inválido");
    return data;
  })
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Apenas admins.");
    const admin = adminClient();
    if (data.plan === "premium") {
      const term = data.termMonths ?? 6;
      await admin.rpc("activate_premium_plan", { _artist_id: data.artistId, _term_months: term });
    } else {
      await admin
        .from("tattoo_artists")
        .update({ plan: "free", plan_term_months: null, plan_expires_at: null })
        .eq("id", data.artistId);
    }
    return { ok: true };
  });