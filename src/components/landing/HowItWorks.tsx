import { Wallet, Hash, Users, Gift, Dices, Trophy, ArrowRight } from "lucide-react";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

export function HowItWorks() {
  const { get } = useSiteSettings();
  const steps = [
    { title: "Escolha uma campanha", desc: "Navegue pelos prêmios exclusivos e escolha a arte que deseja conquistar.", number: "01" },
    { title: "Participe", desc: "Adquira suas cotas. Cada real investido vira crédito vitalício no ecossistema TATUAME.", number: "02" },
    { title: "Realize sua tattoo", desc: "Seja contemplado ou utilize seus créditos acumulados para fazer sua tatuagem.", number: "03" },
  ];

  return (
    <section id="como-funciona" className="py-32 relative overflow-hidden bg-gradient-dark">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-20 animate-reveal">
          <div className="inline-block px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-4">
            {get("how.eyebrow", "Experiência TATUAME")}
          </div>
          <h2 className="font-display text-4xl md:text-6xl font-black text-white italic uppercase leading-[0.9]">
            {get("how.title", "Simples. Justo.")}<br />
            <span className="text-primary text-glow">Transparente.</span>
          </h2>
        </div>

        <div className="grid lg:grid-cols-3 gap-12 relative">
          {/* Connector lines (Desktop) */}
          <div className="hidden lg:block absolute top-1/2 left-0 w-full h-px bg-white/5 -translate-y-1/2 -z-10" />
          
          {steps.map((s, i) => (
            <div key={s.title} className="group relative glass rounded-[2.5rem] p-10 transition-premium hover:border-primary/40 hover:-translate-y-2">
              <div className="font-display text-8xl font-black text-white/5 absolute -top-8 -left-4 italic select-none group-hover:text-primary/10 transition-colors">
                {s.number}
              </div>
              
              <div className="relative pt-8">
                <h3 className="font-display text-2xl font-black text-white italic uppercase mb-4 tracking-tight leading-tight">
                  {s.title}
                </h3>
                <p className="text-muted-foreground font-medium leading-relaxed italic">
                  {s.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-20 glass rounded-[3rem] p-8 md:p-12 border-primary/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] -z-10" />
          <div className="flex flex-col md:flex-row items-center gap-8 justify-between relative">
            <div className="max-w-xl text-center md:text-left">
              <h3 className="font-display text-2xl font-black text-white italic uppercase mb-2">Seu investimento nunca se perde.</h3>
              <p className="text-muted-foreground font-medium italic">
                No TATUAME, cada participação vira crédito direto para você utilizar com qualquer artista da nossa rede. É arte garantida na sua pele.
              </p>
            </div>
            <Button asChild size="lg" className="h-14 px-10 bg-primary hover:bg-[oklch(0.6_0.23_27)] text-primary-foreground font-black italic uppercase shadow-glow transition-premium shrink-0">
              <Link to="/cadastro" search={{ next: "/" }}>
                Começar agora <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}