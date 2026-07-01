import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useRealtimeCallback } from "@/hooks/use-realtime-invalidate";

export const Route = createFileRoute("/_authenticated/admin/campanhas")({ component: AdminCampanhas });

type Campaign = {
  id: string; code: string; title: string | null; description: string | null; status: string;
  tattoo_value: number; price_per_quota: number; total_quotas: number; sold_quotas: number; ends_at: string;
  campaign_type: "premium" | "simple";
};

type CampaignSale = {
  orderId: string;
  quantity: number;
  total: number;
  paidAt: string | null;
  customer: string;
};

const brl = (n: number) => Number(n).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const empty = { title: "", description: "", tattoo_value: 0, price_per_quota: 0, total_quotas: 999, ends_at: "", status: "active", campaign_type: "premium" as "premium" | "simple" };

function AdminCampanhas() {
  const [rows, setRows] = useState<Campaign[]>([]);
  const [salesByCampaign, setSalesByCampaign] = useState<Record<string, CampaignSale[]>>({});
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Campaign | null>(null);
  const [form, setForm] = useState<any>(empty);
  const [tab, setTab] = useState<"premium" | "simple">("premium");

  const load = async () => {
    const { data } = await supabase.from("campaigns").select("*").order("created_at", { ascending: false });
    if (data) setRows(data as Campaign[]);

    const { data: paidOrders } = await supabase
      .from("orders")
      .select("id,user_id,total_amount,paid_at,status")
      .eq("status", "paid")
      .order("paid_at", { ascending: false })
      .limit(500);
    const orderIds = (paidOrders ?? []).map((o) => o.id);
    if (orderIds.length === 0) {
      setSalesByCampaign({});
      return;
    }

    const [{ data: items }, { data: profiles }] = await Promise.all([
      supabase.from("order_items").select("order_id,campaign_id,quantity,unit_price").in("order_id", orderIds),
      supabase.from("profiles").select("id,nome_completo,email").in("id", (paidOrders ?? []).map((o) => o.user_id)),
    ]);
    const ordersMap = new Map((paidOrders ?? []).map((o) => [o.id, o]));
    const profilesMap = new Map((profiles ?? []).map((p) => [p.id, p]));
    const grouped: Record<string, CampaignSale[]> = {};
    for (const item of items ?? []) {
      const order = ordersMap.get(item.order_id);
      if (!order) continue;
      const profile = profilesMap.get(order.user_id);
      const sale: CampaignSale = {
        orderId: item.order_id,
        quantity: item.quantity,
        total: Number(item.unit_price) * item.quantity,
        paidAt: order.paid_at,
        customer: profile?.nome_completo || profile?.email || order.user_id.slice(0, 8),
      };
      grouped[item.campaign_id] = [...(grouped[item.campaign_id] ?? []), sale].slice(0, 5);
    }
    setSalesByCampaign(grouped);
  };
  useEffect(() => { load(); }, []);
  useRealtimeCallback("campaigns", () => { load(); });
  useRealtimeCallback("orders", () => { load(); });

  const openNew = (type: "premium" | "simple" = tab) => {
    setEditing(null);
    setForm({ ...empty, campaign_type: type });
    setOpen(true);
  };
  const openEdit = (c: Campaign) => {
    setEditing(c);
    setForm({
      title: c.title ?? "", description: c.description ?? "", tattoo_value: c.tattoo_value,
      price_per_quota: c.price_per_quota, total_quotas: c.total_quotas,
      ends_at: c.ends_at ? c.ends_at.slice(0, 16) : "", status: c.status,
      campaign_type: c.campaign_type ?? "premium",
    });
    setOpen(true);
  };

  const save = async () => {
    const payload = {
      title: form.title, description: form.description,
      tattoo_value: Number(form.tattoo_value), price_per_quota: Number(form.price_per_quota),
      total_quotas: Number(form.total_quotas),
      ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : undefined,
      status: form.status,
      campaign_type: form.campaign_type,
    };
    if (!payload.title || !payload.ends_at) { toast.error("Preencha título e data de encerramento."); return; }
    const { error } = editing
      ? await supabase.from("campaigns").update(payload).eq("id", editing.id)
      : await supabase.from("campaigns").insert(payload as any);
    if (error) { toast.error("Erro ao salvar campanha: " + error.message); return; }
    toast.success(editing ? "Campanha atualizada." : "Campanha criada.");
    setOpen(false); load();
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir esta campanha?")) return;
    const { error } = await supabase.from("campaigns").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir."); return; }
    toast.success("Campanha excluída."); load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Campanhas ({rows.length})</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button onClick={() => openNew(tab)}><Plus className="h-4 w-4 mr-1" /> Novo sorteio {tab === "premium" ? "Premium" : "Simples"}</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editing ? "Editar campanha" : "Nova campanha"}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Tipo de sorteio</Label>
                <select
                  value={form.campaign_type}
                  onChange={(e) => setForm({ ...form, campaign_type: e.target.value })}
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                >
                  <option value="premium">Premium — reverte em crédito (cliente não perde o valor)</option>
                  <option value="simple">Simples — sem crédito de volta</option>
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  {form.campaign_type === "premium"
                    ? "Se o cliente não ganhar, o valor pago vira crédito para fazer uma tatuagem."
                    : "Sorteio tradicional: quem não ganhar não recebe crédito."}
                </p>
              </div>
              <div><Label>Título</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div><Label>Descrição</Label><Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Valor da tatuagem (R$)</Label><Input type="number" step="0.01" value={form.tattoo_value} onChange={(e) => setForm({ ...form, tattoo_value: e.target.value })} /></div>
                <div><Label>Preço por cota (R$)</Label><Input type="number" step="0.01" value={form.price_per_quota} onChange={(e) => setForm({ ...form, price_per_quota: e.target.value })} /></div>
                <div><Label>Total de cotas</Label><Input type="number" min={1} max={999} value={form.total_quotas} onChange={(e) => setForm({ ...form, total_quotas: e.target.value })} /></div>
                <div>
                  <Label>Status</Label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm">
                    <option value="active">Ativa</option><option value="paused">Pausada</option><option value="completed">Concluída</option>
                  </select>
                </div>
              </div>
              <div><Label>Encerra em</Label><Input type="datetime-local" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} /></div>
              <Button onClick={save} className="w-full">{editing ? "Salvar alterações" : "Criar campanha"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="inline-flex rounded-md border border-border bg-muted/30 p-1">
        <button
          onClick={() => setTab("premium")}
          className={`px-4 py-1.5 text-sm rounded-md transition-colors ${tab === "premium" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          Premium (com crédito)
        </button>
        <button
          onClick={() => setTab("simple")}
          className={`px-4 py-1.5 text-sm rounded-md transition-colors ${tab === "simple" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          Simples (sem crédito)
        </button>
      </div>
      <div className="grid gap-3">
        {rows.filter((c) => (c.campaign_type ?? "premium") === tab).map((c) => {
          const pct = c.total_quotas ? (c.sold_quotas / c.total_quotas) * 100 : 0;
          return (
            <Card key={c.id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-mono font-semibold text-primary border border-primary/20">{c.code}</span>
                      <h3 className="font-semibold truncate">{c.title}</h3>
                      <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide border ${c.campaign_type === "simple" ? "bg-amber-500/10 text-amber-600 border-amber-500/30" : "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"}`}>
                        {c.campaign_type === "simple" ? "Simples" : "Premium"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Encerra: {c.ends_at ? new Date(c.ends_at).toLocaleString("pt-BR") : "—"} · Status: {c.status}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => remove(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div><p className="text-xs text-muted-foreground">Tatuagem</p><p className="font-medium">{brl(c.tattoo_value)}</p></div>
                  <div><p className="text-xs text-muted-foreground">Cota</p><p className="font-medium">{brl(c.price_per_quota)}</p></div>
                  <div><p className="text-xs text-muted-foreground">Vendidas</p><p className="font-medium">{c.sold_quotas} / {c.total_quotas}</p></div>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary" style={{ width: `${pct}%` }} /></div>
                {salesByCampaign[c.id]?.length > 0 && (
                  <div className="rounded-md border border-border bg-muted/30 p-3">
                    <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Últimas vendas pagas desta campanha</p>
                    <div className="space-y-1.5">
                      {salesByCampaign[c.id].map((sale) => (
                        <div key={`${sale.orderId}-${sale.quantity}`} className="flex flex-wrap items-center justify-between gap-2 text-xs">
                          <span className="font-medium">{sale.customer}</span>
                          <span className="text-muted-foreground">{sale.quantity} cota(s) · {brl(sale.total)} · {sale.paidAt ? new Date(sale.paidAt).toLocaleString("pt-BR") : "pago"}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
        {rows.length === 0 && <p className="text-muted-foreground text-center py-10">Nenhuma campanha. Crie a primeira.</p>}
      </div>
    </div>
  );
}