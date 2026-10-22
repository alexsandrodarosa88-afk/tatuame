import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/site/Navbar";
import { db, BRL, formatLuckyNumber } from "@/lib/db";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { startMercadoPagoCheckout, refreshMercadoPagoPayment } from "@/lib/mercadopago.functions";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/conta")({ staticData: { sitemap: false },
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
  const checkout = useServerFn(startMercadoPagoCheckout);
  const refreshPayment = useServerFn(refreshMercadoPagoPayment);
  const [busy, setBusy] = useState<string | null>(null);
  const orders = useQuery({
    queryKey: ["my-orders", user?.id],
    enabled: Boolean(user),
    refetchInterval: 10000,
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await db.from("orders").select("*, campaigns(title, total_quotas), lucky_numbers(number)").eq("user_id", user.id).order("created_at", { ascending: false });
      if (error) throw error;
      const ids = [...new Set((data ?? []).map((o: any) => o.campaign_id).filter(Boolean))];
      const { data: draws } = ids.length ? await db.from("draws").select("campaign_id, winning_number").in("campaign_id", ids) : { data: [] };
      const drawMap = Object.fromEntries(((draws ?? []) as any[]).filter((d) => d.winning_number != null).map((d) => [d.campaign_id, Number(d.winning_number)]));
      return (data ?? []).map((o: any) => ({ ...o, winning: drawMap[o.campaign_id] }));
    },
  });
  useEffect(() => {
    if (!user) return;
    const ch = supabase.channel("my-orders").on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `user_id=eq.${user.id}` }, () => orders.refetch()).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user?.id]);
  const pendingIds = (orders.data ?? []).filter((o: any) => o.status === "pendente" && o.mp_preference_id).map((o: any) => o.id).join(",");
  useEffect(() => {
    if (!pendingIds) return;
    let stopped = false;
    const check = async () => {
      for (const orderId of pendingIds.split(",")) {
        if (stopped) return;
        await refreshPayment({ data: { orderId } }).catch(() => undefined);
      }
      if (!stopped) await orders.refetch();
    };
    void check();
    const interval = window.setInterval(check, 20000);
    return () => { stopped = true; window.clearInterval(interval); };
  }, [pendingIds, refreshPayment]);
  const pay = async (orderId: string) => {
    setBusy(orderId);
    try {
      const result = await checkout({ data: { orderId } });
      if ("error" in result) throw new Error(result.error);
      window.location.assign(result.url);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível abrir o pagamento"); }
    finally { setBusy(null); }
  };
  const verify = async (orderId: string) => {
    setBusy(orderId);
    try {
      const result = await refreshPayment({ data: { orderId } });
      if ("error" in result) throw new Error(result.error);
      await orders.refetch();
      toast.success("Status do pagamento atualizado");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível verificar"); }
    finally { setBusy(null); }
  };
  const signOut = async () => { await supabase.auth.signOut(); navigate({ to: "/", replace: true }); };

  return (
    <div className="min-h-screen"><Navbar />
      <main className="mx-auto max-w-4xl space-y-8 px-4 py-12">
        <div className="flex items-center justify-between"><h1 className="text-4xl">Minha conta</h1><Button variant="outline" onClick={signOut}>Sair</Button></div>
        <div className="space-y-4">
          {orders.isLoading && <p role="status">Carregando compras...</p>}
          {orders.isError && <p role="alert" className="text-destructive">Não foi possível carregar suas compras.</p>}
          {orders.data?.length ? orders.data.map((o: any) => (
            <div key={o.id} className="space-y-3 rounded-2xl border bg-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-xl">{o.campaigns?.title}</h2>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${o.status === "pago" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{o.status === "pago" ? "Pago" : o.status === "cancelado" ? "Cancelado" : "Aguardando pagamento"}</span>
              </div>
              <p className="text-sm text-muted-foreground">{o.quantity} cota(s) · {BRL(o.total)}</p>
              {o.mp_payment_id && <p className="text-xs text-muted-foreground">Mercado Pago · Pagamento {o.mp_payment_id}</p>}
              {o.status === "pendente" && <div className="flex flex-wrap gap-2">
                <Button size="sm" disabled={busy === o.id} onClick={() => pay(o.id)}>{busy === o.id ? "Processando..." : "Pagar com Mercado Pago"}</Button>
                {o.mp_preference_id && <Button size="sm" variant="outline" disabled={busy === o.id} onClick={() => verify(o.id)}>Verificar pagamento</Button>}
              </div>}
              {!!o.lucky_numbers?.length && (
                <div className="space-y-3">
                  {o.winning != null && (o.lucky_numbers.some((n: any) => n.number === o.winning)
                    ? <p className="rounded-xl border border-primary bg-primary/10 p-3 font-semibold text-primary">🏆 NÚMERO SORTEADO! Parabéns, você é o ganhador! Nossa equipe vai entrar em contato pelo WhatsApp.</p>
                    : <p className="rounded-xl border bg-muted p-3 text-sm text-muted-foreground">Sorteio finalizado. Número sorteado: <strong>{formatLuckyNumber(o.winning, o.campaigns?.total_quotas)}</strong>. Não foi desta vez — boa sorte no próximo!</p>)}
                  <div className="flex flex-wrap gap-2">{o.lucky_numbers.map((n: any) => {
                    const win = o.winning != null && n.number === o.winning;
                    return <span key={n.number} className={`rounded-md border px-2 py-1 font-mono text-sm ${win ? "border-primary bg-primary text-primary-foreground" : o.winning != null ? "bg-muted text-muted-foreground" : "bg-background"}`}>{formatLuckyNumber(n.number, o.campaigns?.total_quotas)}{o.winning != null && <span className="ml-1 font-sans text-xs">{win ? "· Número sorteado" : "· Não sorteado"}</span>}</span>;
                  })}</div>
                </div>
              )}
            </div>
          )) : !orders.isLoading && !orders.isError && <p className="text-muted-foreground">Você ainda não tem compras.</p>}
        </div>
      </main>
    </div>
  );
}
