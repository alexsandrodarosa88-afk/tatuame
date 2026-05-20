import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Pencil, Plus, Trash2, Power } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/tatuadores")({ component: AdminTatuadores });

type Artist = {
  id: string; name: string; photo_url: string | null; bio: string | null;
  styles: string[]; city: string | null; state: string | null; address: string | null;
  instagram: string | null; whatsapp: string | null; is_active: boolean;
};

const empty = { name: "", photo_url: "", bio: "", styles: "", city: "", state: "", address: "", instagram: "", whatsapp: "", is_active: true };

function AdminTatuadores() {
  const [rows, setRows] = useState<Artist[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Artist | null>(null);
  const [form, setForm] = useState<any>(empty);

  const load = async () => {
    const { data } = await supabase.from("tattoo_artists").select("*").order("name");
    if (data) setRows(data as Artist[]);
  };
  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (a: Artist) => {
    setEditing(a);
    setForm({
      name: a.name, photo_url: a.photo_url ?? "", bio: a.bio ?? "",
      styles: (a.styles ?? []).join(", "), city: a.city ?? "", state: a.state ?? "",
      address: a.address ?? "", instagram: a.instagram ?? "", whatsapp: a.whatsapp ?? "",
      is_active: a.is_active,
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.name?.trim()) { toast.error("Nome é obrigatório."); return; }
    const payload = {
      name: form.name.trim(),
      photo_url: form.photo_url?.trim() || null,
      bio: form.bio?.trim() || null,
      styles: form.styles.split(",").map((s: string) => s.trim()).filter(Boolean),
      city: form.city?.trim() || null,
      state: form.state?.trim() || null,
      address: form.address?.trim() || null,
      instagram: form.instagram?.trim() || null,
      whatsapp: form.whatsapp?.trim() || null,
      is_active: !!form.is_active,
    };
    const { error } = editing
      ? await supabase.from("tattoo_artists").update(payload).eq("id", editing.id)
      : await supabase.from("tattoo_artists").insert(payload as any);
    if (error) { toast.error("Erro ao salvar tatuador."); return; }
    toast.success(editing ? "Tatuador atualizado." : "Tatuador adicionado.");
    setOpen(false); load();
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir este tatuador?")) return;
    const { error } = await supabase.from("tattoo_artists").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir."); return; }
    toast.success("Excluído."); load();
  };

  const toggleActive = async (a: Artist) => {
    await supabase.from("tattoo_artists").update({ is_active: !a.is_active }).eq("id", a.id);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tatuadores ({rows.length})</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Novo tatuador</Button></DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editing ? "Editar tatuador" : "Novo tatuador"}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Nome *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>URL da foto</Label><Input placeholder="https://..." value={form.photo_url} onChange={(e) => setForm({ ...form, photo_url: e.target.value })} /></div>
              <div><Label>Estilos (separados por vírgula)</Label><Input placeholder="Realismo, Blackwork, Old School" value={form.styles} onChange={(e) => setForm({ ...form, styles: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Cidade</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
                <div><Label>Estado (UF)</Label><Input maxLength={2} value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value.toUpperCase() })} /></div>
              </div>
              <div><Label>Endereço</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Instagram (@)</Label><Input placeholder="@tatuador" value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} /></div>
                <div><Label>WhatsApp</Label><Input placeholder="11999999999" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} /></div>
              </div>
              <div><Label>Bio</Label><Textarea rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} /></div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
                Ativo (exibir no site)
              </label>
              <Button onClick={save} className="w-full">{editing ? "Salvar" : "Adicionar"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((a) => (
          <Card key={a.id} className={a.is_active ? "" : "opacity-60"}>
            <CardContent className="p-3 flex gap-3">
              <div className="h-16 w-16 rounded-md bg-muted overflow-hidden shrink-0">
                {a.photo_url ? <img src={a.photo_url} alt={a.name} className="h-full w-full object-cover" /> : <div className="h-full w-full grid place-items-center text-xl">{a.name.charAt(0)}</div>}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold truncate">{a.name}</h3>
                <p className="text-xs text-muted-foreground truncate">{(a.styles ?? []).join(" • ") || "—"}</p>
                <p className="text-xs text-muted-foreground truncate">{[a.city, a.state].filter(Boolean).join("/") || "—"}</p>
                <div className="flex gap-1 mt-1">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(a)}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => toggleActive(a)}><Power className="h-3.5 w-3.5" /></Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => remove(a.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {rows.length === 0 && <p className="text-muted-foreground text-center py-10 col-span-full">Nenhum tatuador cadastrado.</p>}
      </div>
    </div>
  );
}