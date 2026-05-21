import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useArtist } from "@/hooks/use-artist";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Wallet, Info, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/tatuador/rateio")({ component: TatuadorRateio });

type Payout = { id: string; amount: number; status: string; reference_period: string; paid_at: string | null; notes: string | null };
type Wd = { id: string; amount: number; status: string; requested_at: string; processed_at: string | null };

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function TatuadorRateio() {
  const { artist, loading: aLoad } = useArtist();
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [wds, setWds] = useState<Wd[]>([]);
  const [hasBank, setHasBank] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);

  const reload = async () => {
    if (!artist) { setLoading(false); return; }
    const [{ data: po }, { data: w }, { data: bank }] = await Promise.all([
      supabase.from("artist_payouts").select("*").eq("artist_id", artist.id).order("reference_period", { ascending: false }),
      (supabase as any).from("withdrawal_requests").select("*").eq("artist_id", artist.id).order("requested_at", { ascending: false }),
      (supabase as any).from("artist_bank_details").select("id").eq("artist_id", artist.id).maybeSingle(),
    ]);
    setPayouts((po as any) ?? []);
    setWds((w as any) ?? []);
    setHasBank(!!bank);
    setLoading(false);
  };

  useEffect(() => { reload(); }, [artist]);

  if (aLoad || loading) return <div className="grid place-items-center py-20"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  if (!artist) return <Card><CardContent className="p-6 text-sm text-muted-foreground">Aguarde aprovação do cadastro.</CardContent></Card>;

  const totalPending = payouts.filter(r => r.status === "pending").reduce((s, r) => s + Number(r.amount), 0);
  const totalPaid = payouts.filter(r => r.status === "paid").reduce((s, r) => s + Number(r.amount), 0);
  const wdPending = wds.filter(w => w.status === "pending" || w.status === "approved").reduce((s, w) => s + Number(w.amount), 0);
  const available = Math.max(0, totalPending - wdPending);

  const requestWithdrawal = async () => {
    if (!hasBank) { toast.error("Cadastre seus dados bancários primeiro."); return; }
    if (available <= 0) { toast.error("Sem saldo disponível para saque."); return; }
    setRequesting(true);
    const { error } = await (supabase as any).from("withdrawal_requests").insert({
      artist_id: artist.id, amount: available,
    });
    setRequesting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Solicitação enviada! O admin TATUAME foi notificado.");
    reload();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2"><Wallet className="h-5 w-5 text-primary" /><h1 className="text-2xl font-bold">Meus rateios</h1></div>

      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-4 flex gap-3 text-sm">
          <Info className="h-5 w-5 text-primary shrink-0" />
          <div>
            <p>Após solicitar seu saque, ele será pago em <strong>até 48 horas</strong>.</p>
            <p className="text-muted-foreground">Os pagamentos só são feitos em <strong>dias úteis</strong>.</p>
          </div>
        </CardContent>
      </Card>

      {!hasBank && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="p-4 flex gap-3 text-sm items-center">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
            <p className="flex-1">Para solicitar saque você precisa cadastrar todos os seus dados (pessoais e bancários).</p>
            <Button asChild size="sm" variant="outline"><Link to="/tatuador/dados">Cadastrar agora</Link></Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <Card><CardContent className="p-5">
          <p className="text-xs text-muted-foreground uppercase">Disponível p/ saque</p>
          <p className="text-2xl font-bold text-primary">{brl(available)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <p className="text-xs text-muted-foreground uppercase">A receber (total)</p>
          <p className="text-2xl font-bold text-amber-500">{brl(totalPending)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <p className="text-xs text-muted-foreground uppercase">Já recebido</p>
          <p className="text-2xl font-bold text-green-500">{brl(totalPaid)}</p>
        </CardContent></Card>
      </div>

      <Button onClick={requestWithdrawal} disabled={!hasBank || available <= 0 || requesting} size="lg" className="w-full sm:w-auto">
        {requesting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        Solicitar saque{available > 0 ? ` (${brl(available)})` : ""}
      </Button>

      {wds.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold mt-4">Minhas solicitações de saque</h2>
          <Card><CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="text-left p-3">Solicitado</th>
                  <th className="text-left p-3">Valor</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Processado</th>
                </tr>
              </thead>
              <tbody>
                {wds.map(w => (
                  <tr key={w.id} className="border-t border-border">
                    <td className="p-3">{new Date(w.requested_at).toLocaleString("pt-BR")}</td>
                    <td className="p-3 font-semibold">{brl(Number(w.amount))}</td>
                    <td className="p-3">
                      {w.status === "pending" && <span className="text-amber-500 font-medium">Pendente</span>}
                      {w.status === "approved" && <span className="text-blue-400 font-medium">Aprovado</span>}
                      {w.status === "paid" && <span className="text-green-500 font-medium">Pago</span>}
                      {w.status === "rejected" && <span className="text-destructive font-medium">Rejeitado</span>}
                    </td>
                    <td className="p-3">{w.processed_at ? new Date(w.processed_at).toLocaleString("pt-BR") : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent></Card>
        </div>
      )}

      <h2 className="text-sm font-semibold mt-4">Rateios lançados</h2>
      {payouts.length === 0 ? (
        <Card><CardContent className="p-6 text-sm text-muted-foreground text-center">
          Nenhum rateio lançado ainda.
        </CardContent></Card>
      ) : (
        <Card><CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="text-left p-3">Período</th>
                <th className="text-left p-3">Valor</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Obs.</th>
              </tr>
            </thead>
            <tbody>
              {payouts.map(r => (
                <tr key={r.id} className="border-t border-border">
                  <td className="p-3">{new Date(r.reference_period).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</td>
                  <td className="p-3 font-semibold">{brl(Number(r.amount))}</td>
                  <td className="p-3">
                    {r.status === "paid" && <span className="text-green-500 font-medium">Pago</span>}
                    {r.status === "pending" && <span className="text-amber-500 font-medium">A receber</span>}
                    {r.status === "cancelled" && <span className="text-muted-foreground">Cancelado</span>}
                  </td>
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
