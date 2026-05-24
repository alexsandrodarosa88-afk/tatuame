import logoTatuame from "@/assets/tatuame-logo.png";
import { useSiteSettings } from "@/hooks/use-site-settings";

export function Footer() {
  const { get } = useSiteSettings();
  const logo = get("footer.logo", logoTatuame);
  return (
    <footer className="border-t border-border py-10">
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <img src={logo} alt="TATUAME" className="h-6 w-auto" width={1536} height={1024} loading="lazy" />
        </div>
        <nav className="flex gap-6">
          <a href="#campanhas" className="hover:text-foreground transition-colors">Campanhas</a>
          <a href="#como-funciona" className="hover:text-foreground transition-colors">Como funciona</a>
          <a href="#garantia" className="hover:text-foreground transition-colors">Garantia</a>
          <a href="/login?next=/tatuador" className="hover:text-foreground transition-colors">Área do Tatuador</a>
        </nav>
        <div>© {new Date().getFullYear()} {get("footer.copyright", "TATUAME — Todos os direitos reservados.")}</div>
      </div>
    </footer>
  );
}