import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect } from "react";
import { getMyParticipations, getMyCredits, getMyProfile, reconcileMyPendingOrders } from "@/lib/cart.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Ticket, Wallet, User as UserIcon, FileText } from "lucide-react";

export const Route = createFileRoute("/_authenticated/conta")({ component: AccountPage });

const formatBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const formatDate = (s: string) => new Date(s).toLocaleDateString("pt-BR");

function AccountPage() {
  const partsFn = useServerFn(getMyParticipations);
  const credFn = useServerFn(getMyCredits);
  const profFn = useServerFn(getMyProfile);
  const reconcileFn = useServerFn(reconcileMyPendingOrders);
  const qc = useQueryClient();
  const { data: parts } = useQuery({ queryKey: ["participations"], queryFn: () => partsFn() });
  const { data: credits } = useQuery({ queryKey: ["credits"], queryFn: () => credFn() });
  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: () => profFn() });

  useEffect(() => {
    let cancelled = false;
    reconcileFn()
      .then((r) => {
        if (!cancelled && r?.confirmed && r.confirmed > 0) {
          qc.invalidateQueries({ queryKey: ["participations"] });
          qc.invalidateQueries({ queryKey: ["credits"] });
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [reconcileFn, qc]);

  const totalCredit = (credits ?? []).reduce((a, c) => a + (Number(c.amount) - Number(c.used_amount)), 0);

  const now = Date.now();
  const isEnded = (p: any) => p.campaigns?.status === "closed" || (p.campaigns?.ends_at && new Date(p.campaigns.ends_at).getTime() < now);
  const ativos = (parts ?? []).filter((p: any) => !isEnded(p));
  const historico = (parts ?? []).filter(isEnded);

  return (
    <div className="container mx-auto px-4 py-10 max-w-4xl">
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <h1 className="font-display text-3xl font-bold">Minha conta</h1>
        <Button asChild variant="outline" size="sm">
          <Link to="/politicas"><FileText className="h-4 w-4 mr-1" /> Políticas</Link>
        </Button>
      </div>

      {profile && (
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider mb-3"><UserIcon className="h-4 w-4" /> Seus dados</div>
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <div><span className="text-muted-foreground">Nome:</span> <span className="font-medium">{profile.nome_completo ?? "—"}</span></div>
            <div><span className="text-muted-foreground">Email:</span> <span className="font-medium">{profile.email ?? "—"}</span></div>
            <div><span className="text-muted-foreground">CPF:</span> <span className="font-medium">{profile.cpf ?? "—"}</span></div>
            <div><span className="text-muted-foreground">Telefone:</span> <span className="font-medium">{profile.telefone ?? "—"}</span></div>
            <div><span className="text-muted-foreground">Nascimento:</span> <span className="font-medium">{profile.data_nascimento ? formatDate(profile.data_nascimento) : "—"}</span></div>
            <div><span className="text-muted-foreground">Cidade:</span> <span className="font-medium">{profile.cidade ?? "—"}</span></div>
          </div>
        </Card>
      )}

      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <Card className="p-6">
          <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider"><Wallet className="h-4 w-4" /> Crédito disponível</div>
          <div className="font-display text-3xl font-bold mt-2">{formatBRL(totalCredit)}</div>
          <div className="text-xs text-muted-foreground mt-1">Válidos por 12 meses · Use até 70% da sua próxima tatuagem</div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider"><Ticket className="h-4 w-4" /> Números da sorte</div>
          <div className="font-display text-3xl font-bold mt-2">{ativos.length}</div>
          <div className="text-xs text-muted-foreground mt-1">Participações ativas</div>
        </Card>
      </div>

      <h2 className="font-display text-xl font-semibold mb-3">Sorteios ativos</h2>
      {ativos.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground mb-4">Você ainda não tem participações ativas.</p>
          <Button asChild className="bg-primary hover:bg-[var(--primary-glow)]"><Link to="/campanhas">Ver campanhas</Link></Button>
        </Card>
      )}
      <div className="space-y-2">
        {ativos.map((p: any) => (
          <Card key={p.id} className="p-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                {p.campaigns?.code && <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-mono font-semibold text-primary border border-primary/20">{p.campaigns.code}</span>}
                <span className="font-semibold">{p.campaigns?.title ?? "Campanha"}</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">Sorteio quando finalizar as cotas</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Seu número</div>
              <div className="font-display text-2xl font-bold text-primary tabular-nums">{String(p.lucky_number).padStart(3, "0")}</div>
            </div>
          </Card>
        ))}
      </div>

      {historico.length > 0 && (
        <>
          <h2 className="font-display text-xl font-semibold mt-10 mb-3">Histórico de sorteios</h2>
          <div className="space-y-2">
            {historico.map((p: any) => (
              <Card key={p.id} className="p-4 flex items-center justify-between opacity-80">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {p.campaigns?.code && <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[10px] font-mono font-semibold text-muted-foreground border border-border">{p.campaigns.code}</span>}
                    <span className="font-semibold">{p.campaigns?.title ?? "Campanha"}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Encerrado em {formatDate(p.campaigns?.ends_at)}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">Número</div>
                  <div className="font-display text-2xl font-bold tabular-nums">{String(p.lucky_number).padStart(3, "0")}</div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
