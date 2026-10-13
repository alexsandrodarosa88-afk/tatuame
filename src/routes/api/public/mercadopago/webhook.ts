import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/mercadopago/webhook")({
  server: { handlers: { POST: async ({ request }) => {
    const secret = process.env["MERCADOPAGO_WEBHOOK_SECRET"];
    const token = process.env["MERCADOPAGO_ACCESS_TOKEN"];
    if (!secret || !token) return new Response("Payment notifications not configured", { status: 503 });
    const { verifyMercadoPagoWebhook, reconcileMercadoPago } = await import("@/lib/mercadopago.server");
    const paymentId = verifyMercadoPagoWebhook(request, secret);
    if (!paymentId) return new Response("Invalid signature", { status: 401 });
    const type = new URL(request.url).searchParams.get("type");
    if (type && type !== "payment") return Response.json({ received: true });
    try {
      await reconcileMercadoPago(paymentId, token);
      return Response.json({ received: true });
    } catch {
      return new Response("Payment verification failed", { status: 500 });
    }
  } } },
});