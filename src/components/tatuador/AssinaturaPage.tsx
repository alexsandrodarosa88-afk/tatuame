import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { createArtistSubscription, getMyArtistSubscription } from "@/lib/artist-subscription.functions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard, QrCode, Lock, ShieldAlert, Gift, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function AssinaturaPage() {
  const statusFn = useServerFn(getMyArtistSubscription);
  const createFn = useServerFn(createArtistSubscription);
  const { data, isLoading, refetch } = useQuery({ queryKey: ["artist-sub"], queryFn: () => statusFn() });
  const [picking, setPicking] = useState<"PIX" | "CREDIT_CARD" | null>(null);

  const create = useMutation({
    mutationFn: (billingType: "PIX" | "CREDIT_CARD") =>
      createFn({
        data: {
          billingType,
          returnUrl: `${window.location.origin}/tatuador/assinatura`,
        },
      }),
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

  if ((data as any).isLifetimeFree) {
    return (
      <Card className="border-green-500/40 bg-green-500/5 max-w-2xl mx-auto">
        <CardContent className="p-6 flex items-start gap-3">
          <Gift className="h-6 w-6 text-green-500 shrink-0" />
          <div>
            <p className="font-semibold text-lg">Acesso vitalício gratuito</p>
            <p className="text-sm text-muted-foreground mt-1">
              Sua conta foi marcada como vitalícia. Você não precisa pagar mensalidade.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.status === "blocked") {
    return (
      <Card className="border-destructive/50 bg-destructive/5 max-w-2xl mx-auto">
        <CardContent className="p-6 space-y-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-destructive" />
            <h2 className="text-xl font-bold">Cadastro bloqueado</h2>
          </div>
          <p className="text-sm">
            Sua mensalidade ficou mais de <strong>5 dias em atraso</strong> e o sistema bloqueou seu acesso automaticamente.
            Não é mais possível gerar PIX por aqui.
          </p>
          <p className="text-sm">
            Para reativar, <strong>entre em contato com o suporte</strong>. Apenas o admin pode liberar novamente seu cadastro.
          </p>
        </CardContent>
      </Card>
    );
  }

  const overdue = data.status === "overdue" || ((data as any).daysOverdue ?? 0) > 0;
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
          <div className="flex items-start gap-2 rounded-md border border-primary/30 bg-primary/5 p-3">
            <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold">Promoção de lançamento</p>
              <p className="text-muted-foreground">
                6 primeiros meses por <strong>{brl((data as any).promoFee ?? 39.9)}</strong>, depois <strong>{brl((data as any).regularFee ?? 59.9)}/mês</strong>.
              </p>
            </div>
          </div>
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
        Pagamento processado pelo Mercado Pago. Você pode trocar a forma de pagamento a qualquer momento.
      </p>
    </div>
  );
}
