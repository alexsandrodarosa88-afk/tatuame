import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Ticket, Users } from "lucide-react";
import { listActiveCampaigns } from "@/lib/campaigns.functions";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { useRealtimeInvalidate } from "@/hooks/use-realtime-invalidate";

const formatBRL = (n: number) => Number(n).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function Campaigns() {
  const { get } = useSiteSettings();
  const fn = useServerFn(listActiveCampaigns);
  const { data: campaigns } = useQuery({ queryKey: ["public_campaigns"], queryFn: () => fn(), refetchInterval: 15_000, refetchOnWindowFocus: true });
  useRealtimeInvalidate("campaigns", [["public_campaigns"]]);
  const list = (campaigns ?? []).filter((c: any) => new Date(c.ends_at).getTime() > Date.now() && c.sold_quotas < c.total_quotas);
  return (
    <section id="campanhas" className="py-24 border-t border-border">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mb-12">
          <div className="text-xs uppercase tracking-[0.2em] text-primary font-semibold mb-3">{get("campaigns.eyebrow", "Campanhas ativas")}</div>
          <h2 className="font-display text-4xl md:text-5xl font-bold leading-tight">
            {get("campaigns.title", "Escolha sua campanha e garanta seu número.")}
          </h2>
          <p className="text-muted-foreground mt-4 text-lg">
            {get("campaigns.subtitle", "Cada compra gera um número único. Quando a campanha fecha, um sorteado leva o upgrade completo da tatuagem.")}
          </p>
        </div>
        {list.length === 0 ? (
          <p className="text-muted-foreground">Nenhuma campanha ativa no momento. Volte em breve!</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {list.map((c: any) => {
              const remaining = c.total_quotas - c.sold_quotas;
              const pct = Math.round((c.sold_quotas / c.total_quotas) * 100);
              const isHot = pct >= 70;
              return (
                <Card key={c.id} className="group relative overflow-hidden border-border bg-card/80 backdrop-blur p-6 flex flex-col gap-5 transition-[var(--transition-smooth)] hover:border-primary/40 hover:-translate-y-1 hover:shadow-[var(--shadow-elegant)]">
                  <div className="flex items-start justify-between">
                    <div>
                      {c.code && <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-mono font-semibold text-primary border border-primary/20 mb-2">{c.code}</span>}
                      <div className="text-xs uppercase tracking-wider text-muted-foreground">Tatuagem de</div>
                      <div className="font-display text-3xl font-bold mt-1">{formatBRL(Number(c.tattoo_value))}</div>
                    </div>
                    {isHot && <Badge className="bg-primary/15 text-primary border border-primary/30 hover:bg-primary/15">Quase fechando</Badge>}
                  </div>
                  <div className="rounded-lg bg-secondary/40 border border-border p-3">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Ticket className="h-3.5 w-3.5" /> Por cota</div>
                    <div className="font-display text-xl font-semibold mt-1">{formatBRL(Number(c.price_per_quota))}</div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Cotas vendidas</span>
                      <span className="font-semibold text-primary">{pct}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-secondary overflow-hidden">
                      <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${pct}%`, background: "var(--gradient-primary)" }} />
                    </div>
                    <div className="text-xs text-muted-foreground">Sorteio quando finalizar as cotas</div>
                  </div>
                  <Button asChild className="bg-primary hover:bg-[var(--primary-glow)] text-primary-foreground font-semibold w-full mt-auto">
                    <Link to="/cadastro">Participar agora</Link>
                  </Button>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}