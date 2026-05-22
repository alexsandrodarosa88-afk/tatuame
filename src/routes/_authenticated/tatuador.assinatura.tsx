import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { createArtistSubscription, getMyArtistSubscription } from "@/lib/artist-subscription.functions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard, QrCode, Lock } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/tatuador/assinatura")({ component: AssinaturaPage });
export default AssinaturaPage;

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function AssinaturaPage() {
  const statusFn = useServerFn(getMyArtistSubscription);
  const createFn = useServerFn(createArtistSubscription);
  const { data, isLoading, refetch } = useQuery({ queryKey: ["artist-sub"], queryFn: () => statusFn() });
  const [picking, setPicking] = useState<"PIX" | "CREDIT_CARD" | null>(null);

  const create = useMutation({
    mutationFn: (billingType: "PIX" | "CREDIT_CARD") => createFn({ data: { billingType } }),
    onSuccess: (r: any) => {
      if (r?.invoiceUrl) {
        window.location.href = r.invoiceUrl;
      } else {
        toast.success("Assinatura criada! Atualizando…");
        refetch();
      }
    },
    onError: (e: Error) => {
      setPicking(null);
      toast.error(e.message);
    },
  });

  if (isLoading || !data) {
    return <div className="grid place-items-center py-20 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  }

  if (!data.artistFound) {
    return (
      <Card><CardContent className="p-6 text-sm text-muted-foreground">
        Aguarde a aprovação do seu cadastro de tatuador.
      </CardContent></Card>
    );
  }

  const overdue = data.status === "overdue";
  const pendingInvoice = data.pendingInvoice;

  const handlePick = (t: "PIX" | "CREDIT_CARD") => {
    setPicking(t);
    create.mutate(t);
  };

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center gap-2">
        <Lock className="h-5 w-5 text-primary" />
        <h1 className="text-2xl font-bold">
          {overdue ? "Mensalidade em atraso" : "Ativar mensalidade"}
        </h1>
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div>
            <p className="text-sm text-muted-foreground uppercase tracking-wider">Mensalidade TATUAME</p>
            <p className="text-4xl font-bold mt-1">{brl(data.monthlyFee)}<span className="text-base font-normal text-muted-foreground">/mês</span></p>
          </div>
          <p className="text-sm text-muted-foreground">
            {overdue
              ? "Sua mensalidade está atrasada. Regularize para liberar o acesso à área do tatuador."
              : "Para acessar a área do tatuador é preciso estar com a mensalidade ativa. Escolha a forma de pagamento abaixo."}
          </p>

          {pendingInvoice?.invoiceUrl ? (
            <div className="space-y-3">
              <p className="text-sm">Você já tem uma fatura em aberto. Clique abaixo para pagar:</p>
              <Button asChild className="w-full h-12 bg-primary hover:bg-[var(--primary-glow)]">
                <a href={pendingInvoice.invoiceUrl} target="_blank" rel="noreferrer">
                  PAGAR FATURA — {brl(pendingInvoice.amount)}
                </a>
              </Button>
              <Button variant="outline" size="sm" onClick={() => refetch()} className="w-full">
                Já paguei — atualizar status
              </Button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3 pt-2">
              <Button
                onClick={() => handlePick("PIX")}
                disabled={create.isPending}
                className="h-auto py-4 flex-col gap-1 bg-primary hover:bg-[var(--primary-glow)]"
              >
                <QrCode className="h-6 w-6" />
                <span className="font-semibold">{picking === "PIX" && create.isPending ? "Gerando…" : "PIX mensal"}</span>
                <span className="text-xs opacity-80">Pagamento manual todo mês</span>
              </Button>
              <Button
                onClick={() => handlePick("CREDIT_CARD")}
                disabled={create.isPending}
                variant="outline"
                className="h-auto py-4 flex-col gap-1"
              >
                <CreditCard className="h-6 w-6" />
                <span className="font-semibold">{picking === "CREDIT_CARD" && create.isPending ? "Gerando…" : "Cartão recorrente"}</span>
                <span className="text-xs opacity-80">Cobrança automática</span>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground text-center">
        Pagamento processado pelo Asaas. Você pode trocar a forma de pagamento a qualquer momento.
      </p>
    </div>
  );
}