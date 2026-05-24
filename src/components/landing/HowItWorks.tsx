import { Wallet, Hash, Users, Gift, Dices, Trophy } from "lucide-react";
import { useSiteSettings } from "@/hooks/use-site-settings";

export function HowItWorks() {
  const { get } = useSiteSettings();
  const steps = [
    { icon: Wallet, title: get("how.step1_title", "Compre crédito"), desc: get("how.step1_desc", "Escolha o valor e adicione crédito à sua conta. Válido por 12 meses.") },
    { icon: Hash, title: get("how.step2_title", "Receba seu número"), desc: get("how.step2_desc", "Cada compra gera um número promocional único e exclusivo.") },
    { icon: Users, title: get("how.step3_title", "Participe da campanha"), desc: get("how.step3_desc", "Acompanhe o progresso em tempo real até o fechamento.") },
    { icon: Gift, title: get("how.step4_title", "Garanta seu upgrade"), desc: get("how.step4_desc", "O sorteado leva a tatuagem completa. Todos saem com crédito.") },
    { icon: Dices, title: get("how.step5_title", "Sorteio"), desc: get("how.step5_desc", "O número sorteado levará como base o número sorteado pela loteria federal.") },
    { icon: Trophy, title: get("how.step6_title", "Você ganhou!"), desc: get("how.step6_desc", "Escolha um dos tatuadores que fazem parte do TATUAME e agende sua tattoo. Nós pagamos!") },
  ];
  return (
    <section id="como-funciona" className="py-24 border-t border-border bg-card/30">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="text-xs uppercase tracking-[0.2em] text-primary font-semibold mb-3">{get("how.eyebrow", "Como funciona")}</div>
          <h2 className="font-display text-4xl md:text-5xl font-bold">{get("how.title", "Simples, justo e transparente.")}</h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {steps.map((s, i) => (
            <div key={s.title} className="relative rounded-xl border border-border bg-background/60 backdrop-blur p-6 transition-[var(--transition-smooth)] hover:border-primary/40">
              <div className="absolute -top-3 -left-3 h-8 w-8 grid place-items-center rounded-full bg-[image:var(--gradient-primary)] text-primary-foreground text-sm font-bold">
                {i + 1}
              </div>
              <s.icon className="h-7 w-7 text-primary mb-4" />
              <h3 className="font-display text-xl font-semibold mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}