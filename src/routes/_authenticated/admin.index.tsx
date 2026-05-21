import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Filter } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/")({ component: AdminOverview });

type Campaign = {
  id: string; title: string | null; status: string;
  tattoo_value: number; price_per_quota: number; total_quotas: number; sold_quotas: number;
  ends_at: string; created_at: string;
};
type OrderItem = {
  id: string; campaign_id: string; quantity: number; unit_price: number;
  created_at: string;
  orders: { status: string; paid_at: string | null; created_at: string } | null;
};

const brl = (n: number) => Number(n).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const todayISO = () => new Date().toISOString().slice(0, 10);
const daysAgoISO = (d: number) => { const x = new Date(); x.setDate(x.getDate() - d); return x.toISOString().slice(0, 10); };

function AdminOverview() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [clients, setClients] = useState(0);
  const [artists, setArtists] = useState(0);
  const [loading, setLoading] = useState(true);

  // filters
  const [from, setFrom] = useState(daysAgoISO(30));
  const [to, setTo] = useState(todayISO());
  const [campaignFilter, setCampaignFilter] = useState<string>("all");

  useEffect(() => {
    (async () => {
      const [cm, oi, c, a] = await Promise.all([
        supabase.from("campaigns").select("*").order("created_at", { ascending: false }),
        supabase.from("order_items").select("id, campaign_id, quantity, unit_price, created_at, orders(status, paid_at, created_at)"),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("tattoo_artists").select("id", { count: "exact", head: true }),
      ]);
      setCampaigns((cm.data as any) ?? []);
      setItems((oi.data as any) ?? []);
      setClients(c.count ?? 0);
      setArtists(a.count ?? 0);
      setLoading(false);
    })();
  }, []);

  // Apply filter — only PAID orders count as "arrecadado"
  const fromTs = new Date(from + "T00:00:00").getTime();
  const toTs = new Date(to + "T23:59:59").getTime();

  const filteredPaidItems = useMemo(() => {
    return items.filter((it) => {
      if (it.orders?.status !== "paid") return false;
      const t = new Date(it.orders.paid_at || it.created_at).getTime();
      if (t < fromTs || t > toTs) return false;
      if (campaignFilter !== "all" && it.campaign_id !== campaignFilter) return false;
      return true;
    });
  }, [items, fromTs, toTs, campaignFilter]);

  // Per-campaign breakdown
  const breakdown = useMemo(() => {
    const map = new Map<string, { campaign: Campaign; raised: number; quotasSold: number }>();
    campaigns.forEach((c) => map.set(c.id, { campaign: c, raised: 0, quotasSold: 0 }));
    filteredPaidItems.forEach((it) => {
      const e = map.get(it.campaign_id);
      if (!e) return;
      e.raised += Number(it.unit_price) * it.quantity;
      e.quotasSold += it.quantity;
    });
    let arr = Array.from(map.values());
    if (campaignFilter !== "all") arr = arr.filter((e) => e.campaign.id === campaignFilter);
    return arr.sort((a, b) => b.raised - a.raised);
  }, [campaigns, filteredPaidItems, campaignFilter]);

  const totalRaised = breakdown.reduce((s, e) => s + e.raised, 0);
  const totalQuotasSold = breakdown.reduce((s, e) => s + e.quotasSold, 0);
  const activeCampaigns = campaigns.filter((c) => c.status === "active").length;

  const card = (label: string, value: string | number, hint?: string) => (
    <Card><CardContent className="p-4">
      <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
    </CardContent></Card>
  );

  if (loading) return <div className="grid place-items-center py-20"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Visão geral</h1>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 flex flex-wrap items-end gap-3">
          <Filter className="h-4 w-4 text-muted-foreground mb-2" />
          <div>
            <Label className="text-xs">De</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-9" />
          </div>
          <div>
            <Label className="text-xs">Até</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-9" />
          </div>
          <div className="min-w-[200px]">
            <Label className="text-xs">Campanha</Label>
            <select
              value={campaignFilter}
              onChange={(e) => setCampaignFilter(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            >
              <option value="all">Todas as campanhas</option>
              {campaigns.map((c) => <option key={c.id} value={c.id}>{c.title ?? c.id.slice(0, 8)}</option>)}
            </select>
          </div>
          <div className="flex gap-1">
            <Button size="sm" variant="outline" onClick={() => { setFrom(daysAgoISO(7)); setTo(todayISO()); }}>7d</Button>
            <Button size="sm" variant="outline" onClick={() => { setFrom(daysAgoISO(30)); setTo(todayISO()); }}>30d</Button>
            <Button size="sm" variant="outline" onClick={() => { setFrom(daysAgoISO(90)); setTo(todayISO()); }}>90d</Button>
            <Button size="sm" variant="outline" onClick={() => { setFrom("2020-01-01"); setTo(todayISO()); }}>Tudo</Button>
          </div>
        </CardContent>
      </Card>

      {/* Top KPIs */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {card("Arrecadado no período", brl(totalRaised))}
        {card("Cotas vendidas (período)", totalQuotasSold)}
        {card("Campanhas ativas", activeCampaigns, `${campaigns.length} no total`)}
        {card("Clientes / Tatuadores", `${clients} / ${artists}`)}
      </div>

      {/* Per-campaign breakdown */}
      <div>
        <h2 className="text-lg font-semibold mb-2">Desempenho por campanha</h2>
        {breakdown.length === 0 ? (
          <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">Sem campanhas para exibir.</CardContent></Card>
        ) : (
          <Card><CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="text-left p-3">Campanha</th>
                    <th className="text-left p-3">Status</th>
                    <th className="text-right p-3">Arrecadado</th>
                    <th className="text-right p-3">Cotas vendidas</th>
                    <th className="text-right p-3">Restantes</th>
                    <th className="text-left p-3 min-w-[140px]">Progresso</th>
                    <th className="text-left p-3">Encerra</th>
                  </tr>
                </thead>
                <tbody>
                  {breakdown.map((b) => {
                    const restantes = b.campaign.total_quotas - b.campaign.sold_quotas;
                    const pct = b.campaign.total_quotas ? (b.campaign.sold_quotas / b.campaign.total_quotas) * 100 : 0;
                    return (
                      <tr key={b.campaign.id} className="border-t border-border">
                        <td className="p-3 font-medium">{b.campaign.title ?? "—"}</td>
                        <td className="p-3">
                          {b.campaign.status === "active" && <span className="text-green-500 text-xs font-medium">Ativa</span>}
                          {b.campaign.status === "paused" && <span className="text-amber-500 text-xs font-medium">Pausada</span>}
                          {b.campaign.status === "completed" && <span className="text-muted-foreground text-xs font-medium">Concluída</span>}
                        </td>
                        <td className="p-3 text-right font-semibold">{brl(b.raised)}</td>
                        <td className="p-3 text-right">{b.quotasSold} <span className="text-xs text-muted-foreground">/ {b.campaign.total_quotas} total</span></td>
                        <td className="p-3 text-right">{restantes}</td>
                        <td className="p-3">
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary" style={{ width: `${Math.min(100, pct)}%` }} />
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{pct.toFixed(1)}%</p>
                        </td>
                        <td className="p-3 text-xs">{b.campaign.ends_at ? new Date(b.campaign.ends_at).toLocaleDateString("pt-BR") : "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-border bg-muted/30 font-semibold">
                    <td className="p-3" colSpan={2}>Total</td>
                    <td className="p-3 text-right">{brl(totalRaised)}</td>
                    <td className="p-3 text-right">{totalQuotasSold}</td>
                    <td className="p-3" colSpan={3}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent></Card>
        )}
      </div>
    </div>
  );
}
