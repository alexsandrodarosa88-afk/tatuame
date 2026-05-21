import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Check, Loader2, TrendingUp, Users, Percent, Wallet } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/rateios")({ component: AdminRateios });

type Artist = { id: string; name: string };
type Payout = {
  id: string; artist_id: string; amount: number; status: "pending" | "paid" | "cancelled";
  reference_period: string; paid_at: string | null; notes: string | null;
  tattoo_artists?: { name: string };
};
type CampaignRow = {
  id: string; title: string | null; status: string;
  tattoo_value: number; price_per_quota: number; sold_quotas: number; total_quotas: number;
};
type CampaignBreakdown = CampaignRow & {
  raised: number;
  profit: number;
  systemFee: number;
  distributable: number;
  perArtist: number;
};

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const SYSTEM_FEE_PCT = 0.25;

function AdminRateios() {
  const [rows, setRows] = useState<Payout[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [breakdowns, setBreakdowns] = useState<CampaignBreakdown[]>([]);
  const [artistCount, setArtistCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ artist_id: "", amount: "", reference_period: new Date().toISOString().slice(0, 7) + "-01", notes: "" });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [{ data: p }, { data: a }, { data: camps }, { data: items }] = await Promise.all([
      supabase.from("artist_payouts").select("*, tattoo_artists(name)").order("reference_period", { ascending: false }),
      supabase.from("tattoo_artists").select("id,name").order("name"),
      supabase.from("campaigns").select("id,title,status,tattoo_value,price_per_quota,sold_quotas,total_quotas").order("created_at", { ascending: false }),
      supabase.from("order_items").select("campaign_id, quantity, unit_price, orders!inner(status)").eq("orders.status", "paid"),
    ]);
    setRows((p as any) ?? []);
    setArtists((a as Artist[]) ?? []);
    const aCount = (a as Artist[] | null)?.length ?? 0;
    setArtistCount(aCount);

    const raisedMap = new Map<string, number>();
    for (const it of ((items as any[]) ?? [])) {
      const cur = raisedMap.get(it.campaign_id) ?? 0;
      raisedMap.set(it.campaign_id, cur + Number(it.quantity) * Number(it.unit_price));
    }
    const bds: CampaignBreakdown[] = ((camps as CampaignRow[]) ?? []).map((c) => {
      const raised = raisedMap.get(c.id) ?? 0;
      const profit = Math.max(0, raised - Number(c.tattoo_value));
      const systemFee = profit * SYSTEM_FEE_PCT;
      const distributable = profit - systemFee;
      const perArtist = aCount > 0 ? distributable / aCount : 0;
      return { ...c, raised, profit, systemFee, distributable, perArtist };
    });
    setBreakdowns(bds);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    const amount = parseFloat(form.amount.replace(",", "."));
    if (!form.artist_id || isNaN(amount) || amount <= 0) { toast.error("Preencha tatuador e valor."); return; }
    const { error } = await supabase.from("artist_payouts").insert({
      artist_id: form.artist_id, amount, reference_period: form.reference_period,
      notes: form.notes || null,
    } as any);
    if (error) { toast.error(error.message); return; }
    toast.success("Rateio lançado."); setOpen(false);
    setForm({ artist_id: "", amount: "", reference_period: new Date().toISOString().slice(0, 7) + "-01", notes: "" });
    load();
  };

  const markPaid = async (id: string) => {
    const { error } = await supabase.from("artist_payouts").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Marcado como pago."); load();
  };

  const lancarParaTodos = async (b: CampaignBreakdown) => {
    if (artists.length === 0) { toast.error("Nenhum tatuador cadastrado."); return; }
    if (b.perArtist <= 0) { toast.error("Sem valor a ratear nessa campanha."); return; }
    if (!confirm(`Lançar ${brl(b.perArtist)} para cada um dos ${artists.length} tatuadores referente a "${b.title}"?`)) return;
    const period = new Date().toISOString().slice(0, 7) + "-01";
    const payouts = artists.map((a) => ({
      artist_id: a.id,
      amount: Number(b.perArtist.toFixed(2)),
      reference_period: period,
      notes: `Rateio campanha: ${b.title}`,
    }));
    const { error } = await supabase.from("artist_payouts").insert(payouts as any);
    if (error) { toast.error(error.message); return; }
    toast.success("Rateios lançados para todos os tatuadores."); load();
  };

  const totals = breakdowns.reduce(
    (acc, b) => ({
      raised: acc.raised + b.raised,
      profit: acc.profit + b.profit,
      systemFee: acc.systemFee + b.systemFee,
      distributable: acc.distributable + b.distributable,
    }),
    { raised: 0, profit: 0, systemFee: 0, distributable: 0 },
  );

  const statCard = (label: string, value: string, hint: string, Icon: typeof TrendingUp, color = "text-foreground") => (
    <Card><CardContent className="p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <p className={`text-2xl font-bold mt-2 ${color}`}>{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{hint}</p>
    </CardContent></Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Dashboard de Rateios</h1>
          <p className="text-sm text-muted-foreground">Arrecadação por campanha, taxa do sistema (25%) e divisão entre {artistCount} tatuador{artistCount === 1 ? "" : "es"} cadastrado{artistCount === 1 ? "" : "s"}.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> Novo rateio</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Lançar rateio</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Tatuador *</Label>
                <select className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                  value={form.artist_id} onChange={(e) => setForm({ ...form, artist_id: e.target.value })}>
                  <option value="">Selecione...</option>
                  {artists.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div><Label>Valor (R$) *</Label><Input value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0,00" /></div>
              <div><Label>Mês de referência *</Label><Input type="date" value={form.reference_period} onChange={(e) => setForm({ ...form, reference_period: e.target.value })} /></div>
              <div><Label>Observação</Label><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
              <Button className="w-full" onClick={create}>Lançar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? null : (
        <>
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
            {statCard("Arrecadado total", brl(totals.raised), `${breakdowns.length} campanhas`, TrendingUp, "text-primary")}
            {statCard("Lucro bruto", brl(totals.profit), "Arrecadado − tatuagem", Wallet)}
            {statCard("Taxa do sistema", brl(totals.systemFee), "25% do lucro", Percent, "text-amber-500")}
            {statCard("A ratear", brl(totals.distributable), `${brl(artistCount > 0 ? totals.distributable / artistCount : 0)} por tatuador`, Users, "text-green-500")}
          </div>

          <Card><CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="text-left p-3">Campanha</th>
                  <th className="text-right p-3">Arrecadado</th>
                  <th className="text-right p-3">Tatuagem</th>
                  <th className="text-right p-3">Lucro</th>
                  <th className="text-right p-3">Taxa 25%</th>
                  <th className="text-right p-3">A ratear</th>
                  <th className="text-right p-3">Por tatuador</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {breakdowns.map((b) => (
                  <tr key={b.id} className="border-t border-border">
                    <td className="p-3">
                      <p className="font-medium">{b.title ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">{b.sold_quotas}/{b.total_quotas} cotas · {b.status}</p>
                    </td>
                    <td className="p-3 text-right font-semibold text-primary">{brl(b.raised)}</td>
                    <td className="p-3 text-right">{brl(Number(b.tattoo_value))}</td>
                    <td className="p-3 text-right">{brl(b.profit)}</td>
                    <td className="p-3 text-right text-amber-500">{brl(b.systemFee)}</td>
                    <td className="p-3 text-right text-green-500 font-semibold">{brl(b.distributable)}</td>
                    <td className="p-3 text-right font-semibold">{brl(b.perArtist)}</td>
                    <td className="p-3 text-right">
                      <Button size="sm" variant="outline" disabled={b.perArtist <= 0 || artistCount === 0}
                        onClick={() => lancarParaTodos(b)}>
                        Lançar p/ todos
                      </Button>
                    </td>
                  </tr>
                ))}
                {breakdowns.length === 0 && (
                  <tr><td colSpan={8} className="p-6 text-center text-muted-foreground">Nenhuma campanha cadastrada.</td></tr>
                )}
              </tbody>
            </table>
          </CardContent></Card>
        </>
      )}

      <h2 className="text-lg font-semibold pt-2">Rateios lançados</h2>
      {loading ? (
        <div className="grid place-items-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : rows.length === 0 ? (
        <Card><CardContent className="p-6 text-center text-muted-foreground text-sm">Nenhum rateio lançado.</CardContent></Card>
      ) : (
        <Card><CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="text-left p-3">Tatuador</th>
                <th className="text-left p-3">Período</th>
                <th className="text-left p-3">Valor</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Obs.</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} className="border-t border-border">
                  <td className="p-3 font-medium">{r.tattoo_artists?.name ?? "—"}</td>
                  <td className="p-3">{new Date(r.reference_period).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</td>
                  <td className="p-3 font-semibold">{brl(Number(r.amount))}</td>
                  <td className="p-3">
                    {r.status === "paid" && <span className="text-green-500">Pago</span>}
                    {r.status === "pending" && <span className="text-amber-500">Pendente</span>}
                    {r.status === "cancelled" && <span className="text-muted-foreground">Cancelado</span>}
                  </td>
                  <td className="p-3 text-muted-foreground">{r.notes ?? "—"}</td>
                  <td className="p-3 text-right">
                    {r.status === "pending" && (
                      <Button size="sm" variant="outline" onClick={() => markPaid(r.id)}>
                        <Check className="h-3.5 w-3.5 mr-1" /> Marcar como pago
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent></Card>
      )}
    </div>
  );
}