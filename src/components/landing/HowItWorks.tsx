import { Wallet, Hash, Users, Gift } from "lucide-react";

const steps = [
  { icon: Wallet, title: "Compre crédito", desc: "Escolha o valor e adicione crédito à sua conta. Válido por 12 meses." },
  { icon: Hash, title: "Receba seu número", desc: "Cada compra gera um número promocional único e exclusivo." },
  { icon: Users, title: "Participe da campanha", desc: "Acompanhe o progresso em tempo real até o fechamento." },
  { icon: Gift, title: "Garanta seu upgrade", desc: "O sorteado leva a tatuagem completa. Todos saem com crédito." },
];

export function HowItWorks() {
  return (
    <section id="como-funciona" className="py-24 border-t border-border bg-card/30">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-medium mb-3">Como funciona</div>
          <h2 className="font-display text-4xl md:text-5xl font-semibold">Simples, justo e transparente.</h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {steps.map((s, i) => (
            <div key={s.title} className="relative rounded-2xl border border-border bg-background/60 backdrop-blur p-7 transition-[var(--transition-smooth)] hover:border-foreground/30 hover:-translate-y-0.5">
              <div className="text-xs text-muted-foreground tabular-nums mb-4">0{i + 1}</div>
              <s.icon className="h-6 w-6 text-foreground mb-4" strokeWidth={1.5} />
              <h3 className="font-display text-xl font-semibold mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}