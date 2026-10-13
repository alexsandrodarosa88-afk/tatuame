import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { db, loadSettings, type SiteSettings } from "@/lib/db";

export const Route = createFileRoute("/_authenticated/admin/configuracoes")({
  component: Page,
  head: () => ({ meta: [{ title: "Site | Admin TATUAME" }, { name: "description", content: "Textos e configurações do site." }, { property: "og:title", content: "Site | Admin TATUAME" }, { property: "og:description", content: "Textos e configurações do site." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
});

function Page() {
  const q = useQuery({ queryKey: ["settings"], queryFn: loadSettings });
  const [s, setS] = useState<SiteSettings>({});
  useEffect(() => { if (q.data) setS({ faq: [], ...q.data }); }, [q.data]);
  const save = async () => {
    const { error } = await db.from("site_settings").update({ data: s, updated_at: new Date().toISOString() }).eq("id", 1);
    if (error) return toast.error(error.message);
    toast.success("Site atualizado"); q.refetch();
  };
  const faq = s.faq ?? [];
  const setFaq = (i: number, k: "q" | "a", v: string) => setS({ ...s, faq: faq.map((f, n) => (n === i ? { ...f, [k]: v } : f)) });
  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-3xl">Textos e configurações</h1>
      <div className="space-y-4 rounded-2xl border bg-card p-5">
        <div className="space-y-1"><Label>Título principal</Label><Input value={s.hero_title ?? ""} onChange={(e) => setS({ ...s, hero_title: e.target.value })} /></div>
        <div className="space-y-1"><Label>Subtítulo</Label><Textarea value={s.hero_subtitle ?? ""} onChange={(e) => setS({ ...s, hero_subtitle: e.target.value })} /></div>
        <div className="space-y-1"><Label>WhatsApp para receber pagamentos (com DDD e 55)</Label><Input value={s.whatsapp ?? ""} onChange={(e) => setS({ ...s, whatsapp: e.target.value.replace(/\D/g, "") })} placeholder="5511999999999" /></div>
      </div>
      <div className="space-y-4 rounded-2xl border bg-card p-5">
        <div className="flex items-center justify-between"><h2 className="text-xl">Dúvidas frequentes</h2><Button size="sm" variant="outline" onClick={() => setS({ ...s, faq: [...faq, { q: "", a: "" }] })}><Plus className="mr-1 h-4 w-4" />Adicionar</Button></div>
        {faq.map((f, i) => (
          <div key={i} className="space-y-2 rounded-xl border p-3">
            <div className="flex gap-2"><Input placeholder="Pergunta" value={f.q} onChange={(e) => setFaq(i, "q", e.target.value)} /><Button size="icon" variant="ghost" aria-label="Remover" onClick={() => setS({ ...s, faq: faq.filter((_, n) => n !== i) })}><Trash2 className="h-4 w-4" /></Button></div>
            <Textarea placeholder="Resposta" value={f.a} onChange={(e) => setFaq(i, "a", e.target.value)} />
          </div>
        ))}
      </div>
      <Button size="lg" onClick={save}>Salvar alterações</Button>
    </div>
  );
}
