import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Ticket, Timer, Users, ArrowUpRight } from "lucide-react";
import { listActiveCampaigns } from "@/lib/campaigns.functions";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { useRealtimeInvalidate } from "@/hooks/use-realtime-invalidate";

const formatBRL = (n: number) => Number(n).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function Campaigns() {
  const { get } = useSiteSettings();
  const fn = useServerFn(listActiveCampaigns);
  const { data: campaigns } = useQuery({ queryKey: ["public_campaigns"], queryFn: () => fn(), refetchInterval: 15_000 });
  useRealtimeInvalidate("campaigns", [["public_campaigns"]]);
  
  const list = (campaigns ?? []).filter((c: any) => new Date(c.ends_at).getTime() > Date.now() && c.sold_quotas < c.total_quotas);

  return (
    <section id="campanhas" className="py-32 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 animate-reveal">
          <div className="max-w-2xl">
            <div className="inline-block px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-4">
              {get("campaigns.eyebrow", "Oportunidades Exclusivas")}
            </div>
            <h2 className="font-display text-4xl md:text-6xl font-black text-white italic leading-tight uppercase">
              {get("campaigns.title", "Campanhas em Destaque")}
            </h2>
            <p className="text-muted-foreground mt-4 text-lg md:text-xl font-medium max-w-xl">
              {get("campaigns.subtitle", "Escolha sua experiência e transforme sua participação em arte na pele.")}
            </p>
          </div>
          <Button asChild variant="link" className="text-primary font-bold uppercase tracking-widest group">
            <Link to="/cadastro" search={{ next: "/" }}>Ver todas <ArrowUpRight className="ml-1 h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" /></Link>
          </Button>
        </div>

        {list.length === 0 ? (
          <div className="glass rounded-3xl p-12 text-center">
            <p className="text-muted-foreground font-medium">Nenhuma campanha ativa no momento. Volte em breve!</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {list.map((c: any) => {
              const realPct = Math.round((c.sold_quotas / c.total_quotas) * 100);
              const displayPct = Math.min(98, Math.round(realPct * 12));
              return <CampaignCard key={c.id} campaign={c} displayPct={displayPct} />;
            })}
          </div>
        )}
      </div>
    </section>
  );
}

function CampaignCard({ campaign, displayPct }: { campaign: any, displayPct: number }) {
  const isPremium = campaign.campaign_type !== "simple";
  
  return (
    <div className="group relative flex flex-col glass rounded-[2rem] p-5 transition-premium hover:-translate-y-2 hover:border-primary/40 hover:shadow-elegant">
      {/* Badge/Tag */}
      <div className="flex justify-between items-start mb-6">
        <div className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${
          isPremium 
            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
            : "bg-amber-500/10 text-amber-400 border-amber-500/20"
        }`}>
          {isPremium ? "Premium" : "Simples"}
        </div>
        {displayPct >= 80 && (
          <Badge className="bg-primary text-primary-foreground font-bold text-[10px] animate-pulse">HOT</Badge>
        )}
      </div>

      {/* Main Content */}
      <div className="space-y-4 mb-8">
        <div>
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Valor da experiência</span>
          <div className="font-display text-4xl font-black text-white italic tracking-tighter mt-1">
            {formatBRL(Number(campaign.tattoo_value))}
          </div>
        </div>

        <div className="glass bg-white/5 rounded-2xl p-4 flex items-center justify-between border-white/5">
          <div>
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">Participação</span>
            <span className="font-display text-xl font-bold text-primary italic">{formatBRL(Number(campaign.price_per_quota))}</span>
          </div>
          <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/20 grid place-items-center">
            <Ticket className="h-5 w-5 text-primary" />
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-3 mb-8">
        <div className="flex justify-between items-end">
          <span className="text-[10px] font-bold text-muted-foreground uppercase">Disponibilidade</span>
          <span className="text-sm font-black text-white italic">{displayPct}%</span>
        </div>
        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
          <div 
            className="h-full bg-primary shadow-glow transition-premium duration-1000" 
            style={{ width: `${displayPct}%` }}
          />
        </div>
        <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground font-bold uppercase tracking-tighter">
          <Timer className="h-3 w-3" /> Sorteio automático ao finalizar
        </div>
      </div>

      {/* Footer / CTA */}
      <Button asChild className="mt-auto w-full h-12 bg-white text-black hover:bg-primary hover:text-white font-black uppercase italic transition-premium rounded-xl">
        <Link to="/cadastro" search={{ next: "/" }}>PARTICIPAR AGORA</Link>
      </Button>

      {/* Hover Info */}
      <div className="absolute inset-x-5 bottom-20 opacity-0 group-hover:opacity-100 transition-premium pointer-events-none translate-y-4 group-hover:translate-y-0">
        <div className="glass p-3 rounded-xl text-[10px] font-medium leading-tight">
          {isPremium 
            ? "100% do valor retorna em créditos para você tatuar."
            : "Participação direta sem retorno de crédito."}
        </div>
      </div>
    </div>
  );
}
