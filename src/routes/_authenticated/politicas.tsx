import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyPolicyStatus } from "@/lib/policy.functions";
import { POLICY_SECTIONS, POLICY_VERSION } from "@/lib/policies";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, FileText } from "lucide-react";

export const Route = createFileRoute("/_authenticated/politicas")({ component: PoliticasPage });

function PoliticasPage() {
  const statusFn = useServerFn(getMyPolicyStatus);
  const { data } = useQuery({ queryKey: ["policy-status"], queryFn: () => statusFn() });

  return (
    <div className="container mx-auto px-4 py-10 max-w-3xl">
      <div className="flex items-center gap-2 mb-2 text-muted-foreground text-xs uppercase tracking-wider">
        <FileText className="h-4 w-4" /> Políticas e Termos · v{POLICY_VERSION}
      </div>
      <h1 className="font-display text-3xl font-bold mb-4">Políticas TATUAME</h1>

      {data?.acceptedCurrent && data.latest && (
        <Card className="p-4 mb-6 border-primary/30 bg-primary/5 flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
          <div className="text-sm">
            <div className="font-semibold">Você aceitou esta versão das políticas.</div>
            <div className="text-muted-foreground text-xs">
              Versão {data.latest.version} aceita em {new Date(data.latest.accepted_at).toLocaleString("pt-BR")}.
            </div>
          </div>
        </Card>
      )}

      {data && !data.acceptedCurrent && data.hasPaidOrder && (
        <Card className="p-4 mb-6 border-amber-500/40 bg-amber-500/5">
          <div className="text-sm font-semibold mb-1">Aceite pendente</div>
          <p className="text-xs text-muted-foreground mb-3">
            Você precisa aceitar a versão atual das políticas para continuar usando seus créditos e participar de novas campanhas.
          </p>
          <Button asChild size="sm" className="bg-primary hover:bg-[var(--primary-glow)]">
            <Link to="/conta">Ir para minha conta e aceitar</Link>
          </Button>
        </Card>
      )}

      <div className="space-y-5">
        {POLICY_SECTIONS.map((s) => (
          <Card key={s.title} className="p-5">
            <h2 className="font-display text-lg font-semibold mb-2">{s.title}</h2>
            <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">{s.body}</p>
          </Card>
        ))}
      </div>

      {data && data.history.length > 0 && (
        <div className="mt-10">
          <h3 className="font-display text-base font-semibold mb-2">Histórico de aceites</h3>
          <div className="space-y-1 text-xs text-muted-foreground">
            {data.history.map((h: any) => (
              <div key={h.id}>Versão {h.version} — {new Date(h.accepted_at).toLocaleString("pt-BR")}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}