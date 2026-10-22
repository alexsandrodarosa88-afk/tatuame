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
  const { data: before } = await supabaseAdmin.from("orders").select("status").eq("id", payment.external_reference).maybeSingle();
  const { error } = await supabaseAdmin.rpc("apply_mercadopago_payment", {
    _order_id: payment.external_reference,
    _payment_id: String(payment.id),
    _amount: payment.transaction_amount,
    _status: payment.status,
  });
  if (error) throw new Error(error.message);
  if (before && before.status !== "pago") await sendLuckyNumbersEmail(payment.external_reference).catch((e) => console.error("Email error", e));
}

export async function sendLuckyNumbersEmail(orderId: string) {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const resendKey = process.env["RESEND_API_KEY"];
  if (!lovableKey || !resendKey) return;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: o } = await (supabaseAdmin as any).from("orders").select("status, user_id, quantity, campaigns(title, total_quotas), lucky_numbers(number)").eq("id", orderId).maybeSingle();
  if (!o || o.status !== "pago" || !o.lucky_numbers?.length) return;
  const { data: p } = await (supabaseAdmin as any).from("profiles").select("email, nome_completo").eq("id", o.user_id).maybeSingle();
  if (!p?.email) return;
  const total = o.campaigns?.total_quotas;
  const pad = (n: number) => String(n).padStart(String(total && total > 0 ? total : n).length, "0");
  const esc = (v: string) => v.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
  const nums = o.lucky_numbers.map((n: any) => n.number).sort((a: number, b: number) => a - b).map(pad);
  const title = esc(o.campaigns?.title ?? "Sorteio TATUAME");
  const name = esc((p.nome_completo ?? "").split(" ")[0] || "cliente");
  const html = `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#222"><h1 style="color:#c8102e">Pagamento aprovado! 🎉</h1><p>Olá, ${name}! Seu pagamento no sorteio <strong>${title}</strong> foi confirmado.</p><p>Seus números da sorte:</p><p>${nums.map((n: string) => `<span style="display:inline-block;margin:3px;padding:6px 10px;border:1px solid #c8102e;border-radius:6px;font-family:monospace;font-size:16px">${n}</span>`).join("")}</p><p>Acompanhe o sorteio ao vivo no Instagram <strong>@tatuameoficial</strong>. Seus números também ficam salvos em <a href="https://tatuame.com/conta">Minha conta</a>.</p><p>Boa sorte!<br/>Equipe TATUAME</p></div>`;
  const res = await fetch("https://connector-gateway.lovable.dev/resend/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${lovableKey}`, "X-Connection-Api-Key": resendKey },
    body: JSON.stringify({ from: process.env["RESEND_FROM"] || "TATUAME <contato@tatuame.com>", to: [p.email], subject: `Seus números da sorte – ${o.campaigns?.title ?? "TATUAME"}`, html }),
  });
  if (!res.ok) throw new Error(`Resend [${res.status}]: ${await res.text()}`);
}