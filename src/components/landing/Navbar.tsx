import { Button } from "@/components/ui/button";
import { Flame } from "lucide-react";

export function Navbar() {
  return (
    <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <a href="#top" className="flex items-center gap-2 font-display text-lg font-bold tracking-tight">
          <span className="grid place-items-center h-8 w-8 rounded-lg bg-[image:var(--gradient-primary)] shadow-[var(--shadow-elegant)]">
            <Flame className="h-4 w-4 text-primary-foreground" />
          </span>
          Tatua<span className="text-primary">.me</span>
        </a>
        <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          <a href="#campanhas" className="hover:text-foreground transition-colors">Campanhas</a>
          <a href="#como-funciona" className="hover:text-foreground transition-colors">Como funciona</a>
          <a href="#garantia" className="hover:text-foreground transition-colors">Garantia</a>
          <a href="#depoimentos" className="hover:text-foreground transition-colors">Depoimentos</a>
        </nav>
        <Button asChild size="sm" className="bg-primary hover:bg-[var(--primary-glow)] text-primary-foreground font-semibold">
          <a href="#campanhas">Garantir minha vaga</a>
        </Button>
      </div>
    </header>
  );
}