import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Upload, Save } from "lucide-react";
import { useInvalidateSiteSettings } from "@/hooks/use-site-settings";

export const Route = createFileRoute("/_authenticated/admin/configuracoes")({ component: AdminConfig });

type FieldType = "text" | "textarea" | "image";
type ImageSpec = {
  aspectRatio: string; // CSS aspect-ratio, e.g. "4/3", "1/1"
  recommended: string; // human size, e.g. "1536×1024"
  fit?: "cover" | "contain"; // default cover
};
type Field = { key: string; label: string; type: FieldType; image?: ImageSpec };
type Group = { id: string; label: string; fields: Field[] };

const GROUPS: Group[] = [
  {
    id: "hero", label: "Topo (Hero)", fields: [
      { key: "hero.badge", label: "Selo no topo", type: "text" },
      { key: "hero.title", label: "Título principal", type: "text" },
      { key: "hero.title_highlight", label: "Título — destaque colorido", type: "text" },
      { key: "hero.subtitle", label: "Subtítulo", type: "textarea" },
      { key: "hero.cta_primary", label: "Botão primário", type: "text" },
      { key: "hero.cta_secondary", label: "Botão secundário", type: "text" },
      { key: "hero.image", label: "Imagem do topo", type: "image", image: { aspectRatio: "4/3", recommended: "1536 × 1024 px (4:3)", fit: "cover" } },
      { key: "hero.stat1_value", label: "Stat 1 — valor", type: "text" },
      { key: "hero.stat1_label", label: "Stat 1 — texto", type: "text" },
      { key: "hero.stat2_value", label: "Stat 2 — valor", type: "text" },
      { key: "hero.stat2_label", label: "Stat 2 — texto", type: "text" },
      { key: "hero.stat3_value", label: "Stat 3 — valor", type: "text" },
      { key: "hero.stat3_label", label: "Stat 3 — texto", type: "text" },
    ],
  },
  {
    id: "campaigns", label: "Campanhas", fields: [
      { key: "campaigns.eyebrow", label: "Olho da seção", type: "text" },
      { key: "campaigns.title", label: "Título", type: "text" },
      { key: "campaigns.subtitle", label: "Subtítulo", type: "textarea" },
    ],
  },
  {
    id: "how", label: "Como funciona", fields: [
      { key: "how.eyebrow", label: "Olho da seção", type: "text" },
      { key: "how.title", label: "Título", type: "text" },
      { key: "how.step1_title", label: "Passo 1 — título", type: "text" },
      { key: "how.step1_desc", label: "Passo 1 — descrição", type: "textarea" },
      { key: "how.step2_title", label: "Passo 2 — título", type: "text" },
      { key: "how.step2_desc", label: "Passo 2 — descrição", type: "textarea" },
      { key: "how.step3_title", label: "Passo 3 — título", type: "text" },
      { key: "how.step3_desc", label: "Passo 3 — descrição", type: "textarea" },
      { key: "how.step4_title", label: "Passo 4 — título", type: "text" },
      { key: "how.step4_desc", label: "Passo 4 — descrição", type: "textarea" },
    ],
  },
  {
    id: "guarantee", label: "Garantia", fields: [
      { key: "guarantee.title", label: "Título", type: "text" },
      { key: "guarantee.title_highlight", label: "Título — destaque colorido", type: "text" },
      { key: "guarantee.point1", label: "Item 1", type: "text" },
      { key: "guarantee.point2", label: "Item 2", type: "text" },
      { key: "guarantee.point3", label: "Item 3", type: "text" },
      { key: "guarantee.point4", label: "Item 4", type: "text" },
    ],
  },
  {
    id: "social", label: "Depoimentos", fields: [
      { key: "social.eyebrow", label: "Olho da seção", type: "text" },
      { key: "social.title", label: "Título", type: "text" },
      { key: "social.t1_name", label: "Depoimento 1 — nome", type: "text" },
      { key: "social.t1_role", label: "Depoimento 1 — cidade", type: "text" },
      { key: "social.t1_text", label: "Depoimento 1 — texto", type: "textarea" },
      { key: "social.t2_name", label: "Depoimento 2 — nome", type: "text" },
      { key: "social.t2_role", label: "Depoimento 2 — cidade", type: "text" },
      { key: "social.t2_text", label: "Depoimento 2 — texto", type: "textarea" },
      { key: "social.t3_name", label: "Depoimento 3 — nome", type: "text" },
      { key: "social.t3_role", label: "Depoimento 3 — cidade", type: "text" },
      { key: "social.t3_text", label: "Depoimento 3 — texto", type: "textarea" },
      { key: "social.image1", label: "Imagem 1", type: "image", image: { aspectRatio: "1/1", recommended: "768 × 768 px (quadrada)", fit: "cover" } },
      { key: "social.image2", label: "Imagem 2", type: "image", image: { aspectRatio: "1/1", recommended: "768 × 768 px (quadrada)", fit: "cover" } },
      { key: "social.image3", label: "Imagem 3", type: "image", image: { aspectRatio: "1/1", recommended: "768 × 768 px (quadrada)", fit: "cover" } },
    ],
  },
  {
    id: "finalcta", label: "Chamada final", fields: [
      { key: "finalcta.title", label: "Título", type: "text" },
      { key: "finalcta.subtitle", label: "Subtítulo", type: "textarea" },
      { key: "finalcta.button", label: "Botão", type: "text" },
    ],
  },
  {
    id: "footer", label: "Rodapé", fields: [
      { key: "footer.copyright", label: "Linha de copyright", type: "text" },
      { key: "footer.logo", label: "Logo do rodapé", type: "image", image: { aspectRatio: "3/1", recommended: "PNG transparente, ~600 × 200 px", fit: "contain" } },
    ],
  },
];

const POS_SUFFIX = "_pos";
const ALL_KEYS = GROUPS.flatMap((g) =>
  g.fields.flatMap((f) => (f.type === "image" ? [f.key, f.key + POS_SUFFIX] : [f.key]))
);

const POSITIONS: { id: string; label: string; css: string }[] = [
  { id: "tl", label: "↖", css: "left top" },
  { id: "tc", label: "↑", css: "center top" },
  { id: "tr", label: "↗", css: "right top" },
  { id: "ml", label: "←", css: "left center" },
  { id: "mc", label: "•", css: "center center" },
  { id: "mr", label: "→", css: "right center" },
  { id: "bl", label: "↙", css: "left bottom" },
  { id: "bc", label: "↓", css: "center bottom" },
  { id: "br", label: "↘", css: "right bottom" },
];

function AdminConfig() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const invalidate = useInvalidateSiteSettings();

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from("site_settings").select("key,value").in("key", ALL_KEYS);
      if (error) { toast.error("Erro ao carregar configurações"); return; }
      const out: Record<string, string> = {};
      for (const r of data ?? []) out[r.key as string] = (r.value as string) ?? "";
      setValues(out);
    })();
  }, []);

  const setValue = (key: string, value: string) => setValues((v) => ({ ...v, [key]: value }));

  const save = async () => {
    setSaving(true);
    try {
      const rows = ALL_KEYS.map((k) => ({ key: k, value: values[k] ?? "" }));
      const { error } = await supabase.from("site_settings").upsert(rows, { onConflict: "key" });
      if (error) throw error;
      invalidate();
      toast.success("Configurações salvas. O site já está atualizado.");
    } catch (e: any) {
      toast.error("Erro ao salvar: " + (e?.message ?? "desconhecido"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Configurações do site</h1>
          <p className="text-sm text-muted-foreground">Edite textos e imagens da página inicial.</p>
        </div>
        <Button onClick={save} disabled={saving}><Save className="h-4 w-4 mr-2" /> {saving ? "Salvando..." : "Salvar tudo"}</Button>
      </div>
      <Tabs defaultValue={GROUPS[0].id} className="w-full">
        <TabsList className="flex flex-wrap h-auto">
          {GROUPS.map((g) => <TabsTrigger key={g.id} value={g.id}>{g.label}</TabsTrigger>)}
        </TabsList>
        {GROUPS.map((g) => (
          <TabsContent key={g.id} value={g.id} className="mt-4">
            <Card><CardContent className="p-5 space-y-4">
              {g.fields.map((f) => (
                <FieldRow key={f.key} field={f} value={values[f.key] ?? ""} onChange={(v) => setValue(f.key, v)} />
              ))}
            </CardContent></Card>
          </TabsContent>
        ))}
      </Tabs>
      <div className="flex justify-end">
        <Button onClick={save} disabled={saving}><Save className="h-4 w-4 mr-2" /> {saving ? "Salvando..." : "Salvar tudo"}</Button>
      </div>
    </div>
  );
}

function FieldRow({ field, value, onChange }: { field: Field; value: string; onChange: (v: string) => void }) {
  if (field.type === "image") return null; // handled separately to access position value
  if (field.type === "textarea") return (
    <div><Label>{field.label}</Label><Textarea rows={3} value={value} onChange={(e) => onChange(e.target.value)} /></div>
  );
  return (
    <div><Label>{field.label}</Label><Input value={value} onChange={(e) => onChange(e.target.value)} /></div>
  );
}

function ImageField({
  field,
  value,
  position,
  onChange,
  onChangePosition,
}: {
  field: Field;
  value: string;
  position: string;
  onChange: (v: string) => void;
  onChangePosition: (v: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const spec = field.image ?? { aspectRatio: "1/1", recommended: "", fit: "cover" as const };
  const fit = spec.fit ?? "cover";
  const currentPos = position || "center center";

  const onFile = async (file: File) => {
    setUploading(true);
    try {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${field.key.replace(/\./g, "-")}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("site-assets").upload(path, file, { upsert: true, contentType: file.type });
      if (error) throw error;
      const { data } = supabase.storage.from("site-assets").getPublicUrl(path);
      onChange(data.publicUrl);
      toast.success("Imagem enviada. Lembre-se de clicar em Salvar tudo.");
    } catch (e: any) {
      toast.error("Erro no upload: " + (e?.message ?? "desconhecido"));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <Label>{field.label}</Label>
      <p className="text-xs text-muted-foreground">
        Tamanho ideal: <span className="font-medium">{spec.recommended}</span>
        {fit === "cover" && " — imagens fora dessa proporção serão cortadas. Use o seletor abaixo para escolher qual parte aparece."}
      </p>
      <div className="grid gap-4 md:grid-cols-[260px_1fr]">
        {/* Live preview at the real site aspect ratio */}
        <div>
          <div className="text-xs font-medium mb-1">Prévia (como aparece no site)</div>
          <div
            className="w-full rounded-md border border-border bg-muted/50 overflow-hidden"
            style={{ aspectRatio: spec.aspectRatio }}
          >
            {value ? (
              <img
                src={value}
                alt={field.label}
                className="w-full h-full"
                style={{ objectFit: fit, objectPosition: currentPos }}
              />
            ) : (
              <div className="w-full h-full grid place-items-center text-xs text-muted-foreground">Sem imagem</div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <Input placeholder="URL da imagem" value={value} onChange={(e) => onChange(e.target.value)} />
          <div className="flex gap-2 flex-wrap">
            <Button type="button" size="sm" variant="outline" onClick={() => inputRef.current?.click()} disabled={uploading}>
              <Upload className="h-4 w-4 mr-1" /> {uploading ? "Enviando..." : "Enviar arquivo"}
            </Button>
            {value && <Button type="button" size="sm" variant="ghost" onClick={() => onChange("")}>Remover</Button>}
          </div>
          <input ref={inputRef} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />

          {fit === "cover" && value && (
            <div>
              <div className="text-xs font-medium mb-1">Posição do recorte</div>
              <div className="inline-grid grid-cols-3 gap-1 p-1 rounded-md border border-border bg-muted/30">
                {POSITIONS.map((p) => {
                  const active = currentPos === p.css;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => onChangePosition(p.css)}
                      className={
                        "h-9 w-9 rounded text-base leading-none grid place-items-center transition-colors " +
                        (active
                          ? "bg-primary text-primary-foreground"
                          : "bg-background hover:bg-muted text-muted-foreground")
                      }
                      aria-label={`Posição ${p.css}`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">Clique em um ponto para escolher qual parte da imagem fica visível.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}