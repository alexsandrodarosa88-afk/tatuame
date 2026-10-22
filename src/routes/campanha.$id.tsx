import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Minus, Plus, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar, Footer } from "@/components/site/Navbar";
import { db, BRL, withPublicPercent } from "@/lib/db";
import { useAuth } from "@/hooks/use-auth";
import { useServerFn } from "@tanstack/react-start";
import { startMercadoPagoCheckout } from "@/lib/mercadopago.functions";
import { useSite } from "@/lib/site-content";

export const Route = createFileRoute("/campanha/$id")({ staticData: { sitemap: false },
  component: Page,
  head: () => ({ meta: [
    { title: "Sorteio | TATUAME" }, { name: "description", content: "Detalhes do sorteio TATUAME e compra de cotas." },
    { property: "og:title", content: "Sorteio | TATUAME" }, { property: "og:description", content: "Participe deste sorteio TATUAME." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
});

function Page() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const { t } = useSite();
  const navigate = useNavigate();
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);
  const checkout = useServerFn(startMercadoPagoCheckout);
  const q = useQuery({ queryKey: ["campaign", id], queryFn: async () => {
    const d = (await db.from("campaigns").select("*").eq("id", id).maybeSingle()).data as any;
    if (!d) return null;
    const { data: all } = await db.from("campaigns").select("id").order("created_at", { ascending: true });
    const serial = ((all ?? []) as any[]).findIndex((x) => x.id === id) + 1;
    return { ...(await withPublicPercent(d)), serial };
  }, refetchInterval: 15000 });
  const c = q.data;
  if (q.isLoading) return <div className="min-h-screen"><Navbar /><p className="p-10 text-center text-muted-foreground">Carregando...</p></div>;
  if (!c) return <div className="min-h-screen"><Navbar /><p className="p-10 text-center">Sorteio não encontrado. <Link to="/" className="text-primary">Voltar</Link></p></div>;

  const buy = async () => {
    if (!user) return navigate({ to: "/login", search: { next: `/campanha/${id}` } });
    setBusy(true);
    try {
      const { data: orderId, error } = await db.rpc("create_order", { _campaign_id: id, _quantity: qty });
      if (error) throw error;
      const result = await checkout({ data: { orderId } });
      if ("error" in result) throw new Error(result.error);
      window.location.assign(result.url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível abrir o pagamento. Seu pedido pode ser retomado em Minha conta.");
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen"><Navbar />
      <main className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-2">
        <div className="aspect-[4/3] overflow-hidden rounded-3xl bg-muted">{c.image_url && <img src={c.image_url} alt={c.title} className="h-full w-full object-cover" />}</div>
        <div className="space-y-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Sorteio Nº {String(c.serial).padStart(3, "0")}</p>
          <h1 className="text-4xl">{c.title}</h1>
          {c.prize && <p className="text-lg"><strong>Prêmio:</strong> {c.prize}</p>}
          {c.description && <p className="whitespace-pre-line text-muted-foreground">{c.description}</p>}
          <div className="space-y-2"><div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary" style={{ width: `${c.public_percent ?? 0}%` }} /></div><p className="text-sm text-muted-foreground">{c.public_percent ?? 0}% vendido</p></div>
          {c.status === "ativa" ? (
            <div className="space-y-4 rounded-2xl border bg-card p-6">
              <div className="flex items-center justify-between">
                <span>Quantidade de cotas</span>
                <div className="flex items-center gap-3">
                  <Button size="icon" variant="outline" onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Menos"><Minus className="h-4 w-4" /></Button>
                  <span className="w-8 text-center font-semibold">{qty}</span>
                  <Button size="icon" variant="outline" onClick={() => setQty(Math.min(500, qty + 1))} aria-label="Mais"><Plus className="h-4 w-4" /></Button>
                </div>
              </div>
              <div className="flex items-center justify-between text-lg"><span>Total</span><strong>{BRL(Number(c.quota_price) * qty)}</strong></div>
               <Button className="w-full" size="lg" disabled={busy} onClick={buy}>{busy ? "Abrindo pagamento..." : "Comprar cotas com Mercado Pago"}</Button>
            </div>
          ) : <p className="rounded-2xl border bg-card p-6 text-muted-foreground">Este sorteio está encerrado.</p>}
          <p className="flex items-start gap-2 rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm"><Radio className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span>{t("campaign_live_notice")} <Link to="/sorteios" className="font-semibold text-primary underline-offset-4 hover:underline">Ver sorteios</Link></span></p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
