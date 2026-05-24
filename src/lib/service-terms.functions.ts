import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const UpsertSchema = z.object({
  id: z.string().uuid().optional(),
  artistId: z.string().uuid(),
  artist_name: z.string().min(2).max(200),
  artist_cpf: z.string().max(20).optional().nullable(),
  artist_address: z.string().max(500).optional().nullable(),
  client_name: z.string().min(2).max(200),
  client_cpf: z.string().max(20).optional().nullable(),
  client_phone: z.string().max(40).optional().nullable(),
  client_address: z.string().max(500).optional().nullable(),
  tattoo_description: z.string().min(2).max(2000),
  tattoo_value: z.number().min(0),
  campaign_code: z.string().max(50).optional().nullable(),
  is_prize: z.boolean().default(true),
  sessions_total: z.number().int().min(1).max(50).optional().nullable(),
  artist_signature: z.string().max(200).optional().nullable(),
  client_signature: z.string().max(200).optional().nullable(),
  client_receipt_signature: z.string().max(200).optional().nullable(),
});

export const upsertServiceTerm = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => UpsertSchema.parse(d))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: artist } = await supabase
      .from("tattoo_artists")
      .select("id, user_id")
      .eq("id", data.artistId)
      .maybeSingle();
    if (!artist || artist.user_id !== userId) throw new Error("Tatuador não encontrado.");

    const now = new Date().toISOString();
    const base: any = {
      artist_id: data.artistId,
      user_id: userId,
      artist_name: data.artist_name,
      artist_cpf: data.artist_cpf ?? null,
      artist_address: data.artist_address ?? null,
      client_name: data.client_name,
      client_cpf: data.client_cpf ?? null,
      client_phone: data.client_phone ?? null,
      client_address: data.client_address ?? null,
      tattoo_description: data.tattoo_description,
      tattoo_value: data.tattoo_value,
      campaign_code: data.campaign_code ?? null,
      is_prize: data.is_prize,
      sessions_total: data.sessions_total ?? null,
      artist_signature: data.artist_signature ?? null,
      artist_signed_at: data.artist_signature ? now : null,
      client_signature: data.client_signature ?? null,
      client_signed_at: data.client_signature ? now : null,
      client_receipt_signature: data.client_receipt_signature ?? null,
      client_received_at: data.client_receipt_signature ? now : null,
    };
    base.status =
      data.client_receipt_signature ? "completed" :
      (data.artist_signature && data.client_signature) ? "signed" : "draft";

    if (data.id) {
      const { error } = await supabase.from("service_terms").update(base).eq("id", data.id).eq("user_id", userId);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }
    const { data: row, error } = await supabase.from("service_terms").insert(base).select("id").single();
    if (error) throw new Error(error.message);
    return { id: row!.id };
  });

export const listMyServiceTerms = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("service_terms")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const deleteServiceTerm = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("service_terms").delete().eq("id", data.id).eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });