import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { useRealtimeCallback } from "@/hooks/use-realtime-invalidate";

export const Route = createFileRoute("/_authenticated/admin/vendas")({ component: AdminVendas });

type Row = {
  id: string; user_id: string; status: string; total_amount: number; created_at: string; paid_at: string | null;
  profile: { nome_completo: string | null; email: string | null; telefone: string | null; cpf: string | null; cidade: string | null } | null;
  items: { campaign_id: string; quantity: number; unit_price: number; campaign_title: string | null; campaign_code: string | null }[];
  numbers: { campaign_id: string; lucky_number: number }[];
  total_quotas: number;
};

const brl = (n: number) => Number(n).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function AdminVendas() {
  const [rows, setRows] = useState<Row[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const load = async () => {
    const { data: orders } = await supabase
      .from("orders")
      .select("id,user_id,status,total_amount,created_at,paid_at")
      .order("created_at", { ascending: false })
      .limit(500);
    if (!orders || orders.length === 0) { setRows([]); return; }
    const orderIds = orders.map((o) => o.id);
    const userIds = Array.from(new Set(orders.map((o) => o.user_id)));

    const [{ data: items }, { data: profiles }, { data: parts }] = await Promise.all([
      supabase.from("order_items").select("order_id,campaign_id,quantity,unit_price").in("order_id", orderIds),
      supabase.from("profiles").select("id,nome_completo,email,telefone,cpf,cidade").in("id", userIds),
      supabase.from("participations").select("order_id,campaign_id,lucky_number").in("order_id", orderIds),
    ]);

    const campIds = Array.from(new Set((items ?? []).map((i: any) => i.campaign_id)));
    const { data: camps } = campIds.length
      ? await supabase.from("campaigns").select("id,title,code").in("id", campIds)
      : { data: [] as any[] };

    const profMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));
    const campMap = new Map((camps ?? []).map((c: any) => [c.id, c]));
    const itemsByOrder = new Map<string, any[]>();
    (items ?? []).forEach((i: any) => {
      const c = campMap.get(i.campaign_id);
      const arr = itemsByOrder.get(i.order_id) ?? [];
      arr.push({ campaign_id: i.campaign_id, quantity: i.quantity, unit_price: Number(i.unit_price), campaign_title: c?.title ?? null, campaign_code: c?.code ?? null });
      itemsByOrder.set(i.order_id, arr);
    });
    const numsByOrder = new Map<string, any[]>();
    (parts ?? []).forEach((p: any) => {
      const arr = numsByOrder.get(p.order_id) ?? [];
      arr.push({ campaign_id: p.campaign_id, lucky_number: p.lucky_number });
      numsByOrder.set(p.order_id, arr);
    });

    const built: Row[] = orders.map((o: any) => {
      const its = itemsByOrder.get(o.id) ?? [];
      return {
        id: o.id,
        user_id: o.user_id,
        status: o.status,
        total_amount: Number(o.total_amount),
        created_at: o.created_at,
        paid_at: o.paid_at,
        profile: (profMap.get(o.user_id) as any) ?? null,
        items: its,
        numbers: (numsByOrder.get(o.id) ?? []).sort((a, b) => a.lucky_number - b.lucky_number),
        total_quotas: its.reduce((s, i) => s + Number(i.quantity || 0), 0),
      };
    });
    setRows(built);
  };
  useEffect(() => { load(); }, []);
  useRealtimeCallback("orders", () => { load(); });
  useRealtimeCallback("order_items", () => { load(); });
  useRealtimeCallback("participations", () => { load(); });

  const ql = q.trim().toLowerCase();
  const filtered = rows.filter((r) => {
    if (filter !== "all" && r.status !== filter) return false;
    if (!ql) return true;
    return (
      (r.profile?.nome_completo ?? "").toLowerCase().includes(ql) ||
      (r.profile?.email ?? "").toLowerCase().includes(ql) ||
      (r.profile?.cpf ?? "").includes(ql) ||
      r.items.some((i) => (i.campaign_title ?? "").toLowerCase().includes(ql) || (i.campaign_code ?? "").toLowerCase().includes(ql))
    );
  });

  const totals = {
    count: filtered.length,
    paid: filtered.filter((r) => r.status === "paid").reduce((s, r) => s + r.total_amount, 0),
    quotas: filtered.filter((r) => r.status === "paid").reduce((s, r) => s + r.total_quotas, 0),
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Vendas ({rows.length})</h1>
          <p className="text-xs text-muted-foreground mt-1">
            {totals.count} resultados · {totals.quotas} cotas pagas · {brl(totals.paid)} arrecadados (pagos)
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar nome, email, CPF, campanha..."
            className="h-9 w-64 rounded-md border border-input bg-transparent px-3 text-sm"
          />
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="h-9 rounded-md border border-input bg-transparent px-3 text-sm">
            <option value="all">Todos status</option>
            <option value="pending">Pendente</option>
            <option value="paid">Pago</option>
            <option value="expired">Expirado</option>
            <option value="cancelled">Cancelado</option>
          </select>
        </div>
      </div>
      <div className="rounded-lg border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase">
            <tr>
              <th className="text-left p-3">Data</th>
              <th className="text-left p-3">Cliente</th>
              <th className="text-left p-3">Contato</th>
              <th className="text-left p-3">Itens</th>
              <th className="text-left p-3">Cotas</th>
              <th className="text-left p-3">Total</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const isOpen = !!open[r.id];
              return (
                <>
                  <tr key={r.id} className="border-t border-border align-top">
                    <td className="p-3 whitespace-nowrap text-xs">
                      <div>{new Date(r.created_at).toLocaleString("pt-BR")}</div>
                      {r.paid_at && <div className="text-muted-foreground">pago: {new Date(r.paid_at).toLocaleString("pt-BR")}</div>}
                    </td>
                    <td className="p-3">
                      <div className="font-medium">{r.profile?.nome_completo ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">{r.profile?.cpf ?? "—"} · {r.profile?.cidade ?? "—"}</div>
                    </td>
                    <td className="p-3 text-xs">
                      <div>{r.profile?.email ?? "—"}</div>
                      <div className="text-muted-foreground">{r.profile?.telefone ?? "—"}</div>
                    </td>
                    <td className="p-3 text-xs">
                      {r.items.map((i, idx) => (
                        <div key={idx}>{i.quantity}x {i.campaign_title ?? "—"} <span className="text-muted-foreground">({i.campaign_code ?? "—"})</span></div>
                      ))}
                    </td>
                    <td className="p-3 font-medium tabular-nums">{r.total_quotas}</td>
                    <td className="p-3 font-medium">{brl(r.total_amount)}</td>
                    <td className="p-3"><Badge variant={r.status === "paid" ? "default" : "secondary"}>{r.status}</Badge></td>
                    <td className="p-3">
                      {r.numbers.length > 0 && (
                        <button onClick={() => setOpen({ ...open, [r.id]: !isOpen })} className="text-xs text-primary underline">
                          {isOpen ? "Ocultar" : `Ver nºs (${r.numbers.length})`}
                        </button>
                      )}
                    </td>
                  </tr>
                  {isOpen && r.numbers.length > 0 && (
                    <tr key={r.id + "-n"} className="bg-muted/20">
                      <td colSpan={8} className="p-3 text-xs">
                        <div className="flex flex-wrap gap-1">
                          {r.numbers.map((n, i) => (
                            <span key={i} className="rounded bg-primary/15 text-primary px-2 py-0.5 font-mono">{String(n.lucky_number).padStart(4, "0")}</span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
            {filtered.length === 0 && <tr><td colSpan={8} className="p-6 text-center text-muted-foreground">Nenhuma venda.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}