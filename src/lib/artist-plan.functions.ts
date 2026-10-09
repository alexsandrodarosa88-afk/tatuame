import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

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

