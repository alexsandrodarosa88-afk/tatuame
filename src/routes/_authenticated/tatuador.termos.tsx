import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useArtist } from "@/hooks/use-artist";
import { upsertServiceTerm, listMyServiceTerms, deleteServiceTerm } from "@/lib/service-terms.functions";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { FileSignature, Printer, Trash2, Loader2, Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/tatuador/termos")({ component: TermosPage });

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const blank = {
  id: "" as string | "",
  artist_name: "", artist_cpf: "", artist_address: "",
  client_name: "", client_cpf: "", client_phone: "", client_address: "",
  tattoo_description: "", tattoo_value: "",
  campaign_code: "", is_prize: true,
  sessions_total: "",
  artist_signature: "", client_signature: "", client_receipt_signature: "",
};

function TermosPage() {
  const { artist, loading } = useArtist();
  const qc = useQueryClient();
  const listFn = useServerFn(listMyServiceTerms);
  const upsertFn = useServerFn(upsertServiceTerm);
  const delFn = useServerFn(deleteServiceTerm);
  const { data: terms } = useQuery({ queryKey: ["my-service-terms"], queryFn: () => listFn() });

  const [form, setForm] = useState({ ...blank });
  const printRef = useRef<HTMLDivElement | null>(null);

  // Pre-fill artist name from profile
  useMemo(() => {
    if (artist && !form.artist_name) setForm((f) => ({ ...f, artist_name: artist.name ?? "" , artist_address: artist.address ?? "" }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artist]);

  const mut = useMutation({
    mutationFn: async () => {
      if (!artist) throw new Error("Tatuador não encontrado.");
      const value = parseFloat((form.tattoo_value || "0").replace(",", "."));
      return upsertFn({ data: {
        id: form.id || undefined,
        artistId: artist.id,
        artist_name: form.artist_name.trim(),
        artist_cpf: form.artist_cpf.trim() || null,
        artist_address: form.artist_address.trim() || null,
        client_name: form.client_name.trim(),
        client_cpf: form.client_cpf.trim() || null,
        client_phone: form.client_phone.trim() || null,
        client_address: form.client_address.trim() || null,
        tattoo_description: form.tattoo_description.trim(),
        tattoo_value: value,
        campaign_code: form.campaign_code.trim() || null,
        is_prize: form.is_prize,
        sessions_total: form.sessions_total ? parseInt(form.sessions_total) : null,
        artist_signature: form.artist_signature.trim() || null,
        client_signature: form.client_signature.trim() || null,
        client_receipt_signature: form.client_receipt_signature.trim() || null,
      }});
    },
    onSuccess: (r) => {
      toast.success("Termo salvo.");
      qc.invalidateQueries({ queryKey: ["my-service-terms"] });
      setForm((f) => ({ ...f, id: r.id }));
    },
    onError: (e: any) => toast.error(e?.message ?? "Erro ao salvar."),
  });

  const del = async (id: string) => {
    if (!confirm("Excluir este termo?")) return;
    try { await delFn({ data: { id } }); toast.success("Excluído."); qc.invalidateQueries({ queryKey: ["my-service-terms"] }); }
    catch (e: any) { toast.error(e?.message ?? "Erro ao excluir."); }
  };

  const load = (t: any) => setForm({
    id: t.id,
    artist_name: t.artist_name ?? "", artist_cpf: t.artist_cpf ?? "", artist_address: t.artist_address ?? "",
    client_name: t.client_name ?? "", client_cpf: t.client_cpf ?? "", client_phone: t.client_phone ?? "", client_address: t.client_address ?? "",
    tattoo_description: t.tattoo_description ?? "", tattoo_value: String(t.tattoo_value ?? ""),
    campaign_code: t.campaign_code ?? "", is_prize: !!t.is_prize,
    sessions_total: t.sessions_total ? String(t.sessions_total) : "",
    artist_signature: t.artist_signature ?? "", client_signature: t.client_signature ?? "", client_receipt_signature: t.client_receipt_signature ?? "",
  });

  const printTerm = () => {
    const html = printRef.current?.innerHTML ?? "";
    const w = window.open("", "_blank", "width=900,height=1100");
    if (!w) return;
    w.document.write(`<html><head><title>Termo TATUAME</title>
      <style>body{font-family:Arial,sans-serif;color:#111;padding:32px;line-height:1.5;font-size:14px;}h1{font-size:20px;margin:0 0 8px;}h2{font-size:15px;margin:18px 0 6px;}p{margin:6px 0;}.sig{margin-top:32px;border-top:1px solid #333;padding-top:6px;width:60%;}</style>
      </head><body>${html}</body></html>`);
    w.document.close(); w.focus(); w.print();
  };

  if (loading) return <div className="grid place-items-center py-20 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2"><FileSignature className="h-5 w-5 text-primary" /><h1 className="text-2xl font-bold">Termos de tatuagem</h1></div>
        <Button variant="outline" size="sm" onClick={() => setForm({ ...blank, artist_name: artist?.name ?? "", artist_address: artist?.address ?? "" })}><Plus className="h-4 w-4 mr-1" />Novo termo</Button>
      </div>

      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-4 text-sm text-muted-foreground">
          Preencha os dados do tatuador e do cliente, descreva a tatuagem e o valor. O termo gerado deixa claro que a TATUAME <strong>não se responsabiliza pela entrega/execução</strong> do serviço — apenas pelo repasse do valor do prêmio ganho. Ao final, o cliente assina confirmando o recebimento e autorizando o repasse do prêmio para o tatuador.
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 space-y-5">
          <section className="space-y-3">
            <h2 className="font-semibold">Dados do tatuador</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Nome / razão social</Label><Input value={form.artist_name} onChange={(e) => setForm({ ...form, artist_name: e.target.value })} /></div>
              <div className="space-y-1"><Label>CPF/CNPJ</Label><Input value={form.artist_cpf} onChange={(e) => setForm({ ...form, artist_cpf: e.target.value })} /></div>
              <div className="space-y-1 sm:col-span-2"><Label>Endereço do estúdio</Label><Input value={form.artist_address} onChange={(e) => setForm({ ...form, artist_address: e.target.value })} /></div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="font-semibold">Dados do cliente</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Nome completo</Label><Input value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} /></div>
              <div className="space-y-1"><Label>CPF</Label><Input value={form.client_cpf} onChange={(e) => setForm({ ...form, client_cpf: e.target.value })} /></div>
              <div className="space-y-1"><Label>Telefone</Label><Input value={form.client_phone} onChange={(e) => setForm({ ...form, client_phone: e.target.value })} /></div>
              <div className="space-y-1"><Label>Endereço</Label><Input value={form.client_address} onChange={(e) => setForm({ ...form, client_address: e.target.value })} /></div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="font-semibold">Dados da tatuagem</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1 sm:col-span-2"><Label>Descrição / local do corpo</Label><Textarea value={form.tattoo_description} onChange={(e) => setForm({ ...form, tattoo_description: e.target.value })} /></div>
              <div className="space-y-1"><Label>Valor combinado (R$)</Label><Input value={form.tattoo_value} onChange={(e) => setForm({ ...form, tattoo_value: e.target.value })} placeholder="0,00" /></div>
              <div className="space-y-1"><Label>Código da campanha (se prêmio)</Label><Input value={form.campaign_code} onChange={(e) => setForm({ ...form, campaign_code: e.target.value })} /></div>
              <div className="space-y-1"><Label>Sessões previstas</Label><Input value={form.sessions_total} onChange={(e) => setForm({ ...form, sessions_total: e.target.value })} placeholder="1" /></div>
              <label className="flex items-center gap-2 text-sm sm:col-span-2 cursor-pointer">
                <Checkbox checked={form.is_prize} onCheckedChange={(v) => setForm({ ...form, is_prize: v === true })} />
                <span>Tatuagem é prêmio de campanha TATUAME</span>
              </label>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="font-semibold">Assinaturas</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Assinatura do tatuador (nome por extenso)</Label><Input value={form.artist_signature} onChange={(e) => setForm({ ...form, artist_signature: e.target.value })} /></div>
              <div className="space-y-1"><Label>Assinatura do cliente (nome por extenso)</Label><Input value={form.client_signature} onChange={(e) => setForm({ ...form, client_signature: e.target.value })} /></div>
              <div className="space-y-1 sm:col-span-2"><Label>Assinatura de RECEBIMENTO do cliente (preencher após a tatuagem entregue)</Label><Input value={form.client_receipt_signature} onChange={(e) => setForm({ ...form, client_receipt_signature: e.target.value })} placeholder="Nome do cliente confirmando recebimento" /></div>
            </div>
          </section>

          <div className="flex flex-wrap gap-2">
            <Button onClick={() => mut.mutate()} disabled={mut.isPending} className="bg-primary hover:bg-[var(--primary-glow)]">{mut.isPending ? "Salvando..." : (form.id ? "Salvar alterações" : "Criar termo")}</Button>
            <Button variant="outline" onClick={printTerm}><Printer className="h-4 w-4 mr-1" />Imprimir / PDF</Button>
          </div>
        </CardContent>
      </Card>

      {/* Termo visual / para impressão */}
      <Card>
        <CardContent className="p-6">
          <div ref={printRef} className="prose prose-sm max-w-none text-foreground">
            <h1 className="font-display text-xl font-bold">TERMO DE PRESTAÇÃO DE SERVIÇO DE TATUAGEM</h1>
            <p><strong>TATUADOR:</strong> {form.artist_name || "—"} {form.artist_cpf && `· CPF/CNPJ ${form.artist_cpf}`} {form.artist_address && `· ${form.artist_address}`}</p>
            <p><strong>CLIENTE:</strong> {form.client_name || "—"} {form.client_cpf && `· CPF ${form.client_cpf}`} {form.client_phone && `· Tel ${form.client_phone}`} {form.client_address && `· ${form.client_address}`}</p>
            <h2 className="font-semibold mt-4">1. Objeto</h2>
            <p>O presente termo tem por objeto a prestação, pelo TATUADOR, de serviço de tatuagem descrito como: <strong>{form.tattoo_description || "—"}</strong>, no valor combinado de <strong>{brl(parseFloat((form.tattoo_value || "0").replace(",", ".")) || 0)}</strong>{form.is_prize ? <> , referente ao prêmio da campanha <strong>{form.campaign_code || "—"}</strong> da plataforma TATUAME</> : null}{form.sessions_total ? <> , a ser entregue em <strong>{form.sessions_total} sessão(ões)</strong></> : null}.</p>
            <h2 className="font-semibold mt-4">2. Responsabilidade</h2>
            <p>A execução técnica, a qualidade artística, a higiene, a biossegurança e o resultado final da tatuagem são de responsabilidade <strong>EXCLUSIVA do TATUADOR</strong>. A plataforma <strong>TATUAME NÃO se responsabiliza pela prestação do serviço</strong>; sua responsabilidade limita-se ao repasse financeiro do prêmio/valor combinado conforme suas políticas.</p>
            <h2 className="font-semibold mt-4">3. Pagamento</h2>
            <p>O TATUAME pagará ao TATUADOR o valor combinado conforme regras da plataforma — em até 48h úteis após aprovação da solicitação de pagamento, mediante envio deste termo assinado e foto(s) da tatuagem. Em tatuagens fracionadas, o pagamento é proporcional à sessão entregue.</p>
            <h2 className="font-semibold mt-4">4. Saúde e consentimento</h2>
            <p>O CLIENTE declara ser maior de 18 anos, estar em boas condições de saúde, ter sido informado sobre os cuidados pré e pós tatuagem e autorizar a realização do serviço descrito.</p>
            <h2 className="font-semibold mt-4">5. LGPD</h2>
            <p>As partes autorizam o uso dos dados pessoais aqui informados exclusivamente para execução deste termo e cumprimento de obrigações legais.</p>

            <p className="mt-6">_____________________, ____/____/______</p>

            <div className="grid sm:grid-cols-2 gap-6 mt-6">
              <div className="sig"><div>{form.artist_signature || "Assinatura do TATUADOR"}</div></div>
              <div className="sig"><div>{form.client_signature || "Assinatura do CLIENTE (ciente)"}</div></div>
            </div>

            <h2 className="font-semibold mt-8">DECLARAÇÃO DE RECEBIMENTO DO SERVIÇO</h2>
            <p>Eu, <strong>{form.client_name || "________________________"}</strong>, declaro que <strong>RECEBI a tatuagem objeto deste termo</strong> conforme o esperado e <strong>AUTORIZO a plataforma TATUAME</strong> a efetuar o repasse do valor do meu prêmio/serviço diretamente ao TATUADOR <strong>{form.artist_name || "________________________"}</strong>, dando integral quitação.</p>
            <div className="sig"><div>{form.client_receipt_signature || "Assinatura do CLIENTE confirmando recebimento"}</div></div>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="font-display text-lg font-semibold mb-2">Meus termos</h2>
        <Card><CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr><th className="text-left p-3">Cliente</th><th className="text-left p-3">Valor</th><th className="text-left p-3">Status</th><th className="text-left p-3">Criado</th><th className="text-left p-3">Ações</th></tr>
            </thead>
            <tbody>
              {(!terms || terms.length === 0) && <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Nenhum termo criado.</td></tr>}
              {(terms ?? []).map((t: any) => (
                <tr key={t.id} className="border-t border-border">
                  <td className="p-3">{t.client_name}</td>
                  <td className="p-3 font-semibold">{brl(Number(t.tattoo_value))}</td>
                  <td className="p-3">{t.status === "completed" ? <span className="text-green-500 font-medium">Concluído</span> : t.status === "signed" ? <span className="text-blue-500">Assinado</span> : <span className="text-amber-500">Rascunho</span>}</td>
                  <td className="p-3">{new Date(t.created_at).toLocaleDateString("pt-BR")}</td>
                  <td className="p-3 flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => load(t)}>Editar</Button>
                    <Button variant="ghost" size="sm" onClick={() => del(t.id)} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent></Card>
      </div>
    </div>
  );
}