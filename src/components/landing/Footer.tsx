import logoTatuame from "@/assets/tatuame-logo.png";
import { useSiteSettings } from "@/hooks/use-site-settings";

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
    </svg>
  );
}

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
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <a href="https://instagram.com/tatuameoficial" target="_blank" rel="noopener noreferrer" aria-label="Instagram @tatuameoficial" className="hover:text-foreground transition-colors">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 1 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
            </a>
            <a href="https://tiktok.com/@tatuameoficial" target="_blank" rel="noopener noreferrer" aria-label="TikTok @tatuameoficial" className="hover:text-foreground transition-colors">
              <TikTokIcon className="h-5 w-5" />
            </a>
          </div>
          <div>© {new Date().getFullYear()} {get("footer.copyright", "TATUAME — Todos os direitos reservados.")}</div>
        </div>
      </div>
    </footer>
  );
}