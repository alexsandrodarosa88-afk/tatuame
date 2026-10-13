import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const startMercadoPagoCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ orderId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    try {
      const token = process.env["MERCADOPAGO_ACCESS_TOKEN"];
      if (!token) throw new Error("A conexão com Mercado Pago não está configurada");
      const { data: order, error } = await context.supabase.from("orders").select("*, campaigns(title)").eq("id", data.orderId).eq("user_id", context.userId).single();
      if (error || !order) throw new Error("Pedido não encontrado");
      if (order.status !== "pendente") throw new Error("Este pedido não está aguardando pagamento");
      if (order.mp_checkout_url) return { url: order.mp_checkout_url };
      if (Number(order.total) <= 0) throw new Error("O valor do pedido precisa ser maior que zero");
      const { mercadoPagoRequest } = await import("./mercadopago.server");
      const origin = new URL(getRequest().url).origin;
      const result = await mercadoPagoRequest("/checkout/preferences", token, {
        items: [{ id: order.campaign_id, title: `${order.campaigns?.title || "TATUAME"} — ${order.quantity} cotas`, quantity: 1, unit_price: Number(order.total), currency_id: "BRL" }],
        external_reference: order.id,
        metadata: { tatuame_order_id: order.id },
        back_urls: { success: `${origin}/conta`, pending: `${origin}/conta`, failure: `${origin}/conta` },
        ...(origin.startsWith("https://") ? { auto_return: "approved", notification_url: `${origin}/api/public/mercadopago/webhook` } : {}),
      }, order.id);
      if (typeof result.init_point !== "string" || !/^https:\/\/[a-z0-9.-]*mercadopago\.com\.br\//.test(result.init_point)) throw new Error("Mercado Pago não retornou um link válido");
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { error: saveError } = await supabaseAdmin.from("orders").update({ mp_preference_id: result.id, mp_checkout_url: result.init_point }).eq("id", order.id).eq("status", "pendente");
      if (saveError) throw new Error(saveError.message);
      return { url: result.init_point };
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Não foi possível abrir o Mercado Pago" };
    }
  });

export const refreshMercadoPagoPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ orderId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    try {
      const token = process.env["MERCADOPAGO_ACCESS_TOKEN"];
      if (!token) throw new Error("Mercado Pago não configurado");
      const { data: order } = await context.supabase.from("orders").select("id, mp_preference_id").eq("id", data.orderId).eq("user_id", context.userId).single();
      if (!order) throw new Error("Pedido não encontrado");
      if (!order.mp_preference_id) return { ok: true };
      const { mercadoPagoRequest, reconcileMercadoPago } = await import("./mercadopago.server");
      const search = await mercadoPagoRequest(`/v1/payments/search?external_reference=${encodeURIComponent(order.id)}&sort=date_created&criteria=desc&limit=20`, token);
      for (const payment of search.results ?? []) {
        if (payment.external_reference === order.id) await reconcileMercadoPago(String(payment.id), token);
      }
      return { ok: true };
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Não foi possível verificar o pagamento" };
    }
  });