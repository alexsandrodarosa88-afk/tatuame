import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, UserCircle, Wallet, Palette } from "lucide-react";

export const Route = createFileRoute("/_authenticated/tatuador")({ component: TatuadorLayout });

const nav: { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean }[] = [
  { to: "/tatuador", label: "Visão geral", icon: LayoutDashboard, exact: true },
  { to: "/tatuador/perfil", label: "Meu perfil", icon: UserCircle },
  { to: "/tatuador/rateio", label: "Meus rateios", icon: Wallet },
];

function TatuadorLayout() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  return (
    <div className="container mx-auto px-4 py-6 grid gap-6 md:grid-cols-[220px,1fr]">
      <aside>
        <div className="mb-4 flex items-center gap-2 px-3 py-2 rounded-md bg-primary/10 text-primary">
          <Palette className="h-4 w-4" />
          <span className="text-sm font-semibold">Área do Tatuador</span>
        </div>
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
  );
}