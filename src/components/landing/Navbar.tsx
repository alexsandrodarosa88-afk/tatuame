import { Button } from "@/components/ui/button";
import { ShoppingCart, User as UserIcon, ShieldCheck, Brush } from "lucide-react";
import { Link } from "@tanstack/react-router";
import logoTatuame from "@/assets/tatuame-logo.png";
import { useAuth } from "@/hooks/use-auth";
import { useIsAdmin } from "@/hooks/use-admin";
import { useArtist } from "@/hooks/use-artist";
import { supabase } from "@/integrations/supabase/client";

export function Navbar() {
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const { artist, application } = useArtist();
  const isArtist = !!artist || !!application;
  const tatuadorHref = user ? "/tatuador" : "/cadastro-tatuador";
  return (
    <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2" aria-label="TATUAME — página inicial">
          <img src={logoTatuame} alt="TATUAME" className="h-8 w-auto" width={1536} height={1024} />
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          {user ? (
            <>
              <Link to="/campanhas" className="hover:text-foreground transition-colors">Campanhas</Link>
              <Link to="/tatuadores" className="hover:text-foreground transition-colors">Tatuadores</Link>
              <Link to="/" hash="como-funciona" className="hover:text-foreground transition-colors">Como funciona</Link>
              {(isArtist || isAdmin) && (
                <Link to="/tatuador" className="hover:text-foreground transition-colors inline-flex items-center gap-1"><Brush className="h-3.5 w-3.5" /> Área do Tatuador</Link>
              )}
            </>
          ) : (
            <>
              <Link to="/" hash="campanhas" className="hover:text-foreground transition-colors">Campanhas</Link>
              <Link to="/tatuadores" className="hover:text-foreground transition-colors">Tatuadores</Link>
              <Link to="/" hash="como-funciona" className="hover:text-foreground transition-colors">Como funciona</Link>
              <Link to="/" hash="garantia" className="hover:text-foreground transition-colors">Garantia</Link>
            <Link to={tatuadorHref as any} className="hover:text-foreground transition-colors inline-flex items-center gap-1"><Brush className="h-3.5 w-3.5" /> Cadastro Tatuador</Link>
            </>
          )}
        </nav>
        {user ? (
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Button asChild size="sm" variant="outline"><Link to="/admin"><ShieldCheck className="h-4 w-4 mr-1" /> Admin</Link></Button>
            )}
            <Button asChild size="sm" variant="ghost"><Link to="/carrinho"><ShoppingCart className="h-4 w-4" /></Link></Button>
            <Button asChild size="sm" variant="outline"><Link to="/conta"><UserIcon className="h-4 w-4 mr-1" /> Conta</Link></Button>
            <Button size="sm" variant="ghost" onClick={() => supabase.auth.signOut()}>Sair</Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="ghost" className="md:hidden text-primary">
              <Link to="/tatuadores"><Brush className="h-4 w-4" /></Link>
            </Button>
            <a href="https://instagram.com/tatuameoficial" target="_blank" rel="noopener noreferrer" aria-label="Instagram @tatuameoficial" className="hidden md:inline-flex p-2 text-muted-foreground hover:text-foreground transition-colors">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 1 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
            </a>
            <a href="https://tiktok.com/@tatuameoficial" target="_blank" rel="noopener noreferrer" aria-label="TikTok @tatuameoficial" className="hidden md:inline-flex p-2 text-muted-foreground hover:text-foreground transition-colors">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>
            </a>
            <Button asChild size="sm" variant="ghost"><Link to="/login">Entrar</Link></Button>
            <Button asChild size="sm" variant="outline" className="border-primary/40 text-primary hover:bg-primary/10">
              <Link to="/cadastro-tatuador"><Brush className="h-4 w-4 mr-1" /> Cadastro Tatuador</Link>
            </Button>
            <Button asChild size="sm" className="bg-primary hover:bg-[var(--primary-glow)] text-primary-foreground font-semibold">
              <Link to="/cadastro"><span className="md:hidden">Garantir vaga</span><span className="hidden md:inline">Garantir minha vaga</span></Link>
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}