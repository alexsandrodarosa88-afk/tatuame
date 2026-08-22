import { Button } from "@/components/ui/button";
import { ArrowRight, ShieldCheck, Play } from "lucide-react";
import { Link } from "@tanstack/react-router";
import heroImage from "@/assets/hero-tattoo.jpg";
import { useSiteSettings } from "@/hooks/use-site-settings";

export function Hero() {
  const { get } = useSiteSettings();
  const img = get("hero.image", heroImage);
  const imgPos = get("hero.image_pos", "center center");

  return (
    <section id="top" className="relative min-h-[90vh] flex items-center overflow-hidden pt-20">
      {/* Visual background elements */}
      <div 
        aria-hidden 
        className="absolute inset-0 -z-10 bg-[image:var(--gradient-hero)]" 
      />
      <div className="absolute top-1/4 -right-20 w-96 h-96 bg-primary/10 blur-[120px] rounded-full -z-10" />
      
      <div className="container mx-auto px-4 grid lg:grid-cols-2 gap-16 items-center">
        <div className="space-y-10 animate-reveal">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 backdrop-blur-md px-4 py-1.5 text-xs font-semibold text-primary uppercase tracking-wider">
            <ShieldCheck className="h-4 w-4" />
            {get("hero.badge", "Você nunca perde — seu dinheiro vira crédito")}
          </div>
          
          <div className="space-y-6">
            <h1 className="font-display text-6xl md:text-7xl lg:text-8xl font-black leading-[0.95] tracking-tight text-white uppercase italic">
              {get("hero.title", "Sua próxima")}<br />
              <span className="text-glow text-primary">
                {get("hero.title_highlight", "Tattoo")}
              </span><br />
              Começa aqui.
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-lg leading-relaxed font-medium">
              {get("hero.subtitle", "Transforme sua participação em crédito e realize a arte que você sempre quis com os melhores artistas do Brasil.")}
            </p>
          </div>

          <div className="flex flex-wrap gap-4 pt-4">
            <Button asChild size="xl" className="h-14 px-8 bg-primary hover:bg-[oklch(0.6_0.23_27)] text-primary-foreground font-bold shadow-glow transition-premium group">
              <Link to="/cadastro" search={{ next: "/" }}>
                EXPLORAR CAMPANHAS <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            
            <Button asChild size="xl" variant="outline" className="h-14 px-8 glass hover:bg-white/5 font-semibold transition-premium">
              <a href="#como-funciona" className="flex items-center">
                <Play className="mr-2 h-4 w-4 fill-current" /> COMO FUNCIONA
              </a>
            </Button>
          </div>

          <div className="flex flex-wrap gap-12 pt-10 border-t border-white/5">
            <Stat value={get("hero.stat1_value", "12 meses")} label={get("hero.stat1_label", "Validade do crédito")} />
            <Stat value={get("hero.stat2_value", "Até 70%")} label={get("hero.stat2_label", "Cobre o valor total")} />
            <Stat value={get("hero.stat3_value", "Premium")} label={get("hero.stat3_label", "Experiência garantida")} />
          </div>
        </div>

        <div className="relative lg:h-[700px] flex items-center justify-center animate-fade-in delay-300">
          <div className="absolute inset-0 bg-primary/20 blur-[150px] mask-radial opacity-50" />
          
          <div className="relative w-full aspect-[4/5] lg:aspect-auto lg:h-full max-w-[500px] group">
            {/* Decorative border */}
            <div className="absolute -inset-3 border border-primary/20 rounded-[2rem] -rotate-3 transition-premium group-hover:rotate-0" />
            <div className="absolute -inset-3 border border-white/10 rounded-[2rem] rotate-3 transition-premium group-hover:rotate-0" />
            
            <img
              src={img}
              alt="Tattoo Art"
              className="relative h-full w-full object-cover rounded-[1.8rem] border border-white/10 shadow-elegant grayscale-[0.2] contrast-[1.1] transition-premium group-hover:grayscale-0"
              style={{ objectPosition: imgPos }}
            />
            
            {/* Floating Info Box */}
            <div className="absolute -bottom-6 -left-6 glass p-6 rounded-2xl animate-reveal delay-500 max-w-[200px] shadow-elegant">
              <div className="text-primary font-black text-2xl tracking-tighter italic">TATUAME+</div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1 leading-tight">O maior ecossistema de tatuagem do Brasil</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="space-y-1">
      <div className="font-display text-2xl font-black text-white italic tracking-tighter">{value}</div>
      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{label}</div>
    </div>
  );
}
