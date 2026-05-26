import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function assertAdmin(supabase: any, userId: string) {
  const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  const isAdmin = (roles ?? []).some((r: any) => r.role === "admin");
  if (!isAdmin) throw new Error("Acesso negado");
}

export const adminUpdateUserPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      userId: z.string().uuid(),
      newPassword: z.string().min(6).max(72),
    }).parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      password: data.newPassword,
    });
    if (error) throw new Error("Erro ao atualizar senha: " + error.message);
    return { ok: true };
  });

export const adminDeleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ userId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    if (data.userId === context.userId) throw new Error("Você não pode excluir sua própria conta");
    // Cascading deletes via auth.users FK should handle related rows for tables that reference auth.users.
    // For other tables, clean up first.
    await supabaseAdmin.from("tattoo_artists").delete().eq("user_id", data.userId);
    await supabaseAdmin.from("profiles").delete().eq("id", data.userId);
    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId);
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error("Erro ao excluir usuário: " + error.message);
    return { ok: true };
  });

export const adminUpdateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      userId: z.string().uuid(),
      email: z.string().email().max(255).optional().nullable(),
      nome_completo: z.string().max(255).optional().nullable(),
      telefone: z.string().max(50).optional().nullable(),
      cpf: z.string().max(20).optional().nullable(),
      cidade: z.string().max(120).optional().nullable(),
    }).parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    const { userId, email, ...profilePatch } = data;
    const { error: pErr } = await supabaseAdmin.from("profiles").update({
      ...profilePatch,
      ...(email ? { email } : {}),
      updated_at: new Date().toISOString(),
    }).eq("id", userId);
    if (pErr) throw new Error("Erro ao atualizar perfil: " + pErr.message);
    if (email) {
      const { error: aErr } = await supabaseAdmin.auth.admin.updateUserById(userId, { email });
      if (aErr) throw new Error("Erro ao atualizar email de login: " + aErr.message);
    }
    return { ok: true };
  });