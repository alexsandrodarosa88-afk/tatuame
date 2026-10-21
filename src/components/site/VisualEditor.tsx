import { useEffect, useRef, useState } from "react";
import { ArrowUp, ArrowDown, AlignLeft, AlignCenter, AlignRight, Bold, RotateCcw, MousePointer2, Eye, CornerLeftUp, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { VISUAL_FONTS, type VisualElement } from "@/lib/visual-editor";
import type { SiteSettings } from "@/lib/db";
import { db } from "@/lib/db";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Selection = { path: string; selector: string; tag: string; text: string | null; image: string | null; size: number; parent?: string; siblings: { selector: string; label: string }[] };
export function VisualEditor({ settings, onChange }: { settings: SiteSettings; onChange: (settings: SiteSettings) => void }) {
  const iframe = useRef<HTMLIFrameElement>(null);
  const current = useRef(settings);
  current.current = settings;
  const [path, setPath] = useState("/");
  const [selection, setSelection] = useState<Selection | null>(null);
  const [editing, setEditing] = useState(true);
  const [campaigns, setCampaigns] = useState<{ id: string; title: string }[]>([]);
  const [sections, setSections] = useState<{ selector: string; label: string }[]>([]);
  const send = (data: object) => iframe.current?.contentWindow?.postMessage(data, window.location.origin);
  useEffect(() => {
    db.from("campaigns").select("id,title").in("status", ["ativa", "encerrada"]).then(({ data }: { data: typeof campaigns }) => setCampaigns(data ?? []));
    const receive = (event: MessageEvent) => {
      if (event.origin !== location.origin || event.source !== iframe.current?.contentWindow) return;
      if (event.data?.type === "visual-selected") setSelection(event.data);
      if (event.data?.type === "visual-ready") {
        setSections(event.data.sections ?? []);
        send({ type: "visual-draft", values: current.current.visual?.[event.data.path] ?? {} });
      }
    };
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, []);
  useEffect(() => { send({ type: "visual-draft", values: settings.visual?.[path] ?? {} }); }, [settings.visual, path]);
  const value: VisualElement = selection ? settings.visual?.[path]?.[selection.selector] ?? {} : {};
  const update = (changes: Partial<VisualElement>) => {
    if (!selection) return;
    onChange({ ...settings, visual: { ...settings.visual, [path]: { ...settings.visual?.[path], [selection.selector]: { ...value, ...changes } } } });
  };
  const reorder = (direction: -1 | 1) => {
    if (!selection) return;
    const items = [...selection.siblings].sort((a, b) => (settings.visual?.[path]?.[a.selector]?.order ?? 0) - (settings.visual?.[path]?.[b.selector]?.order ?? 0));
    const index = items.findIndex((item) => item.selector === selection.selector);
    const next = index + direction;
    if (index < 0 || next < 0 || next >= items.length) return;
    [items[index], items[next]] = [items[next], items[index]];
    const values = { ...settings.visual?.[path] };
    items.forEach((item, index) => { values[item.selector] = { ...values[item.selector], order: index }; });
    onChange({ ...settings, visual: { ...settings.visual, [path]: values } });
  };
  const upload = async (file: File) => {
    const filename = `site/visual-${crypto.randomUUID()}-${file.name.replace(/[^\w.]/g, "")}`;
    const { error } = await supabase.storage.from("site-images").upload(filename, file);
    if (error) return toast.error("Não foi possível enviar a foto");
    const { data } = await supabase.storage.from("site-images").createSignedUrl(filename, 60 * 60 * 24 * 365 * 10);
    if (data?.signedUrl) update({ image: data.signedUrl });
  };
  return <section className="space-y-4 border-y py-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl">Editor visual</h2><Button variant="outline" size="sm" onClick={() => { setEditing(!editing); send({ type: "visual-mode", editing: !editing }); }}>{editing ? <Eye className="mr-2 h-4 w-4" /> : <MousePointer2 className="mr-2 h-4 w-4" />}{editing ? "Navegar" : "Selecionar"}</Button></div>
    <div className="flex flex-wrap gap-3">
      <select aria-label="Página para editar" value={path} onChange={(e) => { setPath(e.target.value); setSelection(null); setSections([]); setEditing(true); }} className="h-10 max-w-full rounded-md border bg-background px-3 text-sm">
        <option value="/">Página inicial</option><option value="/sorteios">Resultados</option><option value="/seja-artista">Seja um artista</option><option value="/cadastro">Cadastro do cliente</option><option value="/login">Entrar</option><option value="/conta">Minha conta</option>
        {campaigns.map((c) => <option key={c.id} value={`/campanha/${c.id}`}>Sorteio: {c.title}</option>)}
      </select>
      <select aria-label="Selecionar seção" value="" onChange={(e) => send({ type: "visual-select", selector: e.target.value })} className="h-10 max-w-full rounded-md border bg-background px-3 text-sm"><option value="">Selecionar seção…</option>{sections.map((item) => <option key={item.selector} value={item.selector}>{item.label}</option>)}</select>
    </div>
    <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_250px]">
      <iframe ref={iframe} title="Prévia do editor visual" src={`${path}?visualEditor=1`} className="h-[760px] w-full rounded-md border bg-background" />
      <div className="space-y-4 xl:sticky xl:top-4">
        {!selection ? <p className="text-sm text-muted-foreground">Nenhum elemento selecionado</p> : <>
          <div className="flex items-center justify-between gap-2"><h3 className="text-lg">{selection.tag === "img" ? "Imagem" : selection.tag === "section" ? "Seção" : "Elemento selecionado"}</h3><Button size="icon" variant="ghost" title="Selecionar bloco acima" aria-label="Selecionar bloco acima" onClick={() => selection.parent && send({ type: "visual-select", selector: `[data-visual-id="${selection.parent}"]` })}><CornerLeftUp className="h-4 w-4" /></Button></div>
          {selection.text !== null && <div className="space-y-2"><Label htmlFor="visual-text">Texto</Label><Textarea id="visual-text" value={value.text ?? selection.text} onChange={(e) => update({ text: e.target.value })} /></div>}
          {selection.image !== null && <div className="space-y-2"><Label htmlFor="visual-image">Foto</Label><Input id="visual-image" value={value.image ?? selection.image} onChange={(e) => update({ image: e.target.value })} /><Button asChild variant="outline" size="sm"><label><Upload className="mr-2 h-4 w-4" />Trocar foto<input type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) upload(file); }} /></label></Button></div>}
          <div className="space-y-2"><Label htmlFor="visual-font">Fonte</Label><select id="visual-font" value={value.font ?? "original"} onChange={(e) => update({ font: e.target.value as keyof typeof VISUAL_FONTS })} className="h-10 w-full rounded-md border bg-background px-2 text-sm">{Object.keys(VISUAL_FONTS).map((font) => <option key={font} value={font}>{font === "original" ? "Original" : font.charAt(0).toUpperCase() + font.slice(1)}</option>)}</select></div>
          <div className="grid grid-cols-2 gap-3"><div className="space-y-2"><Label htmlFor="visual-size">Tamanho</Label><Input id="visual-size" type="number" min={8} max={96} value={value.size ?? selection.size} onChange={(e) => update({ size: Number(e.target.value) })} /></div><div className="space-y-2"><Label htmlFor="visual-spacing">Espaçamento</Label><Input id="visual-spacing" type="number" min={0} max={120} value={value.spacing ?? 0} onChange={(e) => update({ spacing: Number(e.target.value) })} /></div></div>
          <div className="flex flex-wrap gap-2">{([["left", AlignLeft, "Alinhar à esquerda"], ["center", AlignCenter, "Centralizar"], ["right", AlignRight, "Alinhar à direita"]] as const).map(([align, Icon, title]) => <Button key={align} size="icon" variant={value.align === align ? "default" : "outline"} aria-label={title} title={title} onClick={() => update({ align })}><Icon className="h-4 w-4" /></Button>)}<Button size="icon" variant={value.weight === 700 ? "default" : "outline"} aria-label="Negrito" title="Negrito" onClick={() => update({ weight: value.weight === 700 ? undefined : 700 })}><Bold className="h-4 w-4" /></Button></div>
          <div className="flex gap-4"><Label className="space-y-2">Cor do texto<input type="color" aria-label="Cor do texto selecionado" value={value.color ?? "#2a2622"} onChange={(e) => update({ color: e.target.value })} className="block h-9 w-12 rounded border" /></Label><Label className="space-y-2">Cor de fundo<input type="color" aria-label="Cor de fundo selecionado" value={value.background ?? "#ffffff"} onChange={(e) => update({ background: e.target.value })} className="block h-9 w-12 rounded border" /></Label></div>
          <div className="space-y-2"><Label>Posição</Label><div className="flex gap-2"><Button size="icon" variant="outline" title="Mover antes" aria-label="Mover antes" onClick={() => reorder(-1)}><ArrowUp className="h-4 w-4" /></Button><Button size="icon" variant="outline" title="Mover depois" aria-label="Mover depois" onClick={() => reorder(1)}><ArrowDown className="h-4 w-4" /></Button></div></div>
          <Button size="sm" variant="outline" onClick={() => { const values = { ...settings.visual?.[path] }; delete values[selection.selector]; onChange({ ...settings, visual: { ...settings.visual, [path]: values } }); }}><RotateCcw className="mr-2 h-4 w-4" />Restaurar elemento</Button>
        </>}
      </div>
    </div>
  </section>;
}