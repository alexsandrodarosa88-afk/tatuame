import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useArtist } from "@/hooks/use-artist";
import { useServerFn } from "@tanstack/react-start";
import { getArtistInvoiceUrl } from "@/lib/artist-subscription.functions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/tatuador/mensalidade")({ component: Mensalidade });

type Sub = {
  id: string;
  amount: number;
  status: string;
  reference_month: string;
  due_date: string | null;
  paid_at: string | null;
  invoice_url: string | null;
};
const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function Mensalidade() {
  const { artist, application, loading } = useArtist();
  const [rows, setRows] = useState<Sub[]>([]);
  const [load, setLoad] = useState(true);
  const invoiceFn = useServerFn(getArtistInvoiceUrl);
  const [openingId, setOpeningId] = useState<string | null>(null);

  const reload = () => {
    if (!artist) { setLoad(false); return; }
    supabase.from("artist_subscriptions").select("*").eq("artist_id", artist.id)
      .order("reference_month", { ascending: false })
      .then(({ data }) => { setRows((data as any) ?? []); setLoad(false); });
  };

  useEffect(reload, [artist]);

  if (loading || load) return <div className="grid place-items-center py-20 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  if (!application || application.status !== "approved" || !artist) {
    return <Card><CardContent className="p-6 text-sm text-muted-foreground">Aguarde a aprovação do cadastro.</CardContent></Card>;
  }

  const pending = rows.find((r) => r.status === "pending");

  const payNow = async (id: string, existingUrl: string | null) => {
    if (existingUrl) {
      window.open(existingUrl, "_blank");
      return;
    }
    setOpeningId(id);
    try {
      const r = await invoiceFn({ data: { invoiceId: id } });
      if (r?.invoiceUrl) window.open(r.invoiceUrl, "_blank");
      else toast.error("Não foi possível abrir a fatura.");
    } catch (e: any) {
      toast.error(e?.message ?? "Falha ao abrir a fatura.");
    } finally {
      setOpeningId(null);
    }
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center gap-2"><CreditCard className="h-5 w-5 text-primary" /><h1 className="text-2xl font-bold">Mensalidade</h1></div>

      <div className="flex items-start gap-2 rounded-md border border-primary/30 bg-primary/5 p-3 text-sm">
        <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold">Promoção de lançamento</p>
          <p className="text-muted-foreground">6 primeiros meses por <strong>R$ 39,90</strong>, depois <strong>R$ 59,90/mês</strong>.</p>
        </div>
      </div>

      {pending ? (
        <Card className="border-primary/30">
          <CardContent className="p-6 space-y-3">
            <p className="text-sm text-muted-foreground uppercase">Mensalidade em aberto</p>
            <p className="text-3xl font-bold">{brl(Number(pending.amount))}</p>
            <p className="text-sm">
              Referência: <strong>{new Date(pending.reference_month).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</strong>
              {pending.due_date && <> · Vencimento: <strong>{new Date(pending.due_date).toLocaleDateString("pt-BR")}</strong></>}
            </p>
            <Button
              onClick={() => payNow(pending.id, pending.invoice_url)}
              disabled={openingId === pending.id}
              className="w-full sm:w-auto bg-primary hover:bg-[var(--primary-glow)]"
            >
              {openingId === pending.id ? "Abrindo…" : "PAGAR mensalidade"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="p-6 flex items-start gap-3">
            <CheckCircle2 className="h-6 w-6 text-green-500 shrink-0" />
            <div>
              <p className="font-semibold">Nenhuma mensalidade em aberto</p>
              <p className="text-sm text-muted-foreground">Você está em dia. A próxima mensalidade aparecerá aqui.</p>
              <Button asChild variant="link" className="p-0 h-auto mt-1 text-sm">
                <Link to="/tatuador/assinatura">Gerenciar forma de pagamento</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="text-left p-3">Referência</th>
                <th className="text-left p-3">Valor</th>
                <th className="text-left p-3">Vencimento</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Pago em</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">
                  <AlertCircle className="h-4 w-4 inline mr-1" /> Nenhuma mensalidade lançada ainda.
                </td></tr>
              )}
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="p-3">{new Date(r.reference_month).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</td>
                  <td className="p-3 font-semibold">{brl(Number(r.amount))}</td>
                  <td className="p-3">{r.due_date ? new Date(r.due_date).toLocaleDateString("pt-BR") : "—"}</td>
                  <td className="p-3">
                    {r.status === "paid" && <span className="text-green-500 font-medium">Pago</span>}
                    {r.status === "pending" && <span className="text-amber-500 font-medium">Em aberto</span>}
                  </td>
                  <td className="p-3">{r.paid_at ? new Date(r.paid_at).toLocaleDateString("pt-BR") : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
