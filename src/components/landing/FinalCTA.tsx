import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function FinalCTA() {
  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <div
          className="relative overflow-hidden rounded-3xl p-12 md:p-20 text-center"
          style={{ background: "var(--gradient-primary)" }}
        >
          <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0)_0%,rgba(0,0,0,0.4)_100%)]" />
          <div className="relative">
            <h2 className="font-display text-4xl md:text-6xl font-bold text-primary-foreground leading-tight max-w-3xl mx-auto">
              Sua próxima tatuagem está a um clique.
            </h2>
            <p className="text-primary-foreground/90 text-lg mt-5 max-w-xl mx-auto">
              Entre agora, garanta seu número e transforme cada real em arte.
            </p>
            <Button asChild size="lg" className="mt-8 bg-background text-foreground hover:bg-background/90 font-semibold">
              <a href="#campanhas">
                Entrar agora <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}