import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar, Footer } from "@/components/site/Navbar";
import { db, BRL } from "@/lib/db";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/campanha/$id")({
  component: Page,
  head: () => ({ meta: [
    { title: "Campanha | TATUAME" }, { name: "description", content: "Detalhes da campanha TATUAME e compra de cotas." },
    { property: "og:title", content: "Campanha | TATUAME" }, { property: "og:description", content: "Participe desta campanha TATUAME." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
});

function Page() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);
  const q = useQuery({ queryKey: ["campaign", id], queryFn: async () => (await db.from("campaigns").select("*").eq("id", id).maybeSingle()).data });
  const c = q.data;
  if (q.isLoading) return <div className="min-h-screen"><Navbar /><p className="p-10 text-center text-muted-foreground">Carregando...</p></div>;
  if (!c) return <div className="min-h-screen"><Navbar /><p className="p-10 text-center">Campanha não encontrada. <Link to="/" className="text-primary">Voltar</Link></p></div>;

  const buy = async () => {
    if (!user) return navigate({ to: "/login", search: { next: `/campanha/${id}` } });
    setBusy(true);
    const { error } = await db.rpc("create_order", { _campaign_id: id, _quantity: qty });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Pedido criado! Veja como pagar na sua conta.");
    navigate({ to: "/conta" });
  };

  return (
    <div className="min-h-screen"><Navbar />
      <main className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-2">
        <div className="aspect-[4/3] overflow-hidden rounded-3xl bg-muted">{c.image_url && <img src={c.image_url} alt={c.title} className="h-full w-full object-cover" />}</div>
        <div className="space-y-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">{c.kind === "premium" ? "Campanha Premium" : "Campanha Simples"}</p>
          <h1 className="text-4xl">{c.title}</h1>
          {c.prize && <p className="text-lg"><strong>Prêmio:</strong> {c.prize}</p>}
          {c.description && <p className="whitespace-pre-line text-muted-foreground">{c.description}</p>}
          <div className="space-y-2"><div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary" style={{ width: `${c.display_percent ?? 0}%` }} /></div><p className="text-sm text-muted-foreground">{c.display_percent ?? 0}% vendido</p></div>
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
              <Button className="w-full" size="lg" disabled={busy} onClick={buy}>{busy ? "Processando..." : "Comprar cotas"}</Button>
            </div>
          ) : <p className="rounded-2xl border bg-card p-6 text-muted-foreground">Esta campanha está encerrada.</p>}
        </div>
      </main>
      <Footer />
    </div>
  );
}
