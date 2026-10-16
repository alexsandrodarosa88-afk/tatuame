import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Upload, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { db, loadSettings, type SiteSettings } from "@/lib/db";
import { supabase } from "@/integrations/supabase/client";
import { TEXT_FIELDS, IMAGE_FIELDS, COLOR_FIELDS } from "@/lib/site-content";

export const Route = createFileRoute("/_authenticated/admin/configuracoes")({
  component: Page,
  head: () => ({ meta: [{ title: "Site | Admin TATUAME" }, { name: "description", content: "Textos, fotos e cores do site." }, { property: "og:title", content: "Site | Admin TATUAME" }, { property: "og:description", content: "Textos, fotos e cores do site." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
});

const groups = [...new Set(TEXT_FIELDS.map((f) => f.group))];

function Page() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["settings"], queryFn: loadSettings });
  const [s, setS] = useState<SiteSettings>({});
  useEffect(() => {
    if (!q.data) return;
    const d = q.data;
    const texts = { ...(d.texts ?? {}) };
    if (d.hero_title && !texts.hero_title) texts.hero_title = d.hero_title;
    if (d.hero_subtitle && !texts.hero_subtitle) texts.hero_subtitle = d.hero_subtitle;
    setS({ faq: [], ...d, texts, images: d.images ?? {}, colors: d.colors ?? {} });
  }, [q.data]);
  const save = async () => {
    const data = { ...s, hero_title: undefined, hero_subtitle: undefined };
    const { error } = await db.from("site_settings").upsert({ id: 1, data, updated_at: new Date().toISOString() });
    if (error) return toast.error(error.message);
    toast.success("Site atualizado"); qc.invalidateQueries({ queryKey: ["settings"] });
  };
  const setText = (k: string, v: string) => setS({ ...s, texts: { ...s.texts, [k]: v } });
  const setImg = (k: string, v: string) => setS({ ...s, images: { ...s.images, [k]: v } });
  const setColor = (k: string, v: string) => setS({ ...s, colors: { ...s.colors, [k]: v } });
  const upload = async (k: string, file: File) => {
    const path = `site/${crypto.randomUUID()}-${file.name.replace(/[^\w.]/g, "")}`;
    const { error } = await supabase.storage.from("site-images").upload(path, file);
    if (error) return toast.error("Falha ao enviar foto");
    const { data } = await supabase.storage.from("site-images").createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
    if (!data?.signedUrl) return toast.error("Falha ao gerar link da foto");
    setImg(k, data.signedUrl); toast.success("Foto enviada — clique em Salvar alterações");
  };
  const faq = s.faq ?? [];
  const setFaq = (i: number, k: "q" | "a", v: string) => setS({ ...s, faq: faq.map((f, n) => (n === i ? { ...f, [k]: v } : f)) });
  return (
    <div className="max-w-3xl space-y-6 pb-24">
      <h1 className="text-3xl">Editar o site</h1>

      <section className="space-y-4 rounded-2xl border bg-card p-5">
        <h2 className="text-xl">Fotos</h2>
        {IMAGE_FIELDS.map((f) => (
          <div key={f.key} className="flex flex-wrap items-center gap-4">
            <img src={s.images?.[f.key] || f.def} alt={f.label} className="h-20 w-28 rounded-lg border bg-muted object-contain" />
            <div className="space-y-2">
              <p className="text-sm font-medium">{f.label}</p>
              <div className="flex gap-2">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm"><Upload className="h-4 w-4" />Trocar foto<input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(f.key, e.target.files[0])} /></label>
                {s.images?.[f.key] && <Button size="sm" variant="ghost" onClick={() => setImg(f.key, "")}><RotateCcw className="mr-1 h-4 w-4" />Original</Button>}
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="space-y-4 rounded-2xl border bg-card p-5">
        <h2 className="text-xl">Cores</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {COLOR_FIELDS.map((f) => (
            <div key={f.key} className="flex items-center gap-3">
              <input type="color" aria-label={f.label} value={s.colors?.[f.key] || f.def} onChange={(e) => setColor(f.key, e.target.value)} className="h-10 w-14 cursor-pointer rounded border" />
              <span className="text-sm">{f.label}</span>
            </div>
          ))}
        </div>
        <Button size="sm" variant="outline" onClick={() => setS({ ...s, colors: {} })}><RotateCcw className="mr-1 h-4 w-4" />Voltar às cores originais</Button>
      </section>

      {groups.map((g) => (
        <section key={g} className="space-y-3 rounded-2xl border bg-card p-5">
          <h2 className="text-xl">Textos — {g}</h2>
          {TEXT_FIELDS.filter((f) => f.group === g).map((f) => (
            <div key={f.key} className="space-y-1">
              <Label>{f.label}</Label>
              {f.long
                ? <Textarea value={s.texts?.[f.key] ?? ""} placeholder={f.def} onChange={(e) => setText(f.key, e.target.value)} />
                : <Input value={s.texts?.[f.key] ?? ""} placeholder={f.def} onChange={(e) => setText(f.key, e.target.value)} />}
            </div>
          ))}
        </section>
      ))}

      <section className="space-y-4 rounded-2xl border bg-card p-5">
        <div className="space-y-1"><Label>WhatsApp de contato (com DDD e 55)</Label><Input value={s.whatsapp ?? ""} onChange={(e) => setS({ ...s, whatsapp: e.target.value.replace(/\D/g, "") })} placeholder="5511999999999" /></div>
      </section>

      <section className="space-y-4 rounded-2xl border bg-card p-5">
        <div className="flex items-center justify-between"><h2 className="text-xl">Dúvidas frequentes</h2><Button size="sm" variant="outline" onClick={() => setS({ ...s, faq: [...faq, { q: "", a: "" }] })}><Plus className="mr-1 h-4 w-4" />Adicionar</Button></div>
        {faq.map((f, i) => (
          <div key={i} className="space-y-2 rounded-xl border p-3">
            <div className="flex gap-2"><Input placeholder="Pergunta" value={f.q} onChange={(e) => setFaq(i, "q", e.target.value)} /><Button size="icon" variant="ghost" aria-label="Remover" onClick={() => setS({ ...s, faq: faq.filter((_, n) => n !== i) })}><Trash2 className="h-4 w-4" /></Button></div>
            <Textarea placeholder="Resposta" value={f.a} onChange={(e) => setFaq(i, "a", e.target.value)} />
          </div>
        ))}
      </section>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 p-3 backdrop-blur">
        <div className="mx-auto max-w-3xl"><Button size="lg" className="w-full" onClick={save}>Salvar alterações</Button></div>
      </div>
    </div>
  );
}
