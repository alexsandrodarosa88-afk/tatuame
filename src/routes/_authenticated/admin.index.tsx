import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/admin/")({ component: AdminOverview });

function AdminOverview() {
  const [stats, setStats] = useState({ clients: 0, orders: 0, paid: 0, revenue: 0, artists: 0, campaigns: 0, pendingFees: 0 });

  useEffect(() => {
    (async () => {
      const [c, o, p, a, cm, sub] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("total_amount").eq("status", "paid"),
        supabase.from("tattoo_artists").select("id", { count: "exact", head: true }),
        supabase.from("campaigns").select("id", { count: "exact", head: true }),
        supabase.from("artist_subscriptions").select("amount").eq("status", "pending"),
      ]);
      const revenue = (p.data ?? []).reduce((s, r: any) => s + Number(r.total_amount || 0), 0);
      const pendingFees = (sub.data ?? []).reduce((s, r: any) => s + Number(r.amount || 0), 0);
      setStats({
        clients: c.count ?? 0,
        orders: o.count ?? 0,
        paid: (p.data ?? []).length,
        revenue,
        artists: a.count ?? 0,
        campaigns: cm.count ?? 0,
        pendingFees,
      });
    })();
  }, []);

  const card = (label: string, value: string | number, hint?: string) => (
    <Card><CardContent className="p-4">
      <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
    </CardContent></Card>
  );

  const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Visão geral</h1>
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {card("Clientes", stats.clients)}
        {card("Campanhas", stats.campaigns)}
        {card("Tatuadores", stats.artists)}
        {card("Pedidos totais", stats.orders, `${stats.paid} pagos`)}
        {card("Receita confirmada", brl(stats.revenue))}
        {card("Mensalidades pendentes", brl(stats.pendingFees))}
      </div>
    </div>
  );
}