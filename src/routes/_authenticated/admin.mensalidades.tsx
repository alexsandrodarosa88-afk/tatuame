import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Check, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/mensalidades")({ component: AdminMensalidades });

type Sub = {
  id: string; artist_id: string; reference_month: string; amount: number;
  status: string; paid_at: string | null; notes: string | null;
  tattoo_artists?: { name: string } | null;
};
type Artist = { id: string; name: string };

const brl = (n: number) => Number(n).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function AdminMensalidades() {
  const [rows, setRows] = useState<Sub[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ artist_id: "", reference_month: "", amount: 0, notes: "" });

  const load = async () => {
    const { data } = await supabase
      .from("artist_subscriptions")
      .select("*,tattoo_artists(name)")
      .order("reference_month", { ascending: false });
    if (data) setRows(data as any);
  };
  useEffect(() => {
    load();
    supabase.from("tattoo_artists").select("id,name").order("name").then(({ data }) => data && setArtists(data));
  }, []);

  const create = async () => {
    if (!form.artist_id || !form.reference_month || !form.amount) { toast.error("Preencha todos os campos."); return; }
    const { error } = await supabase.from("artist_subscriptions").insert({
      artist_id: form.artist_id,
      reference_month: form.reference_month + "-01",
      amount: Number(form.amount),
      notes: form.notes || null,
    } as any);
    if (error) { toast.error(error.message.includes("duplicate") ? "Já existe mensalidade neste mês para este tatuador." : "Erro ao criar."); return; }
    toast.success("Mensalidade criada.");
    setOpen(false); setForm({ artist_id: "", reference_month: "", amount: 0, notes: "" }); load();
  };

  const markPaid = async (s: Sub) => {
    await supabase.from("artist_subscriptions").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", s.id);
    toast.success("Marcada como paga."); load();
  };
  const remove = async (id: string) => {
    if (!confirm("Excluir?")) return;
    await supabase.from("artist_subscriptions").delete().eq("id", id);
    load();
  };

  const totalPending = rows.filter((r) => r.status === "pending").reduce((s, r) => s + Number(r.amount), 0);
  const totalPaid = rows.filter((r) => r.status === "paid").reduce((s, r) => s + Number(r.amount), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Mensalidades</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> Nova mensalidade</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova mensalidade</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Tatuador</Label>
                <select value={form.artist_id} onChange={(e) => setForm({ ...form, artist_id: e.target.value })} className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm">
                  <option value="">Selecione...</option>
                  {artists.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div><Label>Mês de referência</Label><Input type="month" value={form.reference_month} onChange={(e) => setForm({ ...form, reference_month: e.target.value })} /></div>
              <div><Label>Valor (R$)</Label><Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} /></div>
              <div><Label>Observações</Label><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
              <Button onClick={create} className="w-full">Criar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3 grid-cols-2">
        <div className="rounded-lg border border-border p-4"><p className="text-xs text-muted-foreground uppercase">Pendentes</p><p className="text-xl font-bold">{brl(totalPending)}</p></div>
        <div className="rounded-lg border border-border p-4"><p className="text-xs text-muted-foreground uppercase">Recebido</p><p className="text-xl font-bold">{brl(totalPaid)}</p></div>
      </div>

      <div className="rounded-lg border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase">
            <tr>
              <th className="text-left p-3">Tatuador</th>
              <th className="text-left p-3">Mês</th>
              <th className="text-left p-3">Valor</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Pago em</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className="p-3">{r.tattoo_artists?.name ?? "—"}</td>
                <td className="p-3">{new Date(r.reference_month).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</td>
                <td className="p-3 font-medium">{brl(r.amount)}</td>
                <td className="p-3"><Badge variant={r.status === "paid" ? "default" : "secondary"}>{r.status}</Badge></td>
                <td className="p-3 text-muted-foreground">{r.paid_at ? new Date(r.paid_at).toLocaleDateString("pt-BR") : "—"}</td>
                <td className="p-3 text-right whitespace-nowrap">
                  {r.status !== "paid" && <Button size="icon" variant="ghost" onClick={() => markPaid(r)} title="Marcar como paga"><Check className="h-4 w-4 text-primary" /></Button>}
                  <Button size="icon" variant="ghost" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Nenhuma mensalidade.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}