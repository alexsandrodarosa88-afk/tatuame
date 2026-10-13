import { timingSafeEqual, createHmac } from "node:crypto";

export async function mercadoPagoRequest(path: string, token: string, body?: unknown, idempotencyKey?: string) {
  const response = await fetch(`https://api.mercadopago.com${path}`, {
    method: body ? "POST" : "GET",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(idempotencyKey ? { "X-Idempotency-Key": idempotencyKey } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(`Mercado Pago (${response.status}): ${result.message || result.error || "Não foi possível processar o pagamento"}`);
  }
  return response.json();
}

export function verifyMercadoPagoWebhook(request: Request, secret: string): string | null {
  const url = new URL(request.url);
  const id = url.searchParams.get("data.id");
  const requestId = request.headers.get("x-request-id");
  const parts = Object.fromEntries((request.headers.get("x-signature") ?? "").split(",").map(p => p.trim().split("=")));
  if (!id || !/^\d+$/.test(id) || !requestId || !parts.ts || !/^\d+$/.test(parts.ts) || !/^[a-f0-9]{64}$/i.test(parts.v1 ?? "")) return null;
  const expected = createHmac("sha256", secret).update(`id:${id};request-id:${requestId};ts:${parts.ts};`).digest();
  const supplied = Buffer.from(parts.v1, "hex");
  return supplied.length === expected.length && timingSafeEqual(expected, supplied) ? id : null;
}

export async function reconcileMercadoPago(paymentId: string, token: string) {
  const payment = await mercadoPagoRequest(`/v1/payments/${encodeURIComponent(paymentId)}`, token);
  if (!payment.external_reference || !payment.metadata?.tatuame_order_id || payment.metadata.tatuame_order_id !== payment.external_reference) return;
  const account = await mercadoPagoRequest("/users/me", token);
  if (String(payment.collector_id) !== String(account.id) || payment.currency_id !== "BRL") throw new Error("Pagamento não corresponde à conta Mercado Pago do TATUAME");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin.rpc("apply_mercadopago_payment", {
    _order_id: payment.external_reference,
    _payment_id: String(payment.id),
    _amount: payment.transaction_amount,
    _status: payment.status,
  });
  if (error) throw new Error(error.message);
}