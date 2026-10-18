import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { LayoutDashboard, Megaphone, ShoppingBag, Users, Palette, Settings, Radio } from "lucide-react";
import { useIsAdmin } from "@/hooks/use-admin";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin")({ component: AdminLayout });

const nav = [
  { to: "/admin", label: "Visão geral", icon: LayoutDashboard, exact: true },
  { to: "/admin/campanhas", label: "Campanhas", icon: Megaphone },
  { to: "/admin/vendas", label: "Vendas", icon: ShoppingBag },
  { to: "/admin/clientes", label: "Clientes", icon: Users },
  { to: "/admin/artistas", label: "Artistas", icon: Palette },
  { to: "/admin/sorteios", label: "Sorteios", icon: Radio },
  { to: "/admin/configuracoes", label: "Site", icon: Settings },
];

function AdminLayout() {
  const { isAdmin, loading } = useIsAdmin();
  const navigate = useNavigate();
  const path = useRouterState({ select: (r) => r.location.pathname });
  useEffect(() => { if (!loading && !isAdmin) navigate({ to: "/" }); }, [loading, isAdmin, navigate]);
  if (loading || !isAdmin) return <div className="grid min-h-screen place-items-center text-muted-foreground">Verificando acesso...</div>;
  return (
    <div className="min-h-screen bg-secondary/40">
      <header className="border-b bg-card">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <Link to="/admin" className="font-display text-lg">TATUAME · Admin</Link>
          <Button asChild size="sm" variant="ghost"><Link to="/">Ver site</Link></Button>
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 md:grid-cols-[200px_1fr]">
        <nav className="flex gap-1 overflow-x-auto md:flex-col">
          {nav.map(({ to, label, icon: I, exact }) => {
            const active = exact ? path === to : path.startsWith(to);
            return <Link key={to} to={to as any} className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm ${active ? "bg-card font-semibold text-primary shadow-sm" : "text-muted-foreground hover:bg-card"}`}><I className="h-4 w-4" />{label}</Link>;
          })}
        </nav>
        <main className="min-w-0"><Outlet /></main>
      </div>
    </div>
  );
}
