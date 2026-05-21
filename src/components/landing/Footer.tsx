import logoTatuame from "@/assets/tatuame-logo.png";

export function Footer() {
  return (
    <footer className="border-t border-border py-10">
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <img src={logoTatuame} alt="TATUAME" className="h-6 w-auto" width={1536} height={1024} loading="lazy" />
        </div>
        <nav className="flex gap-6">
          <a href="#campanhas" className="hover:text-foreground transition-colors">Campanhas</a>
          <a href="#como-funciona" className="hover:text-foreground transition-colors">Como funciona</a>
          <a href="#garantia" className="hover:text-foreground transition-colors">Garantia</a>
          <a href="/login?next=/tatuador" className="hover:text-foreground transition-colors">Área do Tatuador</a>
        </nav>
        <div>© {new Date().getFullYear()} TATUAME — Todos os direitos reservados.</div>
      </div>
    </footer>
  );
}