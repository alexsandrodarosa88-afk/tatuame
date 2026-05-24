import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useArtist } from "@/hooks/use-artist";
import { createPayoutRequest, listMyPayoutRequests } from "@/lib/payout-request.functions";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Upload, FileText, Loader2, ExternalLink, Banknote } from "lucide-react";

export const Route = createFileRoute("/_authenticated/tatuador/solicitar-pagamento")({ component: SolicitarPagamento });

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function SolicitarPagamento() {
  const { user } = useAuth();
  const { artist, loading } = useArtist();
  const qc = useQueryClient();
  const listFn = useServerFn(listMyPayoutRequests);
  const createFn = useServerFn(createPayoutRequest);
  const { data: requests } = useQuery({ queryKey: ["my-payout-requests"], queryFn: () => listFn() });

  const [form, setForm] = useState({
    winner_name: "", winner_cpf: "", winner_phone: "", winner_email: "",
    tattoo_value: "", notes: "",
    is_partial: false, sessions_total: "", sessions_done: "",
  });
  const [termUrl, setTermUrl] = useState<string>("");
  const [photoUrl, setPhotoUrl] = useState<string>("");
  const [uploadingTerm, setUploadingTerm] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const uploadFile = async (file: File, kind: "term" | "photo") => {
    if (!user) return null;
    const path = `${user.id}/${kind}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const { error } = await supabase.storage.from("artist-documents").upload(path, file, { upsert: false });
    if (error) { toast.error("Erro ao enviar arquivo: " + error.message); return null; }
    const { data } = await supabase.storage.from("artist-documents").createSignedUrl(path, 60 * 60 * 24 * 365);
    return data?.signedUrl ?? null;
  };

  const mut = useMutation({
    mutationFn: async () => {
      if (!artist) throw new Error("Tatuador não encontrado.");
      if (!termUrl) throw new Error("Anexe o termo assinado.");
      if (!photoUrl) throw new Error("Anexe ao menos uma foto da tatuagem.");
      const value = parseFloat(form.tattoo_value.replace(",", "."));
      if (!value || value <= 0) throw new Error("Valor da tatuagem inválido.");
      return createFn({ data: {
        artistId: artist.id,
        winner_name: form.winner_name.trim(),
        winner_cpf: form.winner_cpf.trim() || null,
        winner_phone: form.winner_phone.trim() || null,
        winner_email: form.winner_email.trim() || null,
        tattoo_value: value,
        is_partial: form.is_partial,
        sessions_total: form.is_partial && form.sessions_total ? parseInt(form.sessions_total) : null,
        sessions_done: form.is_partial && form.sessions_done ? parseInt(form.sessions_done) : null,
        signed_term_url: termUrl,
        tattoo_photo_url: photoUrl,
        notes: form.notes.trim() || null,
      }});
    },
    onSuccess: () => {
      toast.success("Solicitação enviada! Pagamento em até 48h úteis após aprovação.");
      setForm({ winner_name: "", winner_cpf: "", winner_phone: "", winner_email: "", tattoo_value: "", notes: "", is_partial: false, sessions_total: "", sessions_done: "" });
      setTermUrl(""); setPhotoUrl("");
      qc.invalidateQueries({ queryKey: ["my-payout-requests"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Erro ao enviar."),
  });

  if (loading) return <div className="grid place-items-center py-20 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-2"><Banknote className="h-5 w-5 text-primary" /><h1 className="text-2xl font-bold">Solicitar pagamento</h1></div>

      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-4 text-sm space-y-1">
          <p className="font-semibold">Como funciona</p>
          <p className="text-muted-foreground">
            Preencha os dados do cliente ganhador, anexe o termo assinado por você e pelo cliente, e ao menos uma foto da tatuagem. O pagamento é realizado em até <strong>48h úteis</strong> após aprovação. Em tatuagens grandes em várias sessões, marque “entrega parcial” e o valor será pago proporcionalmente.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1"><Label>Nome do cliente</Label><Input value={form.winner_name} onChange={(e) => setForm({ ...form, winner_name: e.target.value })} /></div>
            <div className="space-y-1"><Label>CPF</Label><Input value={form.winner_cpf} onChange={(e) => setForm({ ...form, winner_cpf: e.target.value })} /></div>
            <div className="space-y-1"><Label>Telefone</Label><Input value={form.winner_phone} onChange={(e) => setForm({ ...form, winner_phone: e.target.value })} /></div>
            <div className="space-y-1"><Label>E-mail</Label><Input type="email" value={form.winner_email} onChange={(e) => setForm({ ...form, winner_email: e.target.value })} /></div>
            <div className="space-y-1"><Label>Valor da tatuagem (R$)</Label><Input value={form.tattoo_value} onChange={(e) => setForm({ ...form, tattoo_value: e.target.value })} placeholder="0,00" /></div>
          </div>

          <label className="flex items-start gap-2 text-sm cursor-pointer">
            <Checkbox checked={form.is_partial} onCheckedChange={(v) => setForm({ ...form, is_partial: v === true })} />
            <span>Tatuagem em mais de uma sessão (entrega parcial) — receberei o valor fracionado conforme cada sessão.</span>
          </label>
          {form.is_partial && (
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Total de sessões previstas</Label><Input value={form.sessions_total} onChange={(e) => setForm({ ...form, sessions_total: e.target.value })} /></div>
              <div className="space-y-1"><Label>Sessão atual (entregue agora)</Label><Input value={form.sessions_done} onChange={(e) => setForm({ ...form, sessions_done: e.target.value })} /></div>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-3">
            <UploadBox label="Termo assinado (PDF/imagem)" url={termUrl} loading={uploadingTerm}
              onPick={async (f) => { setUploadingTerm(true); const u = await uploadFile(f, "term"); setUploadingTerm(false); if (u) setTermUrl(u); }} />
            <UploadBox label="Foto da tatuagem" url={photoUrl} loading={uploadingPhoto}
              onPick={async (f) => { setUploadingPhoto(true); const u = await uploadFile(f, "photo"); setUploadingPhoto(false); if (u) setPhotoUrl(u); }} />
          </div>

          <div className="space-y-1"><Label>Observações (opcional)</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>

          <Button onClick={() => mut.mutate()} disabled={mut.isPending} className="bg-primary hover:bg-[var(--primary-glow)]">
            {mut.isPending ? "Enviando..." : "Enviar solicitação"}
          </Button>
        </CardContent>
      </Card>

      <div>
        <h2 className="font-display text-lg font-semibold mb-2">Minhas solicitações</h2>
        <Card><CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="text-left p-3">Cliente</th>
                <th className="text-left p-3">Valor</th>
                <th className="text-left p-3">Tipo</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Anexos</th>
                <th className="text-left p-3">Data</th>
              </tr>
            </thead>
            <tbody>
              {(!requests || requests.length === 0) && (
                <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Nenhuma solicitação enviada.</td></tr>
              )}
              {(requests ?? []).map((r: any) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="p-3">{r.winner_name}</td>
                  <td className="p-3 font-semibold">{brl(Number(r.tattoo_value))}</td>
                  <td className="p-3">{r.is_partial ? `Sessão ${r.sessions_done}/${r.sessions_total}` : "Completa"}</td>
                  <td className="p-3">
                    {r.status === "paid" && <span className="text-green-500 font-medium">Pago</span>}
                    {r.status === "approved" && <span className="text-blue-500 font-medium">Aprovado</span>}
                    {r.status === "pending" && <span className="text-amber-500 font-medium">Em análise</span>}
                    {r.status === "rejected" && <span className="text-destructive font-medium">Recusado</span>}
                  </td>
                  <td className="p-3 flex gap-2">
                    <a className="text-primary hover:underline inline-flex items-center gap-1" target="_blank" rel="noreferrer" href={r.signed_term_url}><FileText className="h-3 w-3" />termo</a>
                    <a className="text-primary hover:underline inline-flex items-center gap-1" target="_blank" rel="noreferrer" href={r.tattoo_photo_url}><ExternalLink className="h-3 w-3" />foto</a>
                  </td>
                  <td className="p-3">{new Date(r.created_at).toLocaleDateString("pt-BR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent></Card>
      </div>
    </div>
  );
}

function UploadBox({ label, url, loading, onPick }: { label: string; url: string; loading: boolean; onPick: (f: File) => void }) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <label className="flex items-center justify-center gap-2 border border-dashed border-border rounded-md p-4 cursor-pointer hover:bg-muted/40 text-sm text-muted-foreground">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        <span>{url ? "Substituir arquivo" : "Selecionar arquivo"}</span>
        <input type="file" className="hidden" accept="image/*,application/pdf"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onPick(f); e.target.value = ""; }} />
      </label>
      {url && (
        <a href={url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
          <ExternalLink className="h-3 w-3" /> ver arquivo
        </a>
      )}
    </div>
  );
}