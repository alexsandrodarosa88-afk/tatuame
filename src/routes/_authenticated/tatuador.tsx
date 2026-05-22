import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, UserCircle, Wallet, Palette, CreditCard, FileText } from "lucide-react";
import { useArtist } from "@/hooks/use-artist";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyArtistSubscription } from "@/lib/artist-subscription.functions";
import { AssinaturaPage } from "./tatuador.assinatura";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/tatuador")({ component: TatuadorLayout });

const nav: { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean }[] = [
  { to: "/tatuador", label: "Visão geral", icon: LayoutDashboard, exact: true },
  { to: "/tatuador/perfil", label: "Meu perfil", icon: UserCircle },
  { to: "/tatuador/dados", label: "Meus dados", icon: FileText },
  { to: "/tatuador/mensalidade", label: "Mensalidade", icon: CreditCard },
  { to: "/tatuador/rateio", label: "Meus rateios", icon: Wallet },
];

function TatuadorLayout() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const { application } = useArtist();
  const approved = application?.status === "approved";
  const statusFn = useServerFn(getMyArtistSubscription);
  const { data: sub, isLoading: subLoading } = useQuery({
    queryKey: ["artist-sub"],
    queryFn: () => statusFn(),
    enabled: approved,
  });

  if (!approved) {
    // Antes da aprovação não mostramos a navegação interna — apenas o formulário/estado.
    return (
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <Outlet />
      </div>
    );
  }

  // Bloqueio: só libera quando a assinatura estiver ativa.
  // Exceção: rota /tatuador/dados (precisa preencher dados antes de pagar).
  const isOnDados = pathname.startsWith("/tatuador/dados");
  const isOnAssinatura = pathname.startsWith("/tatuador/assinatura");
  const subActive = sub?.artistFound && sub.status === "active";

  if (approved && !subLoading && sub && !subActive && !isOnDados && !isOnAssinatura) {
    return (
      <div className="container mx-auto px-4 py-10">
        <AssinaturaPage />
      </div>
    );
  }
  if (approved && subLoading) {
    return <div className="grid place-items-center py-20 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  }

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