import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  POLICY_VERSION,
  ARTIST_POLICY_VERSION,
  policiesAsText,
  artistPoliciesAsText,
} from "@/lib/policies";

export const getMyPolicyStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const [{ data: acceptances }, { data: paidOrders }] = await Promise.all([
      supabase
        .from("policy_acceptances")
        .select("id, version, accepted_at")
        .eq("user_id", userId)
        .eq("policy_type", "client")
        .order("accepted_at", { ascending: false }),
      supabase
        .from("orders")
        .select("id")
        .eq("user_id", userId)
        .eq("status", "paid")
        .limit(1),
    ]);

    const latest = (acceptances ?? [])[0] ?? null;
    const acceptedCurrent = latest?.version === POLICY_VERSION;
    const hasPaid = (paidOrders ?? []).length > 0;

    return {
      currentVersion: POLICY_VERSION,
      acceptedCurrent,
      hasPaidOrder: hasPaid,
      mustAccept: hasPaid && !acceptedCurrent,
      latest,
      history: acceptances ?? [],
    };
  });

export const acceptPolicy = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ userAgent: z.string().max(500).optional() }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("policy_acceptances").insert({
      user_id: userId,
      version: POLICY_VERSION,
      content_snapshot: policiesAsText(),
      user_agent: data.userAgent ?? null,
      policy_type: "client",
    });
    if (error) throw new Error("Não foi possível registrar o aceite: " + error.message);
    return { ok: true, version: POLICY_VERSION };
  });

// ============ ARTIST POLICIES ============

export const getMyArtistPolicyStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [{ data: acceptances }, { data: artistRow }] = await Promise.all([
      supabase
        .from("policy_acceptances")
        .select("id, version, accepted_at")
        .eq("user_id", userId)
        .eq("policy_type", "artist")
        .order("accepted_at", { ascending: false }),
      supabase
        .from("tattoo_artists")
        .select("id, subscription_status, is_lifetime_free")
        .eq("user_id", userId)
        .maybeSingle(),
    ]);
    const latest = (acceptances ?? [])[0] ?? null;
    const acceptedCurrent = latest?.version === ARTIST_POLICY_VERSION;
    const hasAccess =
      !!artistRow &&
      (artistRow.is_lifetime_free === true || artistRow.subscription_status === "active");
    return {
      currentVersion: ARTIST_POLICY_VERSION,
      acceptedCurrent,
      hasAccess,
      mustAccept: hasAccess && !acceptedCurrent,
      latest,
      history: acceptances ?? [],
    };
  });

export const acceptArtistPolicy = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ userAgent: z.string().max(500).optional() }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("policy_acceptances").insert({
      user_id: userId,
      version: ARTIST_POLICY_VERSION,
      content_snapshot: artistPoliciesAsText(),
      user_agent: data.userAgent ?? null,
      policy_type: "artist",
    });
    if (error) throw new Error("Não foi possível registrar o aceite: " + error.message);
    return { ok: true, version: ARTIST_POLICY_VERSION };
  });

export const adminGetUserAcceptances = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ userId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    const isAdmin = (roles ?? []).some((r: any) => r.role === "admin");
    if (!isAdmin) throw new Error("Acesso negado");
    const { data: rows, error } = await supabase
      .from("policy_acceptances")
      .select("id, version, accepted_at, content_snapshot, user_agent, ip_address")
      .eq("user_id", data.userId)
      .order("accepted_at", { ascending: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });