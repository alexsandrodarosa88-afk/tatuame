import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect } from "react";
import { getMyOrder } from "@/lib/cart.functions";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock } from "lucide-react";

export const Route = createFileRoute("/checkout/$orderId")({ component: CheckoutStatusPage });

const formatBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function CheckoutStatusPage() {
  const { orderId } = Route.useParams();
  const { user, loading } = useAuth();
  const fn = useServerFn(getMyOrder);

  const { data: order, refetch } = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => fn({ data: { id: orderId } }),
    enabled: !!user,
    refetchInterval: 4000,
  });

  useEffect(() => {
    if (order?.status === "paid") refetch();
  }, [order?.status, refetch]);

  if (loading) return <div className="min-h-screen grid place-items-center text-muted-foreground">Carregando...</div>;

  return (
    <div className="min-h-screen bg-background grid place-items-center px-4 py-12">
      <Card className="w-full max-w-lg p-8 text-center space-y-5">
        {order?.status === "paid" ? (
          <>
            <CheckCircle2 className="h-16 w-16 text-success mx-auto" />
            <h1 className="font-display text-3xl font-bold">Pagamento confirmado!</h1>
            <p className="text-muted-foreground">Seus números da sorte e créditos foram liberados.</p>
            <Button asChild className="bg-primary hover:bg-[var(--primary-glow)] w-full"><Link to="/conta">Ver minha conta</Link></Button>
          </>
        ) : (
          <>
            <Clock className="h-16 w-16 text-primary mx-auto animate-pulse" />
            <h1 className="font-display text-2xl font-bold">Aguardando pagamento</h1>
            <p className="text-muted-foreground">Total: <span className="font-semibold">{order ? formatBRL(Number(order.total_amount)) : "—"}</span></p>
            <p className="text-xs text-muted-foreground">Assim que o PIX cair, esta página atualiza automaticamente.</p>
            <Button asChild variant="outline" className="w-full"><Link to="/conta">Ir para minha conta</Link></Button>
          </>
        )}
      </Card>
    </div>
  );
}
