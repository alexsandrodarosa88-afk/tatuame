import { Button } from "@/components/ui/button";
import { ShoppingCart, User as UserIcon, Palette, ShieldCheck, Brush } from "lucide-react";
import { Link } from "@tanstack/react-router";
import logoTatuame from "@/assets/tatuame-logo.png";
import { useAuth } from "@/hooks/use-auth";
import { useIsAdmin } from "@/hooks/use-admin";
import { supabase } from "@/integrations/supabase/client";

export function Navbar() {
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const tatuadorHref = user ? "/tatuador" : "/login?next=/tatuador";
  return (
    <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2" aria-label="TATUAME — página inicial">
          <img src={logoTatuame} alt="TATUAME" className="h-8 w-auto" width={1536} height={1024} />
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          <Link to="/" hash="campanhas" className="hover:text-foreground transition-colors">Campanhas</Link>
          <Link to="/tatuadores" className="hover:text-foreground transition-colors">Tatuadores</Link>
          <Link to="/" hash="como-funciona" className="hover:text-foreground transition-colors">Como funciona</Link>
          <Link to="/" hash="garantia" className="hover:text-foreground transition-colors">Garantia</Link>
          <Link to={tatuadorHref as any} className="hover:text-foreground transition-colors inline-flex items-center gap-1"><Brush className="h-3.5 w-3.5" /> Área do Tatuador</Link>
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
            <Button asChild size="sm" variant="ghost"><Link to="/login">Entrar</Link></Button>
            <Button asChild size="sm" className="bg-primary hover:bg-[var(--primary-glow)] text-primary-foreground font-semibold">
              <Link to="/cadastro">Garantir minha vaga</Link>
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}