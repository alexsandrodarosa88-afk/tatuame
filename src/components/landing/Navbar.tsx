import { Button } from "@/components/ui/button";
import { ShoppingCart, User as UserIcon, ShieldCheck, Brush, Menu, X } from "lucide-react";
import { Link, useRouter } from "@tanstack/react-router";
import logoTatuame from "@/assets/tatuame-logo.png";
import { useAuth } from "@/hooks/use-auth";
import { useIsAdmin } from "@/hooks/use-admin";
import { useArtist } from "@/hooks/use-artist";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";

export function Navbar() {
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const { artist, application } = useArtist();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const isArtist = !!artist || !!application;
  const tatuadorHref = user ? "/tatuador" : "/tatuador-acesso";

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 inset-x-0 z-[100] transition-premium duration-500 ${isScrolled ? 'h-20 bg-background/80 backdrop-blur-2xl border-b border-white/5' : 'h-24 bg-transparent'}`}>
      <div className="container mx-auto h-full flex items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 group relative z-10" aria-label="TATUAME — página inicial">
          <img src={logoTatuame} alt="TATUAME" className="h-9 md:h-10 w-auto brightness-0 invert transition-premium group-hover:scale-105 mix-blend-screen" />
          <div className="absolute -inset-4 bg-primary/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-premium" />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-10">
          <NavLink to="/" hash="campanhas">Campanhas</NavLink>
          <NavLink to="/tatuadores">Artistas</NavLink>
          <NavLink to="/" hash="como-funciona">Como funciona</NavLink>
          <NavLink to="/" hash="garantia">Garantia</NavLink>
          
          <div className="h-4 w-px bg-white/10 mx-2" />
          
          <Link to={tatuadorHref as any} className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-premium flex items-center gap-2">
            <Brush className="h-4 w-4" /> Sou Tatuador
          </Link>
        </nav>

        <div className="flex items-center gap-3 relative z-10">
          {user ? (
            <div className="flex items-center gap-2">
              {isAdmin && (
                <Button asChild size="sm" variant="outline" className="glass h-10 px-4 border-primary/20 text-primary hover:bg-primary hover:text-white transition-premium">
                  <Link to="/admin"><ShieldCheck className="h-4 w-4 mr-2" /> Admin</Link>
                </Button>
              )}
              <Button asChild size="sm" variant="ghost" className="h-10 w-10 rounded-full glass text-white hover:text-primary transition-premium">
                <Link to="/carrinho"><ShoppingCart className="h-5 w-5" /></Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="glass h-10 px-4 font-black uppercase italic tracking-tighter text-white hover:text-primary transition-premium border-white/10">
                <Link to="/conta"><UserIcon className="h-4 w-4 mr-2" /> Conta</Link>
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Button asChild size="sm" variant="ghost" className="text-[11px] font-black uppercase tracking-[0.2em] text-white hover:text-primary transition-premium hidden md:flex">
                <Link to="/login" search={{ next: "/" }}>Entrar</Link>
              </Button>
              
              <Button asChild size="lg" className="h-11 md:h-12 px-6 md:px-8 bg-white text-black hover:bg-primary hover:text-white font-black uppercase italic tracking-tighter transition-premium shadow-elegant rounded-xl">
                <Link to="/cadastro" search={{ next: "/" }}>
                  <span className="md:hidden">PARTICIPAR</span>
                  <span className="hidden md:inline">GARANTIR VAGA</span>
                </Link>
              </Button>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden h-10 w-10 rounded-xl glass grid place-items-center text-white"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <div className={`fixed inset-0 bg-background/98 backdrop-blur-2xl z-[90] lg:hidden transition-premium duration-500 ${mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="flex flex-col items-center justify-center min-h-screen gap-8 p-6">
          <MobileNavLink to="/" hash="campanhas" onClick={() => setMobileMenuOpen(false)}>Campanhas</MobileNavLink>
          <MobileNavLink to="/tatuadores" onClick={() => setMobileMenuOpen(false)}>Tatuadores</MobileNavLink>
          <MobileNavLink to="/" hash="como-funciona" onClick={() => setMobileMenuOpen(false)}>Como funciona</MobileNavLink>
          <MobileNavLink to={tatuadorHref as any} onClick={() => setMobileMenuOpen(false)}>Sou Tatuador</MobileNavLink>
          
          <div className="w-full h-px bg-white/5 max-w-[200px]" />
          
          {user ? (
            <>
              <MobileNavLink to="/conta" onClick={() => setMobileMenuOpen(false)}>Minha Conta</MobileNavLink>
              <button 
                onClick={() => { supabase.auth.signOut(); setMobileMenuOpen(false); }}
                className="text-2xl font-black text-primary uppercase italic"
              >
                SAIR
              </button>
            </>
          ) : (
            <MobileNavLink to="/login" search={{ next: "/" }} onClick={() => setMobileMenuOpen(false)}>ENTRAR</MobileNavLink>
          )}
        </div>
      </div>
    </header>
  );
}

function NavLink({ to, hash, children, search }: { to: string, hash?: string, children: React.ReactNode, search?: any }) {
  return (
    <Link 
      to={to as any} 
      hash={hash}
      search={search}
      className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-white hover:text-glow transition-premium relative group"
    >
      {children}
      <span className="absolute -bottom-1 left-0 w-0 h-px bg-primary transition-premium group-hover:w-full" />
    </Link>
  );
}

function MobileNavLink({ to, hash, children, onClick, search }: { to: string, hash?: string, children: React.ReactNode, onClick: () => void, search?: any }) {
  return (
    <Link 
      to={to as any} 
      hash={hash}
      search={search}
      onClick={onClick}
      className="text-3xl font-black text-white uppercase italic hover:text-primary transition-premium"
    >
      {children}
    </Link>
  );
}