import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { type Campaign, formatBRL } from "@/data/campaigns";
import { Ticket, Users } from "lucide-react";

export function CampaignCard({ campaign }: { campaign: Campaign }) {
  const remaining = campaign.totalQuotas - campaign.soldQuotas;
  const pct = Math.round((campaign.soldQuotas / campaign.totalQuotas) * 100);
  const isHot = pct >= 70;

  return (
    <Card className="group relative overflow-hidden border-border bg-card/80 backdrop-blur p-6 flex flex-col gap-5 transition-[var(--transition-smooth)] hover:border-primary/40 hover:-translate-y-1 hover:shadow-[var(--shadow-elegant)]">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Tatuagem até</div>
          <div className="font-display text-3xl font-bold mt-1">{formatBRL(campaign.tattooValue)}</div>
        </div>
        {isHot && (
          <Badge className="bg-primary/15 text-primary border border-primary/30 hover:bg-primary/15">
            Quase fechando
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-secondary/40 border border-border p-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Ticket className="h-3.5 w-3.5" /> Por cota</div>
          <div className="font-display text-xl font-semibold mt-1">{formatBRL(campaign.pricePerQuota)}</div>
        </div>
        <div className="rounded-lg bg-secondary/40 border border-border p-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Users className="h-3.5 w-3.5" /> Cotas</div>
          <div className="font-display text-xl font-semibold mt-1">{campaign.totalQuotas}</div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Progresso</span>
          <span className="font-semibold">{pct}%</span>
        </div>
        <div className="h-2 rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full rounded-full transition-[width] duration-700"
            style={{ width: `${pct}%`, background: "var(--gradient-primary)" }}
          />
        </div>
        <div className="text-xs text-muted-foreground">
          Restam <span className="text-foreground font-semibold">{remaining}</span> cotas
        </div>
      </div>

      <Button className="bg-primary hover:bg-[var(--primary-glow)] text-primary-foreground font-semibold w-full mt-auto">
        Participar agora
      </Button>
    </Card>
  );
}