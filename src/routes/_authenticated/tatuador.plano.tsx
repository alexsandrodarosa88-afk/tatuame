import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyArtistPlan, chooseFreePlan, createPremiumCheckout, createPremiumRecurring, cancelPremiumRecurring } from "@/lib/artist-plan.functions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, Check, X, Loader2, Sparkles, Repeat, Ban } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/tatuador/plano")({ component: PlanoPage });

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function PlanoPage() {
  const qc = useQueryClient();
  const planFn = useServerFn(getMyArtistPlan);
  const freeFn = useServerFn(chooseFreePlan);
  const premiumFn = useServerFn(createPremiumCheckout);
  const recurringFn = useServerFn(createPremiumRecurring);
  const cancelRecurringFn = useServerFn(cancelPremiumRecurring);
  const { data, isLoading, refetch } = useQuery({ queryKey: ["artist-plan"], queryFn: () => planFn() });
  const [picking, setPicking] = useState<6 | 12 | "free" | "recurring" | null>(null);

  const buyPremium = useMutation({
    mutationFn: (term: 6 | 12) =>
      premiumFn({ data: { termMonths: term, returnUrl: `${window.location.origin}/tatuador/plano` } }),
    onSuccess: (r: any) => {
      if (r?.invoiceUrl) window.location.href = r.invoiceUrl;
    },
    onError: (e: Error) => { setPicking(null); toast.error(e.message); },
  });

  const goFree = useMutation({
    mutationFn: () => freeFn(),
    onSuccess: () => {
      toast.success("Plano Free ativado.");
      qc.invalidateQueries({ queryKey: ["artist-plan"] });
      refetch();
      setPicking(null);
    },
    onError: (e: Error) => { setPicking(null); toast.error(e.message); },
  });

  const buyRecurring = useMutation({
    mutationFn: () => recurringFn({ data: { returnUrl: `${window.location.origin}/tatuador/plano` } }),
    onSuccess: (r: any) => {
      if (r?.initPoint) window.location.href = r.initPoint;
    },
    onError: (e: Error) => { setPicking(null); toast.error(e.message); },
  });

  const cancelRecurring = useMutation({
    mutationFn: () => cancelRecurringFn(),
    onSuccess: () => {
      toast.success("Assinatura recorrente cancelada. Seu acesso vale até o vencimento atual.");
      qc.invalidateQueries({ queryKey: ["artist-plan"] });
      refetch();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading || !data) {
    return <div className="grid place-items-center py-20 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  }
  if (!data.artistFound) {
    return <p className="text-sm text-muted-foreground">Aguarde a aprovação do seu cadastro.</p>;
  }

  const expDate = data.planExpiresAt ? new Date(data.planExpiresAt).toLocaleDateString("pt-BR") : null;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Meu plano</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Plano atual: <strong className={data.premiumActive ? "text-amber-600 dark:text-amber-400" : ""}>
            {data.premiumActive ? "Premium" : "Free"}
          </strong>
          {data.premiumActive && expDate && <> — válido até <strong>{expDate}</strong></>}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* FREE */}
        <Card className={!data.premiumActive ? "border-primary/40" : ""}>
          <CardContent className="p-6 space-y-4">
            <div>
              <p className="text-sm uppercase tracking-wider text-muted-foreground">Plano Free</p>
              <p className="text-3xl font-bold mt-1">R$ 0<span className="text-base font-normal text-muted-foreground">/mês</span></p>
            </div>
            <ul className="text-sm space-y-2">
              <li className="flex gap-2"><Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />Perfil público na plataforma</li>
              <li className="flex gap-2"><Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />Aparece em buscas e campanhas</li>
              <li className="flex gap-2"><Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />Solicitação de pagamento de tatuagens de ganhadores</li>
              <li className="flex gap-2"><X className="h-4 w-4 text-red-500 mt-0.5 shrink-0" /><span><strong>Sem direito a rateio</strong> das campanhas</span></li>
            </ul>
            {!data.premiumActive ? (
              <div className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">Você está no plano Free.</div>
            ) : (
              <Button
                variant="outline"
                className="w-full"
                disabled={goFree.isPending || data.isLifetimeFree}
                onClick={() => {
                  if (!confirm("Mudar para Free? Você perderá o direito ao rateio até voltar para Premium.")) return;
                  setPicking("free");
                  goFree.mutate();
                }}
              >
                {picking === "free" && goFree.isPending ? "Mudando…" : "Mudar para Free"}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* PREMIUM */}
        <Card className={data.premiumActive ? "border-amber-500/50 bg-amber-500/5" : "border-primary/40"}>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <Crown className="h-4 w-4" /> Plano Premium
                </p>
                <p className="text-3xl font-bold mt-1">{brl(data.prices.monthly)}<span className="text-base font-normal text-muted-foreground">/mês</span></p>
              </div>
            </div>
            <ul className="text-sm space-y-2">
              <li className="flex gap-2"><Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />Tudo do Free</li>
              <li className="flex gap-2"><Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" /><strong>Direito a rateio das campanhas</strong></li>
              <li className="flex gap-2"><Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />Solicitação de pagamento</li>
              <li className="flex gap-2"><Sparkles className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" /><span>Cumpra <strong>8 stories + 1 reel + 1 post por semana</strong> para receber 100% do rateio</span></li>
            </ul>

            {data.isLifetimeFree ? (
              <div className="rounded-md bg-green-500/10 border border-green-500/40 px-3 py-2 text-xs text-green-700 dark:text-green-300">
                Você tem acesso Premium vitalício gratuito.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Button
                  className="h-auto py-3 flex-col gap-1 bg-primary hover:bg-[var(--primary-glow)]"
                  disabled={buyPremium.isPending}
                  onClick={() => { setPicking(6); buyPremium.mutate(6); }}
                >
                  <span className="font-semibold">{picking === 6 && buyPremium.isPending ? "Gerando…" : "6 meses"}</span>
                  <span className="text-xs opacity-90">{brl(data.prices.six)}</span>
                </Button>
                <Button
                  className="h-auto py-3 flex-col gap-1 bg-amber-600 hover:bg-amber-700 text-white"
                  disabled={buyPremium.isPending}
                  onClick={() => { setPicking(12); buyPremium.mutate(12); }}
                >
                  <span className="font-semibold">{picking === 12 && buyPremium.isPending ? "Gerando…" : "12 meses"}</span>
                  <span className="text-xs opacity-90">{brl(data.prices.twelve)}</span>
                </Button>
              </div>
            )}
            {data.premiumActive && expDate && !data.isLifetimeFree && (
              <p className="text-xs text-muted-foreground text-center">
                Renovar antes do vencimento estende o período Premium.
              </p>
            )}
            <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
              <strong>Formas de pagamento:</strong> cartão de crédito recorrente ou PIX recorrente — você escolhe na próxima etapa.
            </div>
            <div className="rounded-md border border-red-500/40 bg-red-500/5 px-3 py-2 text-xs text-red-700 dark:text-red-300">
              ⚠️ <strong>Importante:</strong> em caso de desistência ou cancelamento do Premium, você só poderá retornar à plataforma <strong>12 meses após a data de saída</strong>.
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ASSINATURA RECORRENTE — Mercado Pago preapproval */}
      {!data.isLifetimeFree && (
        <Card className="border-primary/40 bg-gradient-to-br from-primary/5 to-amber-500/5">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div className="flex items-start gap-3">
                <Repeat className="h-6 w-6 text-primary mt-0.5" />
                <div>
                  <p className="font-semibold">Assinatura mensal automática</p>
                  <p className="text-sm text-muted-foreground">
                    Cobrança recorrente de <strong>{brl(data.prices.monthly)}/mês</strong> via Mercado Pago
                    (cartão de crédito ou PIX automático). Sem precisar renovar manualmente.
                  </p>
                </div>
              </div>
              {data.hasRecurring ? (
                <span className="text-xs font-semibold px-2 py-1 rounded bg-green-500/15 text-green-700 dark:text-green-400">
                  Recorrência ativa
                </span>
              ) : null}
            </div>

            {data.hasRecurring ? (
              <Button
                variant="outline"
                className="border-red-500/40 text-red-600 hover:bg-red-500/10"
                disabled={cancelRecurring.isPending}
                onClick={() => {
                  if (!confirm("Cancelar a assinatura recorrente? Seu acesso Premium continua até o vencimento atual, mas você só poderá retornar à plataforma 12 meses após a saída.")) return;
                  cancelRecurring.mutate();
                }}
              >
                <Ban className="h-4 w-4 mr-2" />
                {cancelRecurring.isPending ? "Cancelando…" : "Cancelar assinatura"}
              </Button>
            ) : (
              <Button
                className="bg-primary hover:bg-[var(--primary-glow)]"
                disabled={buyRecurring.isPending}
                onClick={() => { setPicking("recurring"); buyRecurring.mutate(); }}
              >
                {picking === "recurring" && buyRecurring.isPending ? "Gerando…" : `Assinar ${brl(data.prices.monthly)}/mês recorrente`}
              </Button>
            )}
            <p className="text-xs text-muted-foreground">
              Você autoriza uma vez no Mercado Pago e ele cobra automaticamente todo mês. Pode cancelar a qualquer momento.
            </p>
          </CardContent>
        </Card>
      )}

      <Card className="bg-muted/30">
        <CardContent className="p-5 text-sm">
          <p className="font-semibold mb-2">Como o rateio funciona no Premium</p>
          <p className="text-muted-foreground">
            A cada campanha encerrada, o rateio é dividido entre os tatuadores Premium ativos.
            O valor que você recebe é proporcional ao % das suas metas de divulgação aprovadas no mês.
            Cumpriu 100% das metas? Recebe 100%. Cumpriu 50%? Recebe 50%.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}