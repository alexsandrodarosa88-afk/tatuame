import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyParticipations, getMyCredits } from "@/lib/cart.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Ticket, Wallet } from "lucide-react";

export const Route = createFileRoute("/_authenticated/conta")({ component: AccountPage });

const formatBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const formatDate = (s: string) => new Date(s).toLocaleDateString("pt-BR");

function AccountPage() {
  const partsFn = useServerFn(getMyParticipations);
  const credFn = useServerFn(getMyCredits);
  const { data: parts } = useQuery({ queryKey: ["participations"], queryFn: () => partsFn() });
  const { data: credits } = useQuery({ queryKey: ["credits"], queryFn: () => credFn() });

  const totalCredit = (credits ?? []).reduce((a, c) => a + (Number(c.amount) - Number(c.used_amount)), 0);

  return (
    <div className="container mx-auto px-4 py-10 max-w-4xl">
      <h1 className="font-display text-3xl font-bold mb-6">Minha conta</h1>
      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <Card className="p-6">
          <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider"><Wallet className="h-4 w-4" /> Crédito disponível</div>
          <div className="font-display text-3xl font-bold mt-2">{formatBRL(totalCredit)}</div>
          <div className="text-xs text-muted-foreground mt-1">Válidos por 12 meses · Use até 70% da sua próxima tatuagem</div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider"><Ticket className="h-4 w-4" /> Números da sorte</div>
          <div className="font-display text-3xl font-bold mt-2">{parts?.length ?? 0}</div>
          <div className="text-xs text-muted-foreground mt-1">Total de participações ativas</div>
        </Card>
      </div>
      <h2 className="font-display text-xl font-semibold mb-3">Suas participações</h2>
      {(!parts || parts.length === 0) && (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground mb-4">Você ainda não tem participações.</p>
          <Button asChild className="bg-primary hover:bg-[var(--primary-glow)]"><Link to="/campanhas">Ver campanhas</Link></Button>
        </Card>
      )}
      <div className="space-y-2">
        {parts?.map((p: any) => (
          <Card key={p.id} className="p-4 flex items-center justify-between">
            <div>
              <div className="font-semibold">{p.campaigns?.title ?? "Campanha"}</div>
              <div className="text-xs text-muted-foreground">Sorteio até {formatDate(p.campaigns?.ends_at)}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Seu número</div>
              <div className="font-display text-2xl font-bold text-primary tabular-nums">{String(p.lucky_number).padStart(4, "0")}</div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
