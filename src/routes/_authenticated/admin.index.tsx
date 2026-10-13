import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { db, BRL } from "@/lib/db";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: Overview,
  head: () => ({ meta: [
    { title: "Admin | TATUAME" }, { name: "description", content: "Painel administrativo TATUAME." },
    { property: "og:title", content: "Admin | TATUAME" }, { property: "og:description", content: "Painel administrativo TATUAME." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
});

function Overview() {
  const q = useQuery({
    queryKey: ["admin-overview"],
    queryFn: async () => {
      const [c, o, p, a] = await Promise.all([
        db.from("campaigns").select("id", { count: "exact", head: true }).eq("status", "ativa"),
        db.from("orders").select("total,status"),
        db.from("profiles").select("id", { count: "exact", head: true }),
        db.from("artist_applications").select("id", { count: "exact", head: true }).eq("status", "pendente"),
      ]);
      const paid = (o.data ?? []).filter((x: any) => x.status === "pago");
      return { active: c.count ?? 0, revenue: paid.reduce((s: number, x: any) => s + Number(x.total), 0), pending: (o.data ?? []).filter((x: any) => x.status === "pendente").length, clients: p.count ?? 0, apps: a.count ?? 0 };
    },
  });
  const d = q.data;
  const cards = [
    { l: "Campanhas ativas", v: d?.active, to: "/admin/campanhas" },
    { l: "Faturado (pago)", v: d && BRL(d.revenue), to: "/admin/vendas" },
    { l: "Pedidos aguardando", v: d?.pending, to: "/admin/vendas" },
    { l: "Clientes", v: d?.clients, to: "/admin/clientes" },
    { l: "Artistas para analisar", v: d?.apps, to: "/admin/artistas" },
  ];
  return (
    <div className="space-y-6">
      <h1 className="text-3xl">Visão geral</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => <Link key={c.l} to={c.to as any} className="rounded-2xl border bg-card p-5 hover:shadow-soft"><p className="text-sm text-muted-foreground">{c.l}</p><p className="mt-2 text-3xl font-semibold">{c.v ?? "—"}</p></Link>)}
      </div>
    </div>
  );
}
