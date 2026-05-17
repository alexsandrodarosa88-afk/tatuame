import { campaigns } from "@/data/campaigns";
import { CampaignCard } from "./CampaignCard";

export function Campaigns() {
  return (
    <section id="campanhas" className="py-24 border-t border-border">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mb-14">
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-medium mb-3">Campanhas ativas</div>
          <h2 className="font-display text-4xl md:text-5xl font-semibold leading-[1.05]">
            Escolha sua campanha e garanta seu número.
          </h2>
          <p className="text-muted-foreground mt-4 text-lg">
            Cada compra gera um número único. Quando a campanha fecha, um sorteado leva o upgrade completo da tatuagem.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {campaigns.map((c) => (
            <CampaignCard key={c.id} campaign={c} />
          ))}
        </div>
      </div>
    </section>
  );
}