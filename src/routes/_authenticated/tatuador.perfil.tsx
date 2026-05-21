import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useArtist } from "@/hooks/use-artist";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";

export const Route = createFileRoute("/_authenticated/tatuador/perfil")({ component: TatuadorPerfil });

function TatuadorPerfil() {
  const { application, artist, loading, reload } = useArtist();
  const [styles, setStyles] = useState<{ id: string; name: string }[]>([]);
  const [form, setForm] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.from("tattoo_styles").select("id,name").eq("is_active", true).order("sort_order")
      .then(({ data }) => setStyles(data ?? []));
  }, []);

  useEffect(() => {
    if (artist) {
      setForm({
        name: artist.name ?? "",
        photo_url: artist.photo_url ?? "",
        bio: artist.bio ?? "",
        styles: artist.styles ?? [],
        city: artist.city ?? "",
        state: artist.state ?? "",
        address: artist.address ?? "",
        instagram: artist.instagram ?? "",
        whatsapp: artist.whatsapp ?? "",
        is_active: artist.is_active,
      });
    }
  }, [artist]);

  if (loading) return <div className="grid place-items-center py-20 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>;

  if (!application || application.status !== "approved" || !artist || !form) {
    return (
      <Card><CardContent className="p-6 text-sm text-muted-foreground">
        Seu cadastro ainda não foi aprovado. Aguarde a aprovação para editar seu perfil público.
      </CardContent></Card>
    );
  }

  const toggleStyle = (s: string) => {
    setForm((f: any) => ({
      ...f,
      styles: f.styles.includes(s) ? f.styles.filter((x: string) => x !== s) : [...f.styles, s],
    }));
  };

  const upload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) { toast.error("Máx. 5MB."); return; }
    if (!file.type.startsWith("image/")) { toast.error("Envie uma imagem."); return; }
    setUploading(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      const uid = u.user?.id; if (!uid) return;
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${uid}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("tattoo-artists").upload(path, file);
      if (error) { toast.error("Erro no upload."); return; }
      const { data: pub } = supabase.storage.from("tattoo-artists").getPublicUrl(path);
      setForm((f: any) => ({ ...f, photo_url: pub.publicUrl }));
      toast.success("Foto enviada.");
    } finally { setUploading(false); }
  };

  const save = async () => {
    if (!form.name?.trim()) { toast.error("Nome é obrigatório."); return; }
    setSaving(true);
    const { error } = await supabase.from("tattoo_artists").update({
      name: form.name.trim(),
      photo_url: form.photo_url || null,
      bio: form.bio?.trim() || null,
      styles: form.styles,
      city: form.city?.trim() || null,
      state: form.state?.trim() || null,
      address: form.address?.trim() || null,
      instagram: form.instagram?.trim() || null,
      whatsapp: form.whatsapp?.trim() || null,
      is_active: form.is_active,
    }).eq("id", artist.id);
    setSaving(false);
    if (error) { toast.error("Erro ao salvar: " + error.message); return; }
    toast.success("Perfil atualizado.");
    reload();
  };

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">Meu perfil público</h1>
      <p className="text-sm text-muted-foreground">Estas informações aparecem na aba <strong>Tatuadores</strong> do site.</p>
      <Card><CardContent className="p-6 space-y-4">
        <div>
          <Label>Foto do tatuador</Label>
          <div className="flex items-center gap-3 mt-1">
            <div className="h-20 w-20 rounded-md bg-muted overflow-hidden shrink-0">
              {form.photo_url
                ? <img src={form.photo_url} alt="" className="h-full w-full object-cover" />
                : <div className="h-full w-full grid place-items-center text-xl text-muted-foreground">?</div>}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
            <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Upload className="h-4 w-4 mr-1" />}
              {form.photo_url ? "Trocar foto" : "Enviar foto"}
            </Button>
          </div>
        </div>
        <div><Label>Nome artístico *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Instagram (@)</Label><Input placeholder="@seu_perfil" value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} /></div>
          <div><Label>WhatsApp</Label><Input placeholder="11999999999" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Cidade</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
          <div><Label>Estado (UF)</Label><Input maxLength={2} value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value.toUpperCase() })} /></div>
        </div>
        <div><Label>Endereço do estúdio</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
        <div>
          <Label>Especialidades (selecione todos os estilos que você trabalha)</Label>
          <div className="mt-2 grid grid-cols-2 gap-1.5 max-h-64 overflow-y-auto rounded-md border border-border p-2">
            {styles.map((s) => {
              const checked = form.styles.includes(s.name);
              return (
                <label key={s.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 rounded px-1 py-0.5">
                  <input type="checkbox" checked={checked} onChange={() => toggleStyle(s.name)} />
                  <span className="truncate">{s.name}</span>
                </label>
              );
            })}
            {styles.length === 0 && <p className="text-xs text-muted-foreground p-2">Nenhum estilo disponível.</p>}
          </div>
        </div>
        <div><Label>Bio (opcional)</Label><Textarea rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} /></div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
          Exibir meu perfil na vitrine pública
        </label>
        <Button onClick={save} disabled={saving} className="w-full">
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Salvar perfil
        </Button>
      </CardContent></Card>
    </div>
  );
}