import logoTatuame from "@/assets/tatuame-logo.png";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { Link } from "@tanstack/react-router";
import { Instagram, Send, ArrowUp } from "lucide-react";

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

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <footer className="bg-gradient-dark pt-20 pb-10 border-t border-white/5 relative">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-4 gap-12 mb-20">
          <div className="space-y-6 lg:col-span-2">
            <Link to="/" className="inline-block">
              <img src={logo} alt="TATUAME" className="h-10 w-auto invert grayscale" />
            </Link>
            <p className="text-muted-foreground font-medium max-w-md italic text-lg leading-relaxed">
              O ecossistema definitivo para amantes da tatuagem. Transformamos participações em arte e conectamos os melhores artistas do Brasil.
            </p>
            <div className="flex items-center gap-4 pt-4">
              <a href="https://instagram.com/tatuameoficial" target="_blank" className="h-12 w-12 rounded-2xl glass grid place-items-center transition-premium hover:text-primary hover:border-primary/40">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="h-12 w-12 rounded-2xl glass grid place-items-center transition-premium hover:text-primary hover:border-primary/40">
                <TikTokIcon className="h-5 w-5" />
              </a>
              <a href="#" className="h-12 w-12 rounded-2xl glass grid place-items-center transition-premium hover:text-primary hover:border-primary/40">
                <Send className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div className="space-y-6">
            <h4 className="font-display text-xs font-black text-white uppercase tracking-[0.3em]">Plataforma</h4>
            <nav className="flex flex-col gap-3">
              <a href="#campanhas" className="text-muted-foreground font-bold text-sm uppercase tracking-widest hover:text-primary transition-colors">Campanhas</a>
              <Link to="/tatuadores" className="text-muted-foreground font-bold text-sm uppercase tracking-widest hover:text-primary transition-colors">Artistas</Link>
              <a href="#como-funciona" className="text-muted-foreground font-bold text-sm uppercase tracking-widest hover:text-primary transition-colors">Como funciona</a>
              <Link to="/cadastro" search={{ next: "/" }} className="text-muted-foreground font-bold text-sm uppercase tracking-widest hover:text-primary transition-colors">Participar</Link>
            </nav>
          </div>

          <div className="space-y-6">
            <h4 className="font-display text-xs font-black text-white uppercase tracking-[0.3em]">Tatuadores</h4>
            <nav className="flex flex-col gap-3">
              <Link to="/tatuador-acesso" className="text-muted-foreground font-bold text-sm uppercase tracking-widest hover:text-primary transition-colors">Área do Artista</Link>
              <Link to="/cadastro-tatuador" className="text-muted-foreground font-bold text-sm uppercase tracking-widest hover:text-primary transition-colors">Seja Parceiro</Link>
              <Link to="/login" search={{ next: "/tatuador" }} className="text-muted-foreground font-bold text-sm uppercase tracking-widest hover:text-primary transition-colors">Entrar</Link>
            </nav>
          </div>
        </div>

        <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            © {new Date().getFullYear()} {get("footer.copyright", "TATUAME — Todos os direitos reservados.")}
          </div>
          
          <div className="flex items-center gap-8 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            <a href="#" className="hover:text-white transition-colors">Termos de Uso</a>
            <a href="#" className="hover:text-white transition-colors">Privacidade</a>
            <button onClick={scrollToTop} className="h-10 w-10 rounded-full glass grid place-items-center text-white hover:text-primary transition-premium">
              <ArrowUp className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}