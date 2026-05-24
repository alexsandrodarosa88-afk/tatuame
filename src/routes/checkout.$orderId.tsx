import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect } from "react";
import { checkMyOrderPayment, getMyOrder } from "@/lib/cart.functions";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, Copy, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/checkout/$orderId")({ component: CheckoutStatusPage });

const formatBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function CheckoutStatusPage() {
  const { orderId } = Route.useParams();
  const { user, loading } = useAuth();
  const fn = useServerFn(getMyOrder);
  const checkFn = useServerFn(checkMyOrderPayment);
  const qc = useQueryClient();

  const { data: order } = useQuery({
    queryKey: ["order", orderId],
    queryFn: async () => {
      const current = await fn({ data: { id: orderId } });
      if (current.status !== "paid") {
        await checkFn({ data: { id: orderId } });
        return fn({ data: { id: orderId } });
      }
      return current;
    },
    enabled: !!user,
    refetchInterval: (query) => ((query.state.data as any)?.status === "paid" ? false : 4000),
  });

  const checkPayment = useMutation({
    mutationFn: () => checkFn({ data: { id: orderId } }),
    onSuccess: async (result) => {
      await qc.invalidateQueries({ queryKey: ["order", orderId] });
      if (result.status === "paid") {
        toast.success("Pagamento confirmado. Seus números foram gerados.");
      } else {
        toast.info("Pagamento ainda não confirmado pelo Mercado Pago.");
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  useEffect(() => {
    if (order?.status === "paid") {
      const t = window.setTimeout(() => {
        window.location.href = "/conta";
      }, 1800);
      return () => window.clearTimeout(t);
    }
  }, [order?.status]);

  const copyPix = async () => {
    if (!order?.pix_copy_paste) return;
    await navigator.clipboard.writeText(order.pix_copy_paste);
    toast.success("Código PIX copiado.");
  };

  if (loading) return <div className="min-h-screen grid place-items-center text-muted-foreground">Carregando...</div>;

  return (
    <div className="min-h-screen bg-background grid place-items-center px-4 py-12">
      <Card className="w-full max-w-lg p-8 text-center space-y-5">
        {order?.status === "paid" ? (
          <>
            <CheckCircle2 className="h-16 w-16 text-success mx-auto" />
            <h1 className="font-display text-3xl font-bold">Pagamento confirmado!</h1>
            <p className="text-muted-foreground">Seus números da sorte foram gerados. Redirecionando para sua conta...</p>
            <Button asChild className="bg-primary hover:bg-[var(--primary-glow)] w-full"><Link to="/conta">Ver minha conta</Link></Button>
          </>
        ) : (
          <>
            <Clock className="h-16 w-16 text-primary mx-auto animate-pulse" />
            <h1 className="font-display text-2xl font-bold">Aguardando pagamento</h1>
            <p className="text-muted-foreground">Total: <span className="font-semibold">{order ? formatBRL(Number(order.total_amount)) : "—"}</span></p>
            {order?.pix_copy_paste ? (
              <div className="space-y-3">
                {order.pix_qr_code && (
                  <img
                    src={`data:image/png;base64,${order.pix_qr_code}`}
                    alt="QR Code PIX para pagamento"
                    className="mx-auto h-56 w-56 rounded bg-card p-3"
                  />
                )}
                <Button onClick={copyPix} className="w-full bg-primary hover:bg-[var(--primary-glow)]">
                  <Copy className="h-4 w-4" /> Copiar código PIX
                </Button>
                <Button
                  onClick={() => checkPayment.mutate()}
                  disabled={checkPayment.isPending}
                  variant="outline"
                  className="w-full"
                >
                  <RefreshCw className={checkPayment.isPending ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
                  {checkPayment.isPending ? "Verificando..." : "Já efetuei o pagamento"}
                </Button>
                <p className="break-all rounded border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
                  {order.pix_copy_paste}
                </p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Conclua o pagamento na página segura do Mercado Pago.</p>
            )}
            <p className="text-xs text-muted-foreground">Assim que o pagamento cair, esta página atualiza automaticamente.</p>
            <Button asChild variant="outline" className="w-full"><Link to="/conta">Ir para minha conta</Link></Button>
          </>
        )}
      </Card>
    </div>
  );
}
