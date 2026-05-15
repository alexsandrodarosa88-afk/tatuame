import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock } from "lucide-react";

export const Route = createFileRoute("/checkout/return")({
  validateSearch: (search: Record<string, unknown>) => ({
    order_id: typeof search.order_id === "string" ? search.order_id : undefined,
    session_id: typeof search.session_id === "string" ? search.session_id : undefined,
  }),
  component: CheckoutReturnPage,
});

function CheckoutReturnPage() {
  const { order_id } = Route.useSearch();
  return (
    <div className="min-h-screen grid place-items-center bg-background px-4 py-12">
      <Card className="w-full max-w-lg p-8 text-center space-y-5">
        <CheckCircle2 className="h-16 w-16 text-success mx-auto" />
        <h1 className="font-display text-3xl font-bold">Recebemos seu PIX!</h1>
        <p className="text-muted-foreground">
          Assim que o pagamento for confirmado pelo banco, seus números da sorte e créditos serão liberados.
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" /> Acompanhe o status na sua conta.
        </div>
        <Button asChild className="w-full bg-primary hover:bg-[var(--primary-glow)]">
          <Link to="/checkout/$orderId" params={{ orderId: order_id ?? "" }}>Ver status do pedido</Link>
        </Button>
      </Card>
    </div>
  );
}