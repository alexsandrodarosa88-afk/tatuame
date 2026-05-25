import { Button } from "@/components/ui/button";
import { ArrowRight, ShieldCheck, Users } from "lucide-react";
import { Link } from "@tanstack/react-router";
import heroImage from "@/assets/hero-tattoo.jpg";
import { useSiteSettings } from "@/hooks/use-site-settings";

export function Hero() {
  const { get } = useSiteSettings();
  const img = get("hero.image", heroImage);
  const imgPos = get("hero.image_pos", "center center");
  return (
    <section id="top" className="relative overflow-hidden pt-32 pb-24 md:pt-40 md:pb-32">
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{ background: "var(--gradient-hero)" }}
      />
      <div className="container mx-auto px-4 grid lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 backdrop-blur px-3 py-1 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-success" />
            {get("hero.badge", "Você nunca perde — seu dinheiro vira crédito")}
          </div>
          <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight">
            {get("hero.title", "Sua próxima tatuagem pode custar")}{" "}
            <span className="bg-[image:var(--gradient-primary)] bg-clip-text text-transparent">
              {get("hero.title_highlight", "muito menos.")}
            </span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed">
            {get("hero.subtitle", "Transforme sua participação em crédito e desbloqueie upgrades exclusivos com os melhores tatuadores.")}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-primary hover:bg-[var(--primary-glow)] text-primary-foreground font-semibold shadow-[var(--shadow-elegant)] transition-[var(--transition-smooth)]">
              <Link to="/cadastro">
                {get("hero.cta_primary", "Garantir minha vaga")} <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-border bg-card/60 backdrop-blur hover:bg-card">
              <a href="#como-funciona">{get("hero.cta_secondary", "Como funciona")}</a>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-primary/40 text-primary hover:bg-primary/10">
              <Link to="/tatuadores"><Users className="mr-2 h-4 w-4" /> Ver tatuadores</Link>
            </Button>
          </div>
          <div className="flex flex-wrap gap-8 pt-6 text-sm">
            <Stat value={get("hero.stat1_value", "12 meses")} label={get("hero.stat1_label", "Validade do crédito")} />
            <Stat value={get("hero.stat2_value", "70%")} label={get("hero.stat2_label", "Pode pagar da tatuagem")} />
            <Stat value={get("hero.stat3_value", "4")} label={get("hero.stat3_label", "Campanhas ativas")} />
          </div>
        </div>
        <div className="relative">
          <div className="absolute -inset-4 bg-[image:var(--gradient-primary)] opacity-20 blur-3xl rounded-full" />
          <img
            src={img}
            alt="Close-up cinematográfico de braço tatuado em preto e cinza"
            width={1536}
            height={1024}
            loading="eager"
            fetchPriority="high"
            decoding="async"
            className="relative rounded-2xl border border-border shadow-[var(--shadow-card)] object-cover aspect-[4/3] w-full"
            style={{ objectPosition: imgPos }}
          />
        </div>
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="font-display text-2xl font-bold">{value}</div>
      <div className="text-muted-foreground">{label}</div>
    </div>
  );
}