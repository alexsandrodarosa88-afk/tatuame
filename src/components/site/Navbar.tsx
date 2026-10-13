import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useIsAdmin } from "@/hooks/use-admin";
import logo from "@/assets/tatuame-logo-new.png.asset.json";

export function Navbar() {
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const [open, setOpen] = useState(false);
  const links = (
    <>
      <a href="/#campanhas" onClick={() => setOpen(false)} className="hover:text-primary">Campanhas</a>
      <a href="/#artistas" onClick={() => setOpen(false)} className="hover:text-primary">Artistas</a>
      <a href="/#como-funciona" onClick={() => setOpen(false)} className="hover:text-primary">Como funciona</a>
      <a href="/#faq" onClick={() => setOpen(false)} className="hover:text-primary">Dúvidas</a>
    </>
  );
  return (
    <header className="sticky top-0 z-50 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <Link to="/" aria-label="TATUAME — início" className="shrink-0">
          <img src={logo.url} alt="TATUAME" className="h-8 w-auto rounded bg-ink px-2 py-1" />
        </Link>
        <nav className="hidden items-center gap-7 text-sm font-medium text-muted-foreground md:flex">{links}</nav>
        <div className="flex items-center gap-2">
          <Button asChild size="sm" variant="outline" className="hidden sm:inline-flex">
            <Link to="/seja-artista">Seja um artista</Link>
          </Button>
          {user ? (
            <>
              {isAdmin && <Button asChild size="sm" variant="ghost"><Link to="/admin">Admin</Link></Button>}
              <Button asChild size="sm"><Link to="/conta">Minha conta</Link></Button>
            </>
          ) : (
            <Button asChild size="sm"><Link to="/login">Entrar</Link></Button>
          )}
          <button aria-label="Menu" onClick={() => setOpen(!open)} className="grid h-9 w-9 place-items-center rounded-md border md:hidden">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="flex flex-col gap-4 border-t bg-background px-4 py-5 text-base font-medium md:hidden">
          {links}
          <Link to="/seja-artista" onClick={() => setOpen(false)} className="font-semibold text-primary">Seja um artista TATUAME</Link>
        </nav>
      )}
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t bg-ink text-ink-foreground">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 text-sm md:flex-row md:items-center md:justify-between">
        <img src={logo.url} alt="TATUAME" className="h-8 w-auto self-start" />
        <p className="opacity-70">© {new Date().getFullYear()} TATUAME. Todos os direitos reservados.</p>
        <Link to="/seja-artista" className="underline-offset-4 hover:underline">Seja um artista TATUAME</Link>
      </div>
    </footer>
  );
}
