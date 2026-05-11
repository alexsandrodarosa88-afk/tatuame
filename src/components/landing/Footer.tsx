import { Flame } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border py-10">
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2 font-display font-bold text-foreground">
          <span className="grid place-items-center h-6 w-6 rounded-md bg-[image:var(--gradient-primary)]">
            <Flame className="h-3 w-3 text-primary-foreground" />
          </span>
          Tatua<span className="text-primary">.me</span>
        </div>
        <nav className="flex gap-6">
          <a href="#campanhas" className="hover:text-foreground transition-colors">Campanhas</a>
          <a href="#como-funciona" className="hover:text-foreground transition-colors">Como funciona</a>
          <a href="#garantia" className="hover:text-foreground transition-colors">Garantia</a>
        </nav>
        <div>© {new Date().getFullYear()} Tatua.me — Todos os direitos reservados.</div>
      </div>
    </footer>
  );
}