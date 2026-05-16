import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getCart = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("cart_items")
      .select("id, quantity, campaign_id, campaigns(id, tattoo_value, price_per_quota, total_quotas, sold_quotas, title)")
      .eq("user_id", userId);
    if (error) {
      console.error("getCart error:", error);
      throw new Error("Não foi possível carregar o carrinho.");
    }
    return data ?? [];
  });

export const upsertCartItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ campaign_id: z.string().uuid(), quantity: z.number().int().min(1).max(50) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("cart_items")
      .upsert({ user_id: userId, campaign_id: data.campaign_id, quantity: data.quantity }, { onConflict: "user_id,campaign_id" });
    if (error) {
      console.error("upsertCartItem error:", error);
      throw new Error("Não foi possível atualizar o carrinho.");
    }
    return { ok: true };
  });

export const removeCartItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("cart_items").delete().eq("id", data.id).eq("user_id", userId);
    if (error) {
      console.error("removeCartItem error:", error);
      throw new Error("Não foi possível remover o item.");
    }
    return { ok: true };
  });

export const getMyParticipations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("participations")
      .select("id, lucky_number, created_at, campaigns(id, tattoo_value, title, ends_at, status)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("getMyParticipations error:", error);
      throw new Error("Não foi possível carregar suas participações.");
    }
    return data ?? [];
  });

export const getMyCredits = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("credits")
      .select("id, amount, used_amount, valid_until, created_at")
      .eq("user_id", userId)
      .gt("valid_until", new Date().toISOString())
      .order("created_at", { ascending: false });
    if (error) {
      console.error("getMyCredits error:", error);
      throw new Error("Não foi possível carregar seus créditos.");
    }
    return data ?? [];
  });

export const getMyOrder = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: order, error } = await supabase
      .from("orders")
      .select("id, status, total_amount, pix_qr_code, pix_copy_paste, expires_at, paid_at, created_at, order_items(id, quantity, unit_price, campaigns(id, tattoo_value, title))")
      .eq("id", data.id)
      .eq("user_id", userId)
      .single();
    if (error) {
      console.error("getMyOrder error:", error);
      throw new Error("Não foi possível carregar o pedido.");
    }
    return order;
  });
