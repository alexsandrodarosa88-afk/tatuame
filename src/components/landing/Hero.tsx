import { Button } from "@/components/ui/button";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Link } from "@tanstack/react-router";
import heroImage from "@/assets/hero-tattoo.jpg";

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden pt-36 pb-28 md:pt-48 md:pb-40">
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{ background: "var(--gradient-hero)" }}
      />
      <div className="container mx-auto px-4 grid lg:grid-cols-2 gap-16 items-center">
        <div className="space-y-8 lv-fade-up">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 backdrop-blur px-3 py-1 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-success" />
            Você nunca perde — seu dinheiro vira crédito
          </div>
          <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-semibold leading-[1.02]">
            Sua próxima tatuagem pode custar{" "}
            <span className="text-muted-foreground">muito menos.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed">
            Transforme sua participação em crédito e desbloqueie upgrades exclusivos com os melhores tatuadores.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" className="rounded-full font-medium px-7 transition-[var(--transition-smooth)]">
              <Link to="/cadastro">
                Garantir minha vaga <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full border-border bg-transparent hover:bg-card">
              <a href="#como-funciona">Como funciona</a>
            </Button>
          </div>
          <div className="flex flex-wrap gap-8 pt-6 text-sm">
            <Stat value="12 meses" label="Validade do crédito" />
            <Stat value="70%" label="Pode pagar da tatuagem" />
            <Stat value="4" label="Campanhas ativas" />
          </div>
        </div>
        <div className="relative lv-fade-up">
          <img
            src={heroImage}
            alt="Close-up cinematográfico de braço tatuado em preto e cinza"
            width={1536}
            height={1024}
            className="relative rounded-3xl border border-border shadow-[var(--shadow-card)] object-cover aspect-[4/3] grayscale"
          />
        </div>
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="font-display text-2xl font-semibold tabular-nums">{value}</div>
      <div className="text-muted-foreground">{label}</div>
    </div>
  );
}