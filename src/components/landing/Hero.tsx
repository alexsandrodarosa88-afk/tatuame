import { Button } from "@/components/ui/button";
import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
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
      <div aria-hidden className="absolute inset-0 -z-10 lv-grid-bg opacity-60" />
      <div
        aria-hidden
        className="absolute -top-32 right-[-10%] -z-10 h-[500px] w-[500px] rounded-full blur-3xl opacity-40"
        style={{ background: "var(--gradient-accent)" }}
      />
      <div className="container mx-auto px-4 grid lg:grid-cols-2 gap-16 items-center">
        <div className="space-y-8 lv-fade-up">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 backdrop-blur px-3 py-1 text-xs text-muted-foreground">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-[var(--accent-blue)] opacity-75 animate-ping" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[var(--accent-blue)]" />
            </span>
            <ShieldCheck className="h-3.5 w-3.5 text-success" />
            Você nunca perde — seu dinheiro vira crédito
          </div>
          <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-semibold leading-[1.02]">
            Sua próxima tatuagem pode custar{" "}
            <span className="lv-gradient-text">muito menos.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed">
            Transforme sua participação em crédito e desbloqueie upgrades exclusivos com os melhores tatuadores.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" className="rounded-full font-medium px-7 transition-[var(--transition-smooth)] shadow-[var(--shadow-glow)] hover:shadow-[0_0_60px_-8px_oklch(0.72_0.16_250_/_0.5)]">
              <Link to="/cadastro">
                Garantir minha vaga <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full border-border bg-card/40 backdrop-blur hover:bg-card">
              <a href="#como-funciona"><Sparkles className="mr-1 h-4 w-4 text-[var(--accent-blue)]" /> Como funciona</a>
            </Button>
          </div>
          <div className="flex flex-wrap gap-8 pt-6 text-sm">
            <Stat value="12 meses" label="Validade do crédito" />
            <Stat value="70%" label="Pode pagar da tatuagem" />
            <Stat value="4" label="Campanhas ativas" />
          </div>
        </div>
        <div className="relative lv-fade-up lv-glow-ring rounded-3xl">
          <div
            aria-hidden
            className="absolute -inset-4 -z-10 rounded-[2rem] blur-2xl opacity-30"
            style={{ background: "var(--gradient-accent)" }}
          />
          <img
            src={heroImage}
            alt="Close-up cinematográfico de braço tatuado em preto e cinza"
            width={1536}
            height={1024}
            className="relative rounded-3xl border border-border shadow-[var(--shadow-elegant)] object-cover aspect-[4/3] grayscale hover:grayscale-0 transition-all duration-1000"
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