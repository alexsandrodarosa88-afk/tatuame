import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const CreateSchema = z.object({
  artistId: z.string().uuid(),
  winner_name: z.string().min(2).max(200),
  winner_cpf: z.string().max(20).optional().nullable(),
  winner_phone: z.string().max(40).optional().nullable(),
  winner_email: z.string().max(200).optional().nullable(),
  campaign_id: z.string().uuid().optional().nullable(),
  tattoo_value: z.number().min(0),
  is_partial: z.boolean().default(false),
  sessions_total: z.number().int().min(1).max(50).optional().nullable(),
  sessions_done: z.number().int().min(1).max(50).optional().nullable(),
  signed_term_url: z.string().url().max(1000),
  tattoo_photo_url: z.string().url().max(1000),
  extra_photo_url: z.string().url().max(1000).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export const createPayoutRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => CreateSchema.parse(d))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    // confirm artist ownership
    const { data: artist } = await supabase
      .from("tattoo_artists")
      .select("id, user_id")
      .eq("id", data.artistId)
      .maybeSingle();
    if (!artist || artist.user_id !== userId) throw new Error("Tatuador não encontrado.");
    const { error, data: row } = await supabase.from("payout_requests").insert({
      artist_id: data.artistId,
      user_id: userId,
      campaign_id: data.campaign_id ?? null,
      winner_name: data.winner_name,
      winner_cpf: data.winner_cpf ?? null,
      winner_phone: data.winner_phone ?? null,
      winner_email: data.winner_email ?? null,
      tattoo_value: data.tattoo_value,
      is_partial: data.is_partial,
      sessions_total: data.sessions_total ?? null,
      sessions_done: data.sessions_done ?? null,
      signed_term_url: data.signed_term_url,
      tattoo_photo_url: data.tattoo_photo_url,
      extra_photo_url: data.extra_photo_url ?? null,
      notes: data.notes ?? null,
    }).select("id").single();
    if (error) throw new Error(error.message);
    return { id: row!.id };
  });

export const listMyPayoutRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("payout_requests")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });