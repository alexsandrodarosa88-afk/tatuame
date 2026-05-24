import { createHmac, timingSafeEqual } from "crypto";

const MP_BASE = "https://api.mercadopago.com";

function getToken() {
  const t = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!t) throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurada");
  return t;
}

export function isMpSandbox() {
  return /^TEST-/i.test(process.env.MERCADOPAGO_ACCESS_TOKEN ?? "");
}

export async function mpFetch(path: string, init: RequestInit = {}) {
  const token = getToken();
  const res = await fetch(`${MP_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "X-Idempotency-Key": cryptoRandom(),
      ...(init.headers ?? {}),
    },
  });
  const body = await res.text();
  let json: any = null;
  try {
    json = body ? JSON.parse(body) : null;
  } catch {
    /* keep raw */
  }
  if (!res.ok) {
    const msg =
      json?.message ||
      json?.error ||
      json?.cause?.[0]?.description ||
      body ||
      `HTTP ${res.status}`;
    console.error("[MP] API error", {
      status: res.status,
      path,
      message: msg,
      cause: json?.cause,
      error: json?.error,
      full: body?.slice(0, 2000),
      requestBody:
        typeof init.body === "string" ? init.body.slice(0, 2000) : undefined,
      tokenPrefix: (process.env.MERCADOPAGO_ACCESS_TOKEN ?? "").slice(0, 8),
    });
    throw new Error("Mercado Pago: " + msg);
  }
  return json;
}

function cryptoRandom() {
  return (
    Date.now().toString(36) +
    "-" +
    Math.random().toString(36).slice(2, 12)
  );
}

/**
 * Verifies Mercado Pago webhook signature.
 * Header format: x-signature: ts=1700000000,v1=<hex>
 * Manifest: id:<data.id>;request-id:<x-request-id>;ts:<ts>;
 */
export function verifyMpSignature(opts: {
  xSignature: string | null;
  xRequestId: string | null;
  dataId: string | null;
}): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret) {
    console.warn("[mp-webhook] MERCADOPAGO_WEBHOOK_SECRET ausente; pulando verificação.");
    return true;
  }
  if (!opts.xSignature || !opts.dataId) return false;

  const parts: Record<string, string> = {};
  for (const seg of opts.xSignature.split(",")) {
    const [k, v] = seg.trim().split("=");
    if (k && v) parts[k] = v;
  }
  const ts = parts["ts"];
  const v1 = parts["v1"];
  if (!ts || !v1) return false;

  const manifest = `id:${opts.dataId};request-id:${opts.xRequestId ?? ""};ts:${ts};`;
  const expected = createHmac("sha256", secret).update(manifest).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(v1, "hex"));
  } catch {
    return false;
  }
}

export async function fetchMpPayment(paymentId: string) {
  return mpFetch(`/v1/payments/${paymentId}`, { method: "GET" });
}

export async function searchMpPaymentsByExternalReference(externalReference: string) {
  const params = new URLSearchParams({
    external_reference: externalReference,
    sort: "date_created",
    criteria: "desc",
  });
  return mpFetch(`/v1/payments/search?${params.toString()}`, { method: "GET" });
}

export async function createMpPixPayment(input: {
  transactionAmount: number;
  description: string;
  payer: {
    name?: string;
    surname?: string;
    email: string;
    identification?: { type: "CPF" | "CNPJ"; number: string };
    phone?: { area_code?: string; number?: string };
  };
  externalReference: string;
  notificationUrl: string;
  expiresInMinutes?: number;
}) {
  const expiration = input.expiresInMinutes
    ? new Date(Date.now() + input.expiresInMinutes * 60 * 1000).toISOString()
    : undefined;

  const body = {
    transaction_amount: Number(input.transactionAmount.toFixed(2)),
    description: input.description,
    payment_method_id: "pix",
    payer: {
      email: input.payer.email,
      first_name: input.payer.name,
      last_name: input.payer.surname,
      identification: input.payer.identification,
      phone: input.payer.phone,
    },
    external_reference: input.externalReference,
    notification_url: input.notificationUrl,
    date_of_expiration: expiration,
  };

  return mpFetch(`/v1/payments`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export type MpPreferenceItem = {
  title: string;
  description?: string;
  quantity: number;
  unit_price: number;
  currency_id?: "BRL";
};

export async function createMpPreference(input: {
  items: MpPreferenceItem[];
  payer?: {
    name?: string;
    email?: string;
    identification?: { type: "CPF" | "CNPJ"; number: string };
    phone?: { area_code?: string; number?: string };
  };
  externalReference: string;
  notificationUrl: string;
  backUrls: { success: string; failure: string; pending: string };
  expiresInMinutes?: number;
  statementDescriptor?: string;
}) {
  const expiration = input.expiresInMinutes
    ? new Date(Date.now() + input.expiresInMinutes * 60 * 1000).toISOString()
    : undefined;

  const body = {
    items: input.items.map((i) => ({ ...i, currency_id: i.currency_id ?? "BRL" })),
    payer: input.payer,
    external_reference: input.externalReference,
    notification_url: input.notificationUrl,
    back_urls: input.backUrls,
    auto_return: "approved",
    statement_descriptor: input.statementDescriptor ?? "TATUAME",
    payment_methods: {
      installments: 12,
    },
    expires: !!expiration,
    expiration_date_to: expiration,
  };

  return mpFetch(`/checkout/preferences`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}