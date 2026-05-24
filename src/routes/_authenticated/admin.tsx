import { createFileRoute, Link, Outlet, useRouterState, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useIsAdmin } from "@/hooks/use-admin";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  LayoutDashboard, Users, ShoppingBag, Megaphone, Palette, CreditCard, ShieldCheck,
  UserPlus, Wallet, Sparkles, Banknote, Settings,
} from "lucide-react";
import { NotificationsBell } from "@/components/admin/NotificationsBell";

export const Route = createFileRoute("/_authenticated/admin")({ component: AdminLayout });

const nav: { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean }[] = [
  { to: "/admin", label: "Visão geral", icon: LayoutDashboard, exact: true },
  { to: "/admin/clientes", label: "Clientes", icon: Users },
  { to: "/admin/vendas", label: "Vendas", icon: ShoppingBag },
  { to: "/admin/campanhas", label: "Campanhas", icon: Megaphone },
  { to: "/admin/tatuadores", label: "Tatuadores", icon: Palette },
  { to: "/admin/aplicacoes", label: "Cadastros", icon: UserPlus },
  { to: "/admin/rateios", label: "Rateios", icon: Wallet },
  { to: "/admin/saques", label: "Saques", icon: Banknote },
  { to: "/admin/estilos", label: "Estilos", icon: Sparkles },
  { to: "/admin/mensalidades", label: "Mensalidades", icon: CreditCard },
  { to: "/admin/configuracoes", label: "Configurações", icon: Settings },
];

function AdminLayout() {
  const { isAdmin, loading } = useIsAdmin();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  useEffect(() => {
    if (!loading && !isAdmin) {
      // try bootstrap once
      supabase.rpc("bootstrap_first_admin").then(({ data, error }) => {
        if (error) {
          toast.error("Acesso negado: apenas administradores.");
          navigate({ to: "/" });
          return;
        }
        if (data === true) {
          toast.success("Você foi promovido a administrador!");
          window.location.reload();
        } else {
          toast.error("Acesso negado: apenas administradores.");
          navigate({ to: "/" });
        }
      });
    }
  }, [isAdmin, loading, navigate]);

  if (loading || !isAdmin) {
    return <div className="min-h-screen grid place-items-center text-muted-foreground">Verificando permissões...</div>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/admin" className="flex items-center gap-2 font-semibold">
            <ShieldCheck className="h-5 w-5 text-primary" /> Admin · TATUAME
          </Link>
          <div className="flex items-center gap-1">
            <NotificationsBell />
            <Button asChild size="sm" variant="ghost"><Link to="/">Voltar ao site</Link></Button>
          </div>
        </div>
      </header>
      <div className="container mx-auto px-4 py-6 grid gap-6 md:grid-cols-[220px,1fr]">
        <aside>
          <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible">
            {nav.map((item) => {
              const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to as any}
                  className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm whitespace-nowrap transition-colors ${
                    active ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" /> {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <main className="min-w-0"><Outlet /></main>
      </div>
    </div>
  );
}