import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/site/Navbar";
import { db, BRL, loadSettings } from "@/lib/db";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/conta")({
  component: Conta,
  head: () => ({ meta: [
    { title: "Minha conta | TATUAME" }, { name: "description", content: "Suas compras e números da sorte." },
    { property: "og:title", content: "Minha conta | TATUAME" }, { property: "og:description", content: "Suas compras e números da sorte." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
});

function Conta() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const settings = useQuery({ queryKey: ["settings"], queryFn: loadSettings });
  const orders = useQuery({
    queryKey: ["my-orders", user?.id],
    queryFn: async () => (await db.from("orders").select("*, campaigns(title), lucky_numbers(number)").eq("user_id", user!.id).order("created_at", { ascending: false })).data ?? [],
  });
  useEffect(() => {
    const ch = supabase.channel("my-orders").on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `user_id=eq.${user!.id}` }, () => orders.refetch()).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user?.id]);
  const wpp = settings.data?.whatsapp?.replace(/\D/g, "");
  const signOut = async () => { await supabase.auth.signOut(); navigate({ to: "/", replace: true }); };

  return (
    <div className="min-h-screen"><Navbar />
      <main className="mx-auto max-w-4xl space-y-8 px-4 py-12">
        <div className="flex items-center justify-between"><h1 className="text-4xl">Minha conta</h1><Button variant="outline" onClick={signOut}>Sair</Button></div>
        <div className="space-y-4">
          {orders.data?.length ? orders.data.map((o: any) => (
            <div key={o.id} className="space-y-3 rounded-2xl border bg-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-xl">{o.campaigns?.title}</h2>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${o.status === "pago" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{o.status === "pago" ? "Pago" : o.status === "cancelado" ? "Cancelado" : "Aguardando pagamento"}</span>
              </div>
              <p className="text-sm text-muted-foreground">{o.quantity} cota(s) · {BRL(o.total)}</p>
              {o.status === "pendente" && wpp && (
                <Button asChild size="sm"><a target="_blank" rel="noreferrer" href={`https://wa.me/${wpp}?text=${encodeURIComponent(`Olá! Quero pagar meu pedido ${o.id.slice(0, 8)} (${o.quantity} cotas, ${BRL(o.total)}).`)}`}>Pagar pelo WhatsApp</a></Button>
              )}
              {!!o.lucky_numbers?.length && (
                <div className="flex flex-wrap gap-2">{o.lucky_numbers.map((n: any) => <span key={n.number} className="rounded-md border bg-background px-2 py-1 font-mono text-sm">{String(n.number).padStart(4, "0")}</span>)}</div>
              )}
            </div>
          )) : <p className="text-muted-foreground">Você ainda não tem compras.</p>}
        </div>
      </main>
    </div>
  );
}
