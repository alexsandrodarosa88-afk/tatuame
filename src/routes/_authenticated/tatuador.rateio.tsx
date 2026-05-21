import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useArtist } from "@/hooks/use-artist";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Wallet } from "lucide-react";

export const Route = createFileRoute("/_authenticated/tatuador/rateio")({ component: TatuadorRateio });

type Payout = {
  id: string; amount: number; status: "pending" | "paid" | "cancelled";
  reference_period: string; paid_at: string | null; notes: string | null; created_at: string;
  campaign_id: string | null;
};

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function TatuadorRateio() {
  const { artist, loading: aLoad } = useArtist();
  const [rows, setRows] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!artist) { setLoading(false); return; }
    supabase.from("artist_payouts").select("*").eq("artist_id", artist.id)
      .order("reference_period", { ascending: false })
      .then(({ data }) => { setRows((data as Payout[]) ?? []); setLoading(false); });
  }, [artist]);

  if (aLoad || loading) return <div className="grid place-items-center py-20 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>;

  if (!artist) {
    return <Card><CardContent className="p-6 text-sm text-muted-foreground">Aguarde aprovação do cadastro para visualizar rateios.</CardContent></Card>;
  }

  const totalPending = rows.filter(r => r.status === "pending").reduce((s, r) => s + Number(r.amount), 0);
  const totalPaid = rows.filter(r => r.status === "paid").reduce((s, r) => s + Number(r.amount), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2"><Wallet className="h-5 w-5 text-primary" /><h1 className="text-2xl font-bold">Meus rateios</h1></div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Card><CardContent className="p-5">
          <p className="text-xs text-muted-foreground uppercase">A receber</p>
          <p className="text-2xl font-bold text-amber-500">{brl(totalPending)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <p className="text-xs text-muted-foreground uppercase">Já recebido</p>
          <p className="text-2xl font-bold text-green-500">{brl(totalPaid)}</p>
        </CardContent></Card>
      </div>

      {rows.length === 0 ? (
        <Card><CardContent className="p-6 text-sm text-muted-foreground text-center">
          Nenhum rateio lançado ainda. Quando uma campanha for finalizada, o valor a receber aparecerá aqui.
        </CardContent></Card>
      ) : (
        <Card><CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="text-left p-3">Período</th>
                <th className="text-left p-3">Valor</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Pago em</th>
                <th className="text-left p-3">Obs.</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} className="border-t border-border">
                  <td className="p-3">{new Date(r.reference_period).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</td>
                  <td className="p-3 font-semibold">{brl(Number(r.amount))}</td>
                  <td className="p-3">
                    {r.status === "paid" && <span className="text-green-500 font-medium">Pago</span>}
                    {r.status === "pending" && <span className="text-amber-500 font-medium">A receber</span>}
                    {r.status === "cancelled" && <span className="text-muted-foreground">Cancelado</span>}
                  </td>
                  <td className="p-3">{r.paid_at ? new Date(r.paid_at).toLocaleDateString("pt-BR") : "—"}</td>
                  <td className="p-3 text-muted-foreground">{r.notes ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent></Card>
      )}
    </div>
  );
}