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

// Converte um usuário cliente já existente em tatuador aprovado.
export const adminConvertToArtist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      userId: z.string().uuid(),
      fullName: z.string().min(2).max(200).optional(),
      address: z.string().max(500).optional().default(""),
      cpf: z.string().max(20).optional().default(""),
      phone: z.string().max(50).optional().nullable(),
      instagram: z.string().max(80).optional().nullable(),
      grantFreeMonth: z.boolean().optional().default(false),
    }).parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);

    // Get user info (auth + profile)
    const { data: userRes, error: uErr } = await supabaseAdmin.auth.admin.getUserById(data.userId);
    if (uErr || !userRes?.user) throw new Error("Usuário não encontrado");
    const email = userRes.user.email ?? "";

    const { data: prof } = await supabaseAdmin.from("profiles").select("nome_completo, telefone, cpf").eq("id", data.userId).maybeSingle();
    const fullName = (data.fullName?.trim() || prof?.nome_completo || email || "Tatuador").slice(0, 200);
    const cpf = data.cpf || prof?.cpf || "";
    const phone = data.phone ?? prof?.telefone ?? null;
    const instagram = (data.instagram ?? "").replace(/^@/, "") || null;

    // Upsert artist_application as approved
    const { data: existingApp } = await supabaseAdmin
      .from("artist_applications").select("id").eq("user_id", data.userId).maybeSingle();
    if (existingApp?.id) {
      const { error } = await supabaseAdmin.from("artist_applications").update({
        status: "approved", full_name: fullName, email, address: data.address || "",
        cpf, phone, instagram, reviewed_at: new Date().toISOString(), reviewed_by: context.userId,
      }).eq("id", existingApp.id);
      if (error) throw new Error("Erro ao atualizar cadastro: " + error.message);
    } else {
      const { error } = await supabaseAdmin.from("artist_applications").insert({
        user_id: data.userId, full_name: fullName, email, address: data.address || "",
        cpf, phone, instagram, status: "approved",
        reviewed_at: new Date().toISOString(), reviewed_by: context.userId,
      } as any);
      if (error) throw new Error("Erro ao criar cadastro: " + error.message);
    }

    // Ensure tattoo_artists row
    const { data: existingArtist } = await supabaseAdmin
      .from("tattoo_artists").select("id").eq("user_id", data.userId).maybeSingle();
    let artistId = existingArtist?.id as string | undefined;
    if (!artistId) {
      const { data: ins, error } = await supabaseAdmin.from("tattoo_artists").insert({
        user_id: data.userId, name: fullName, address: data.address || null, is_active: true,
      } as any).select("id").single();
      if (error) throw new Error("Erro ao criar tatuador: " + error.message);
      artistId = ins!.id;
    }

    if (data.grantFreeMonth && artistId) {
      const { error } = await supabaseAdmin.from("tattoo_artists").update({
        subscription_status: "active",
        is_active: true,
        subscription_started_at: new Date().toISOString(),
        subscription_next_due: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().slice(0, 10),
        free_month_granted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq("id", artistId);
      if (error) throw new Error("Erro ao aplicar mês grátis: " + error.message);
      await supabaseAdmin.from("artist_subscriptions").update({
        status: "canceled",
        notes: "[mês grátis concedido na conversão " + new Date().toISOString() + "]",
      }).eq("artist_id", artistId).eq("status", "pending");
    }

    return { ok: true, artistId };
  });

// Cria uma conta de tatuador completa (auth user + perfil + cadastro aprovado).
// O tatuador será obrigado a trocar a senha no primeiro acesso.
export const adminCreateArtistAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      email: z.string().email().max(255),
      password: z.string().min(6).max(72),
      fullName: z.string().min(2).max(200),
      cpf: z.string().max(20).optional().default(""),
      phone: z.string().max(50).optional().default(""),
      cidade: z.string().max(120).optional().default(""),
      address: z.string().max(500).optional().default(""),
      instagram: z.string().max(80).optional().default(""),
      grantFreeMonth: z.boolean().optional().default(false),
    }).parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);

    // Create auth user (email confirmed; flag forces password change on first login)
    const { data: created, error: cErr } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: {
        nome_completo: data.fullName,
        telefone: data.phone,
        cpf: data.cpf,
        cidade: data.cidade,
        must_change_password: true,
        created_by_admin: true,
      },
    });
    if (cErr || !created?.user) throw new Error("Erro ao criar usuário: " + (cErr?.message || "desconhecido"));
    const newUserId = created.user.id;

    // The handle_new_user trigger may have created the profile/role already.
    // Make sure profile has the data we want (idempotent upsert).
    await supabaseAdmin.from("profiles").upsert({
      id: newUserId,
      email: data.email,
      nome_completo: data.fullName,
      telefone: data.phone || null,
      cpf: data.cpf || null,
      cidade: data.cidade || null,
      updated_at: new Date().toISOString(),
    } as any);

    // Create approved artist_application
    await supabaseAdmin.from("artist_applications").upsert({
      user_id: newUserId,
      full_name: data.fullName,
      email: data.email,
      address: data.address || "",
      cpf: data.cpf || "",
      phone: data.phone || null,
      instagram: (data.instagram || "").replace(/^@/, "") || null,
      status: "approved",
      reviewed_at: new Date().toISOString(),
      reviewed_by: context.userId,
    } as any, { onConflict: "user_id" });

    // Create tattoo_artists row
    const { data: existingArtist } = await supabaseAdmin
      .from("tattoo_artists").select("id").eq("user_id", newUserId).maybeSingle();
    let artistId = existingArtist?.id as string | undefined;
    if (!artistId) {
      const { data: ins, error } = await supabaseAdmin.from("tattoo_artists").insert({
        user_id: newUserId, name: data.fullName, address: data.address || null,
        city: data.cidade || null, instagram: (data.instagram || "").replace(/^@/, "") || null,
        whatsapp: data.phone || null, is_active: true,
      } as any).select("id").single();
      if (error) throw new Error("Erro ao criar tatuador: " + error.message);
      artistId = ins!.id;
    }

    if (data.grantFreeMonth && artistId) {
      await supabaseAdmin.from("tattoo_artists").update({
        subscription_status: "active",
        is_active: true,
        subscription_started_at: new Date().toISOString(),
        subscription_next_due: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().slice(0, 10),
        free_month_granted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq("id", artistId);
    }

    return { ok: true, userId: newUserId, artistId };
  });