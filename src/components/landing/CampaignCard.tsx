import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { type Campaign, formatBRL } from "@/data/campaigns";
import { Ticket, Users } from "lucide-react";

export function CampaignCard({ campaign }: { campaign: Campaign }) {
  const remaining = campaign.totalQuotas - campaign.soldQuotas;
  const pct = Math.round((campaign.soldQuotas / campaign.totalQuotas) * 100);
  const isHot = pct >= 70;

  return (
    <Card className="group relative overflow-hidden rounded-2xl border-border bg-card/80 backdrop-blur p-6 flex flex-col gap-5 transition-[var(--transition-smooth)] hover:border-foreground/30 hover:-translate-y-1 hover:shadow-[var(--shadow-card)]" style={{ backgroundImage: "var(--gradient-surface)" }}>
      <div
        aria-hidden
        className="absolute -top-20 -right-20 h-40 w-40 rounded-full blur-3xl opacity-0 group-hover:opacity-60 transition-opacity duration-700"
        style={{ background: "var(--gradient-accent)" }}
      />
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Tatuagem até</div>
          <div className="font-display text-3xl font-semibold mt-1 tabular-nums">{formatBRL(campaign.tattooValue)}</div>
        </div>
        {isHot && (
          <Badge className="bg-[var(--accent-blue)]/10 text-[var(--accent-blue-glow)] border border-[var(--accent-blue)]/30 hover:bg-[var(--accent-blue)]/10">
            Quase fechando
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-secondary/40 border border-border p-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Ticket className="h-3.5 w-3.5" /> Por cota</div>
          <div className="font-display text-xl font-semibold mt-1 tabular-nums">{formatBRL(campaign.pricePerQuota)}</div>
        </div>
        <div className="rounded-xl bg-secondary/40 border border-border p-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Users className="h-3.5 w-3.5" /> Cotas</div>
          <div className="font-display text-xl font-semibold mt-1 tabular-nums">{campaign.totalQuotas}</div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Progresso</span>
          <span className="font-semibold tabular-nums">{pct}%</span>
        </div>
        <div className="h-2 rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full rounded-full transition-[width] duration-700"
            style={{ width: `${pct}%`, background: "linear-gradient(90deg, var(--foreground), var(--accent-blue))" }}
          />
        </div>
        <div className="text-xs text-muted-foreground">
          Restam <span className="text-foreground font-semibold">{remaining}</span> cotas
        </div>
      </div>

      <Button asChild className="rounded-full font-medium w-full mt-auto">
        <Link to="/cadastro">Participar agora</Link>
      </Button>
    </Card>
  );
}