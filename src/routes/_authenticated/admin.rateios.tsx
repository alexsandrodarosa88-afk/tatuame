import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Check, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/rateios")({ component: AdminRateios });

type Artist = { id: string; name: string };
type Payout = {
  id: string; artist_id: string; amount: number; status: "pending" | "paid" | "cancelled";
  reference_period: string; paid_at: string | null; notes: string | null;
  tattoo_artists?: { name: string };
};

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function AdminRateios() {
  const [rows, setRows] = useState<Payout[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ artist_id: "", amount: "", reference_period: new Date().toISOString().slice(0, 7) + "-01", notes: "" });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [{ data: p }, { data: a }] = await Promise.all([
      supabase.from("artist_payouts").select("*, tattoo_artists(name)").order("reference_period", { ascending: false }),
      supabase.from("tattoo_artists").select("id,name").order("name"),
    ]);
    setRows((p as any) ?? []); setArtists((a as Artist[]) ?? []); setLoading(false);
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Rateios dos tatuadores</h1>
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