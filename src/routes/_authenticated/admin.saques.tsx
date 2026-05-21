import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Wallet } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/saques")({ component: AdminSaques });

type Row = {
  id: string; artist_id: string; amount: number; status: string;
  requested_at: string; processed_at: string | null; notes: string | null;
  tattoo_artists?: { name: string } | null;
  artist_bank_details?: { bank_name: string; bank_agency: string; bank_account: string; pix_key: string; full_name: string } | null;
};

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function AdminSaques() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [bankMap, setBankMap] = useState<Record<string, any>>({});

  const reload = async () => {
    const { data } = await (supabase as any).from("withdrawal_requests")
      .select("*, tattoo_artists(name)")
      .order("requested_at", { ascending: false });
    const list = (data as Row[]) ?? [];
    setRows(list);
    const ids = Array.from(new Set(list.map((r) => r.artist_id)));
    if (ids.length) {
      const { data: banks } = await (supabase as any).from("artist_bank_details").select("*").in("artist_id", ids);
      const map: Record<string, any> = {};
      (banks ?? []).forEach((b: any) => { map[b.artist_id] = b; });
      setBankMap(map);
    }
    setLoading(false);
  };

  useEffect(() => { reload(); }, []);

  const update = async (id: string, status: string) => {
    const { error } = await (supabase as any).from("withdrawal_requests")
      .update({ status, processed_at: new Date().toISOString() }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Atualizado.");
    reload();
  };

  if (loading) return <div className="grid place-items-center py-20"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2"><Wallet className="h-5 w-5 text-primary" /><h1 className="text-2xl font-bold">Saques solicitados</h1></div>
      {rows.length === 0 ? (
        <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">Nenhuma solicitação ainda.</CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {rows.map((r) => {
            const bank = bankMap[r.artist_id];
            return (
              <Card key={r.id}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between flex-wrap gap-2">
                    <div>
                      <p className="font-semibold">{r.tattoo_artists?.name ?? "Tatuador"}</p>
                      <p className="text-xs text-muted-foreground">Solicitado em {new Date(r.requested_at).toLocaleString("pt-BR")}</p>
                    </div>
                    <p className="text-xl font-bold text-primary">{brl(Number(r.amount))}</p>
                  </div>
                  {bank ? (
                    <div className="text-xs bg-muted/50 rounded p-2 space-y-0.5">
                      <p><strong>Titular:</strong> {bank.full_name}</p>
                      <p><strong>Banco:</strong> {bank.bank_name} · <strong>Ag:</strong> {bank.bank_agency} · <strong>CC:</strong> {bank.bank_account}</p>
                      <p><strong>PIX:</strong> {bank.pix_key}</p>
                    </div>
                  ) : (
                    <p className="text-xs text-destructive">Sem dados bancários cadastrados.</p>
                  )}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs px-2 py-0.5 rounded bg-muted">
                      {r.status === "pending" && "Pendente"}
                      {r.status === "approved" && "Aprovado"}
                      {r.status === "paid" && "Pago"}
                      {r.status === "rejected" && "Rejeitado"}
                    </span>
                    {r.status === "pending" && <>
                      <Button size="sm" variant="outline" onClick={() => update(r.id, "approved")}>Aprovar</Button>
                      <Button size="sm" variant="outline" onClick={() => update(r.id, "rejected")}>Rejeitar</Button>
                    </>}
                    {(r.status === "pending" || r.status === "approved") && (
                      <Button size="sm" onClick={() => update(r.id, "paid")}>Marcar como pago</Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
