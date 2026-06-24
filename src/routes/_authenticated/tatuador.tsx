import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, UserCircle, Wallet, Palette, FileText, Banknote, FileSignature, Crown, Megaphone } from "lucide-react";
import { useArtist } from "@/hooks/use-artist";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyArtistPlan } from "@/lib/artist-plan.functions";
import { Loader2 } from "lucide-react";
import { ArtistPolicyAcceptGate } from "@/components/ArtistPolicyAcceptGate";

export const Route = createFileRoute("/_authenticated/tatuador")({ component: TatuadorLayout });

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean; premiumOnly?: boolean };
const nav: NavItem[] = [
  { to: "/tatuador", label: "Visão geral", icon: LayoutDashboard, exact: true },
  { to: "/tatuador/perfil", label: "Meu perfil", icon: UserCircle },
  { to: "/tatuador/dados", label: "Meus dados", icon: FileText },
  { to: "/tatuador/plano", label: "Meu plano", icon: Crown },
  { to: "/tatuador/divulgacao", label: "Divulgação", icon: Megaphone, premiumOnly: true },
  { to: "/tatuador/rateio", label: "Meus rateios", icon: Wallet, premiumOnly: true },
  { to: "/tatuador/solicitar-pagamento", label: "Solicitar pagamento", icon: Banknote, premiumOnly: true },
  { to: "/tatuador/termos", label: "Termos", icon: FileSignature },
];

function TatuadorLayout() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const { application } = useArtist();
  const approved = application?.status === "approved";
  const planFn = useServerFn(getMyArtistPlan);
  const { data: planData, isLoading: planLoading } = useQuery({
    queryKey: ["artist-plan"],
    queryFn: () => planFn(),
    enabled: approved,
  });

  if (!approved) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <Outlet />
      </div>
    );
  }

  if (planLoading) {
    return <div className="grid place-items-center py-20 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  }

  const isPremium = planData?.artistFound && planData.premiumActive;
  const visibleNav = nav.filter((n) => !n.premiumOnly || isPremium);

  return (
    <div className="container mx-auto px-4 py-6 grid gap-6 md:grid-cols-[220px,1fr]">
      <aside>
        <div className="mb-4 flex items-center gap-2 px-3 py-2 rounded-md bg-primary/10 text-primary">
          <Palette className="h-4 w-4" />
          <span className="text-sm font-semibold">Área do Tatuador</span>
        </div>
        {planData?.artistFound && (
          <div className={`mb-3 px-3 py-2 rounded-md text-xs font-medium ${isPremium ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" : "bg-muted text-muted-foreground"}`}>
            {isPremium ? "Plano Premium" : "Plano Free"}
          </div>
        )}
        <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible">
          {visibleNav.map((item) => {
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
      <ArtistPolicyAcceptGate />
    </div>
  );
}