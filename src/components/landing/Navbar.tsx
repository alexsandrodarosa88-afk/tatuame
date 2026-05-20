import { Button } from "@/components/ui/button";
import { Flame, ShoppingCart, User as UserIcon, Palette, ShieldCheck } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useIsAdmin } from "@/hooks/use-admin";
import { supabase } from "@/integrations/supabase/client";

export function Navbar() {
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  return (
    <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold tracking-tight">
          <span className="grid place-items-center h-8 w-8 rounded-lg bg-[image:var(--gradient-primary)] shadow-[var(--shadow-elegant)]">
            <Flame className="h-4 w-4 text-primary-foreground" />
          </span>
          Tatua<span className="text-primary">.me</span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          <Link to="/" hash="campanhas" className="hover:text-foreground transition-colors">Campanhas</Link>
          <Link to="/tatuadores" className="hover:text-foreground transition-colors">Tatuadores</Link>
          <Link to="/" hash="como-funciona" className="hover:text-foreground transition-colors">Como funciona</Link>
          <Link to="/" hash="garantia" className="hover:text-foreground transition-colors">Garantia</Link>
        </nav>
        {user ? (
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Button asChild size="sm" variant="outline"><Link to="/admin"><ShieldCheck className="h-4 w-4 mr-1" /> Admin</Link></Button>
            )}
            <Button asChild size="sm" variant="ghost" className="md:hidden"><Link to="/tatuadores"><Palette className="h-4 w-4" /></Link></Button>
            <Button asChild size="sm" variant="ghost"><Link to="/carrinho"><ShoppingCart className="h-4 w-4" /></Link></Button>
            <Button asChild size="sm" variant="outline"><Link to="/conta"><UserIcon className="h-4 w-4 mr-1" /> Conta</Link></Button>
            <Button size="sm" variant="ghost" onClick={() => supabase.auth.signOut()}>Sair</Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="ghost" className="md:hidden"><Link to="/tatuadores">Tatuadores</Link></Button>
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