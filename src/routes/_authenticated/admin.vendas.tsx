import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { useRealtimeCallback } from "@/hooks/use-realtime-invalidate";

export const Route = createFileRoute("/_authenticated/admin/vendas")({ component: AdminVendas });

type Order = {
  id: string; user_id: string; status: string; total_amount: number; created_at: string; paid_at: string | null;
  profiles?: { nome_completo: string | null; email: string | null } | null;
  order_items?: { quantity: number; unit_price: number; campaigns?: { title: string | null } | null }[];
};

const brl = (n: number) => Number(n).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function AdminVendas() {
  const [rows, setRows] = useState<Order[]>([]);
  const [filter, setFilter] = useState<string>("all");

  const load = async () => {
    const { data } = await supabase
      .from("orders")
      .select("id,user_id,status,total_amount,created_at,paid_at,profiles(nome_completo,email),order_items(quantity,unit_price,campaigns(title))")
      .order("created_at", { ascending: false })
      .limit(500);
    if (data) setRows(data as any);
  };
  useEffect(() => { load(); }, []);
  useRealtimeCallback("orders", () => { load(); });

  const filtered = filter === "all" ? rows : rows.filter((r) => r.status === filter);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Vendas ({rows.length})</h1>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="h-9 rounded-md border border-input bg-transparent px-3 text-sm">
          <option value="all">Todos status</option>
          <option value="pending">Pendente</option>
          <option value="paid">Pago</option>
          <option value="expired">Expirado</option>
          <option value="cancelled">Cancelado</option>
        </select>
      </div>
      <div className="rounded-lg border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase">
            <tr>
              <th className="text-left p-3">Data</th>
              <th className="text-left p-3">Cliente</th>
              <th className="text-left p-3">Itens</th>
              <th className="text-left p-3">Total</th>
              <th className="text-left p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className="p-3 whitespace-nowrap">{new Date(r.created_at).toLocaleString("pt-BR")}</td>
                <td className="p-3">{r.profiles?.nome_completo || r.profiles?.email || r.user_id.slice(0, 8)}</td>
                <td className="p-3">
                  {r.order_items?.map((i, idx) => (
                    <div key={idx} className="text-xs">{i.quantity}x {i.campaigns?.title ?? "—"}</div>
                  ))}
                </td>
                <td className="p-3 font-medium">{brl(r.total_amount)}</td>
                <td className="p-3"><Badge variant={r.status === "paid" ? "default" : "secondary"}>{r.status}</Badge></td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Nenhuma venda.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}