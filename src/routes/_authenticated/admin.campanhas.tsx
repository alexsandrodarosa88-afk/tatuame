import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { db, BRL } from "@/lib/db";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/campanhas")({
  component: Page,
  head: () => ({ meta: [{ title: "Campanhas | Admin TATUAME" }, { name: "description", content: "Gerenciar campanhas." }, { property: "og:title", content: "Campanhas | Admin TATUAME" }, { property: "og:description", content: "Gerenciar campanhas." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
});

type C = { id?: string; title: string; description: string; prize: string; kind: string; image_url: string; quota_price: number; total_quotas: number; display_percent: number; status: string; ends_at: string };
const blank: C = { title: "", description: "", prize: "", kind: "simples", image_url: "", quota_price: 10, total_quotas: 1000, display_percent: 0, status: "rascunho", ends_at: "" };
const statusLabel: Record<string, string> = { rascunho: "Rascunho", ativa: "Ativa", encerrada: "Encerrada" };

function NumbersCheck({ id, total }: { id: string; total: number }) {
  const q = useQuery({
    queryKey: ["numbers-check", id],
    refetchInterval: 15000,
    queryFn: async () => {
      const nums: number[] = [];
      for (let from = 0; ; from += 1000) {
        const { data } = await db.from("lucky_numbers").select("number").eq("campaign_id", id).range(from, from + 999);
        nums.push(...(data ?? []).map((r: any) => r.number));
        if (!data || data.length < 1000) break;
      }
      return { count: nums.length, dups: nums.length - new Set(nums).size };
    },
  });
  if (!q.data) return null;
  const ok = q.data.dups === 0;
  return (
    <p className={`text-xs font-medium ${ok ? "text-primary" : "text-destructive"}`}>
      {ok ? "Números conferidos: nenhum repetido" : `Atenção: ${q.data.dups} número(s) repetido(s)`} · {q.data.count} gerados · {Math.max(0, total - q.data.count)} restantes
    </p>
  );
}

function Page() {
  const list = useQuery({ queryKey: ["admin-campaigns"], queryFn: async () => (await db.from("campaigns").select("*").order("created_at", { ascending: false })).data ?? [] });
  const [edit, setEdit] = useState<C | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!edit) return;
    if (!edit.title.trim()) return toast.error("Informe o título");
    setSaving(true);
    const { id, ...rest } = edit;
    const payload = { ...rest, ends_at: rest.ends_at || null, image_url: rest.image_url || null };
    const { error } = id ? await db.from("campaigns").update(payload).eq("id", id) : await db.from("campaigns").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Campanha salva"); setEdit(null); list.refetch();
  };
  const remove = async (id: string) => {
    if (!confirm("Excluir esta campanha? As compras dela também serão apagadas.")) return;
    const { error } = await db.from("campaigns").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Campanha excluída"); list.refetch();
  };
  const upload = async (file: File) => {
    const path = `${crypto.randomUUID()}-${file.name.replace(/[^\w.]/g, "")}`;
    const { error } = await supabase.storage.from("site-images").upload(path, file);
    if (error) return toast.error("Falha ao enviar foto");
    const { data } = await supabase.storage.from("site-images").createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
    const url = data?.signedUrl;
    if (!url) return toast.error("Falha ao gerar link da foto");
    setEdit((e) => e && { ...e, image_url: url });
  };
  const num = (k: keyof C) => (e: React.ChangeEvent<HTMLInputElement>) => setEdit((x) => x && { ...x, [k]: Number(e.target.value) });
  const txt = (k: keyof C) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setEdit((x) => x && { ...x, [k]: e.target.value });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><h1 className="text-3xl">Campanhas</h1><Button onClick={() => setEdit({ ...blank })}><Plus className="mr-1 h-4 w-4" />Nova campanha</Button></div>
      <div className="space-y-3">
        {list.data?.map((c: any) => (
          <div key={c.id} className="flex items-center gap-4 rounded-2xl border bg-card p-4">
            <div className="h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">{c.image_url && <img src={c.image_url} alt="" className="h-full w-full object-cover" />}</div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{c.title}</p>
              <p className="text-sm text-muted-foreground">{c.kind === "premium" ? "Premium" : "Simples"} · {BRL(c.quota_price)} · {statusLabel[c.status] ?? c.status}</p>
              <NumbersCheck id={c.id} total={c.total_quotas} />
            </div>
            <Button size="icon" variant="outline" aria-label="Editar" onClick={() => setEdit({ ...blank, ...c, description: c.description ?? "", prize: c.prize ?? "", image_url: c.image_url ?? "", display_percent: c.display_percent ?? 0, ends_at: c.ends_at ? c.ends_at.slice(0, 16) : "" })}><Pencil className="h-4 w-4" /></Button>
            <Button size="icon" variant="outline" aria-label="Excluir" onClick={() => remove(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
          </div>
        ))}
        {list.data?.length === 0 && <p className="text-muted-foreground">Nenhuma campanha ainda. Clique em “Nova campanha”.</p>}
      </div>

      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader><DialogTitle>{edit?.id ? "Editar campanha" : "Nova campanha"}</DialogTitle></DialogHeader>
          {edit && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1 sm:col-span-2"><Label>Título</Label><Input value={edit.title} onChange={txt("title")} /></div>
              <div className="space-y-1"><Label>Tipo</Label><select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={edit.kind} onChange={txt("kind")}><option value="simples">Simples</option><option value="premium">Premium</option></select></div>
              <div className="space-y-1"><Label>Status</Label><select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={edit.status} onChange={txt("status")}><option value="rascunho">Rascunho (oculta)</option><option value="ativa">Ativa (vendendo)</option><option value="encerrada">Encerrada</option></select></div>
              <div className="space-y-1 sm:col-span-2"><Label>Prêmio</Label><Input value={edit.prize} onChange={txt("prize")} /></div>
              <div className="space-y-1 sm:col-span-2"><Label>Descrição</Label><Textarea rows={4} value={edit.description} onChange={txt("description")} /></div>
              <div className="space-y-1"><Label>Valor da cota (R$)</Label><Input type="number" step="0.01" min="0" value={edit.quota_price} onChange={num("quota_price")} /></div>
              <div className="space-y-1"><Label>Total de cotas</Label><Input type="number" min="1" value={edit.total_quotas} onChange={num("total_quotas")} /></div>
              <div className="space-y-1"><Label>% vendido mostrado ao público</Label><Input type="number" min="0" max="100" value={edit.display_percent} onChange={num("display_percent")} /></div>
              <div className="space-y-1"><Label>Encerra em</Label><Input type="datetime-local" value={edit.ends_at} onChange={txt("ends_at")} /></div>
              <div className="space-y-2 sm:col-span-2"><Label>Foto</Label>
                {edit.image_url && <img src={edit.image_url} alt="" className="h-32 rounded-lg object-cover" />}
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm"><Upload className="h-4 w-4" />Enviar foto<input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} /></label>
              </div>
              <Button className="sm:col-span-2" disabled={saving} onClick={save}>{saving ? "Salvando..." : "Salvar campanha"}</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
