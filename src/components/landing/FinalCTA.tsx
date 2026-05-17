import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function FinalCTA() {
  return (
    <section className="py-28">
      <div className="container mx-auto px-4">
        <div className="relative overflow-hidden rounded-3xl p-14 md:p-24 text-center bg-card border border-border">
          <div className="relative">
            <h2 className="font-display text-4xl md:text-6xl font-semibold text-foreground leading-[1.05] max-w-3xl mx-auto">
              Sua próxima tatuagem está a um clique.
            </h2>
            <p className="text-muted-foreground text-lg mt-5 max-w-xl mx-auto">
              Entre agora, garanta seu número e transforme cada real em arte.
            </p>
            <Button asChild size="lg" className="mt-10 rounded-full font-medium px-8">
              <Link to="/cadastro">
                Entrar agora <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}