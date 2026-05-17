import { Button } from "@/components/ui/button";
import { ShoppingCart, User as UserIcon } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export function Navbar() {
  const { user } = useAuth();
  return (
    <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-semibold tracking-tight">
          <span className="grid place-items-center h-7 w-7 rounded-md bg-foreground text-background text-[11px] font-bold">T</span>
          Tatua<span className="text-muted-foreground">.me</span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          <Link to="/" hash="campanhas" className="hover:text-foreground transition-colors">Campanhas</Link>
          <Link to="/" hash="como-funciona" className="hover:text-foreground transition-colors">Como funciona</Link>
          <Link to="/" hash="garantia" className="hover:text-foreground transition-colors">Garantia</Link>
        </nav>
        {user ? (
          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="ghost"><Link to="/carrinho"><ShoppingCart className="h-4 w-4" /></Link></Button>
            <Button asChild size="sm" variant="outline"><Link to="/conta"><UserIcon className="h-4 w-4 mr-1" /> Conta</Link></Button>
            <Button size="sm" variant="ghost" onClick={() => supabase.auth.signOut()}>Sair</Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="ghost"><Link to="/login">Entrar</Link></Button>
            <Button asChild size="sm" className="rounded-full font-medium">
              <Link to="/cadastro">Garantir minha vaga</Link>
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}