import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { artistQuestionnaireSchema } from "./artist-questionnaire";

export const submitArtistQuestionnaire = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => artistQuestionnaireSchema.parse(input))
  .handler(async ({ data }) => {
    // This public operation only inserts validated pending applications. It never
    // accepts status, owner or review fields, or returns applicants' private data.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("artist_partner_applications").insert(data);
    if (error) throw new Error("Não foi possível enviar seu cadastro. Tente novamente.");
    return { ok: true };
  });

export const reviewArtistQuestionnaire = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({
    id: z.string().uuid(), approve: z.boolean(), notes: z.string().trim().max(1000).optional(),
  }).strict().parse(input))
  .handler(async ({ context, data }) => {
    const { data: admin, error: roleError } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (roleError || !admin) throw new Error("Acesso permitido apenas ao admin.");
    const { error } = await context.supabase.rpc("review_partner_application", {
      _application_id: data.id, _approve: data.approve, _notes: data.notes,
    });
    if (error) throw new Error("Não foi possível revisar o cadastro.");
    return { ok: true };
  });