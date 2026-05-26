import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Pencil, Plus, Trash2, Power, Upload, Loader2, ShieldCheck, Gift, FileText, KeyRound, UserX, UserPlus } from "lucide-react";
import { UserAcceptancesDialog } from "@/components/admin/UserAcceptancesDialog";
import { useServerFn } from "@tanstack/react-start";
import { adminUpdateUserPassword, adminDeleteUser, adminCreateArtistAccount } from "@/lib/admin-users.functions";

export const Route = createFileRoute("/_authenticated/admin/tatuadores")({ component: AdminTatuadores });

type Artist = {
  id: string; name: string; photo_url: string | null; bio: string | null;
  styles: string[]; city: string | null; state: string | null; address: string | null;
  instagram: string | null; whatsapp: string | null; is_active: boolean;
  subscription_status?: string | null; is_lifetime_free?: boolean | null;
  user_id?: string | null;
};

type SubInfo = { last_paid_at: string | null; last_amount: number | null; next_due: string | null };

const empty = {
  name: "", photo_url: "", bio: "", styles: [] as string[],
  city: "", state: "", address: "", instagram: "", whatsapp: "", is_active: true,
};

function AdminTatuadores() {
  const [rows, setRows] = useState<Artist[]>([]);
  const [subs, setSubs] = useState<Record<string, SubInfo>>({});
  const [styles, setStyles] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Artist | null>(null);
  const [form, setForm] = useState<any>(empty);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [acceptUser, setAcceptUser] = useState<{ userId: string; name: string } | null>(null);
  const [pwdArtist, setPwdArtist] = useState<Artist | null>(null);
  const [pwd, setPwd] = useState("");
  const [pwdSaving, setPwdSaving] = useState(false);
  const updatePwd = useServerFn(adminUpdateUserPassword);
  const deleteUserFn = useServerFn(adminDeleteUser);
  const createArtistAccountFn = useServerFn(adminCreateArtistAccount);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<any>({
    email: "", password: "", fullName: "", cpf: "", phone: "",
    cidade: "", address: "", instagram: "", grantFreeMonth: false,
  });
  const [creating, setCreating] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("tattoo_artists").select("*").order("name");
    if (data) {
      setRows(data as Artist[]);
      const ids = (data as Artist[]).map((a) => a.id);
      if (ids.length) {
        const { data: sub } = await supabase
          .from("artist_subscriptions")
          .select("artist_id, paid_at, amount, due_date, status")
          .in("artist_id", ids)
          .eq("status", "paid")
          .order("paid_at", { ascending: false });
        const map: Record<string, SubInfo> = {};
        (sub ?? []).forEach((s: any) => {
          if (!map[s.artist_id]) map[s.artist_id] = { last_paid_at: s.paid_at, last_amount: Number(s.amount), next_due: s.due_date };
        });
        setSubs(map);
      }
    }
  };
  useEffect(() => {
    load();
    supabase.from("tattoo_styles").select("name").eq("is_active", true).order("sort_order")
      .then(({ data }) => setStyles((data ?? []).map((s: any) => s.name)));
  }, []);

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (a: Artist) => {
    setEditing(a);
    setForm({
      name: a.name, photo_url: a.photo_url ?? "", bio: a.bio ?? "",
      styles: a.styles ?? [], city: a.city ?? "", state: a.state ?? "",
      address: a.address ?? "", instagram: a.instagram ?? "", whatsapp: a.whatsapp ?? "",
      is_active: a.is_active,
    });
    setOpen(true);
  };

  const toggleStyle = (s: string) => {
    setForm((f: any) => ({
      ...f,
      styles: f.styles.includes(s) ? f.styles.filter((x: string) => x !== s) : [...f.styles, s],
    }));
  };

  const handlePhotoUpload = async (file: File) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Imagem máx. 5MB."); return; }
    if (!file.type.startsWith("image/")) { toast.error("Envie uma imagem."); return; }
    setUploading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) { toast.error("Sessão expirada."); return; }
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${uid}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("tattoo-artists").upload(path, file, { upsert: false });
      if (upErr) { toast.error("Erro ao enviar foto."); return; }
      const { data: pub } = supabase.storage.from("tattoo-artists").getPublicUrl(path);
      setForm((f: any) => ({ ...f, photo_url: pub.publicUrl }));
      toast.success("Foto enviada.");
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!form.name?.trim()) { toast.error("Nome é obrigatório."); return; }
    const payload = {
      name: form.name.trim(),
      photo_url: form.photo_url?.trim() || null,
      bio: form.bio?.trim() || null,
      styles: Array.isArray(form.styles) ? form.styles : [],
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

  const removeUserAccount = async (a: Artist) => {
    if (!a.user_id) { toast.error("Sem conta de usuário vinculada."); return; }
    if (!confirm(`Excluir definitivamente a conta de ${a.name}? Isto remove o login, perfil e cadastro de tatuador. Esta ação não pode ser desfeita.`)) return;
    try {
      await deleteUserFn({ data: { userId: a.user_id } });
      toast.success("Conta excluída.");
      load();
    } catch (e: any) {
      toast.error(e.message || "Erro ao excluir conta.");
    }
  };

  const savePwd = async () => {
    if (!pwdArtist?.user_id) return;
    if (pwd.length < 6) { toast.error("Senha deve ter pelo menos 6 caracteres."); return; }
    setPwdSaving(true);
    try {
      await updatePwd({ data: { userId: pwdArtist.user_id, newPassword: pwd } });
      toast.success("Senha redefinida.");
      setPwdArtist(null); setPwd("");
    } catch (e: any) {
      toast.error(e.message || "Erro.");
    } finally { setPwdSaving(false); }
  };

  const toggleActive = async (a: Artist) => {
    await supabase.from("tattoo_artists").update({ is_active: !a.is_active }).eq("id", a.id);
    load();
  };

  const unblock = async (a: Artist) => {
    if (!confirm(`Desbloquear ${a.name}? Faturas pendentes atrasadas serão canceladas e ele poderá gerar nova mensalidade.`)) return;
    const { error } = await supabase.rpc("admin_unblock_artist", { _artist_id: a.id });
    if (error) { toast.error("Erro ao desbloquear: " + error.message); return; }
    toast.success("Tatuador desbloqueado.");
    load();
  };

  const toggleLifetime = async (a: Artist) => {
    const next = !a.is_lifetime_free;
    const patch: any = { is_lifetime_free: next };
    if (next) patch.subscription_status = "active";
    const { error } = await supabase.from("tattoo_artists").update(patch).eq("id", a.id);
    if (error) { toast.error("Erro: " + error.message); return; }
    toast.success(next ? "Marcado como vitalício gratuito." : "Vitalício removido.");
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tatuadores ({rows.length})</h1>
        <div className="flex gap-2">
        <Button variant="outline" onClick={() => setCreateOpen(true)}>
          <UserPlus className="h-4 w-4 mr-1" /> Criar conta de tatuador
        </Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Novo tatuador</Button></DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editing ? "Editar tatuador" : "Novo tatuador"}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Nome *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div>
                <Label>Foto do tatuador</Label>
                <div className="flex items-center gap-3 mt-1">
                  <div className="h-16 w-16 rounded-md bg-muted overflow-hidden shrink-0">
                    {form.photo_url ? (
                      <img src={form.photo_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full grid place-items-center text-xl text-muted-foreground">?</div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handlePhotoUpload(e.target.files[0])}
                  />
                  <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                    {uploading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Upload className="h-4 w-4 mr-1" />}
                    {form.photo_url ? "Trocar foto" : "Enviar foto"}
                  </Button>
                </div>
              </div>
              <div>
                <Label>Estilos (selecione os que domina)</Label>
                <div className="mt-2 grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto rounded-md border border-border p-2">
                  {styles.map((s) => {
                    const checked = form.styles.includes(s);
                    return (
                      <label key={s} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 rounded px-1 py-0.5">
                        <input type="checkbox" checked={checked} onChange={() => toggleStyle(s)} />
                        <span className="truncate">{s}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
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
                <div className="flex flex-wrap gap-1 mt-1">
                  {a.is_lifetime_free && <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/15 text-green-600 dark:text-green-400 font-medium">Vitalício</span>}
                  {a.subscription_status === "blocked" && <span className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/15 text-destructive font-medium">Bloqueado</span>}
                  {a.subscription_status === "active" && !a.is_lifetime_free && <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/15 text-primary font-medium">Ativo</span>}
                  {subs[a.id]?.last_paid_at && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-medium" title={`R$ ${subs[a.id].last_amount?.toFixed(2)}`}>
                      Mensalidade paga {new Date(subs[a.id].last_paid_at!).toLocaleDateString("pt-BR")}
                    </span>
                  )}
                  {!subs[a.id]?.last_paid_at && !a.is_lifetime_free && a.subscription_status === "active" && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-medium">
                      Mês grátis até {a.subscription_next_due ? new Date(a.subscription_next_due).toLocaleDateString("pt-BR") : ""}
                    </span>
                  )}
                  {!subs[a.id]?.last_paid_at && !a.is_lifetime_free && a.subscription_status !== "active" && a.subscription_status !== "blocked" && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 font-medium">
                      Sem pagamento
                    </span>
                  )}
                </div>
                <div className="flex gap-1 mt-1">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(a)}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => toggleActive(a)}><Power className="h-3.5 w-3.5" /></Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" title={a.is_lifetime_free ? "Remover vitalício" : "Marcar vitalício gratuito"} onClick={() => toggleLifetime(a)}>
                    <Gift className={`h-3.5 w-3.5 ${a.is_lifetime_free ? "text-green-500" : ""}`} />
                  </Button>
                  {a.subscription_status === "blocked" && (
                    <Button size="icon" variant="ghost" className="h-7 w-7" title="Desbloquear" onClick={() => unblock(a)}>
                      <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                    </Button>
                  )}
                  {a.user_id && (
                    <Button size="icon" variant="ghost" className="h-7 w-7" title="Ver termos aceitos" onClick={() => setAcceptUser({ userId: a.user_id!, name: a.name })}>
                      <FileText className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  {a.user_id && (
                    <Button size="icon" variant="ghost" className="h-7 w-7" title="Redefinir senha" onClick={() => setPwdArtist(a)}>
                      <KeyRound className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  {a.user_id && (
                    <Button size="icon" variant="ghost" className="h-7 w-7" title="Excluir conta de usuário" onClick={() => removeUserAccount(a)}>
                      <UserX className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  )}
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => remove(a.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {rows.length === 0 && <p className="text-muted-foreground text-center py-10 col-span-full">Nenhum tatuador cadastrado.</p>}
      </div>
      <UserAcceptancesDialog
        open={!!acceptUser}
        onOpenChange={(v) => !v && setAcceptUser(null)}
        userId={acceptUser?.userId ?? null}
        userName={acceptUser?.name}
      />
      <Dialog open={!!pwdArtist} onOpenChange={(v) => { if (!v) { setPwdArtist(null); setPwd(""); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Redefinir senha</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">{pwdArtist?.name}</p>
            <div><Label>Nova senha</Label><Input type="text" value={pwd} onChange={(e) => setPwd(e.target.value)} placeholder="Mínimo 6 caracteres" /></div>
            <Button className="w-full" disabled={pwdSaving} onClick={savePwd}>{pwdSaving ? "Salvando..." : "Redefinir senha"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Criar conta de tatuador</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              A conta é criada já aprovada. No primeiro acesso, o tatuador será obrigado a definir uma senha pessoal.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2"><Label>Nome completo *</Label><Input value={createForm.fullName} onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })} /></div>
              <div><Label>Email (login) *</Label><Input type="email" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} /></div>
              <div><Label>Senha temporária *</Label><Input type="text" value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} placeholder="mín. 6 caracteres" /></div>
              <div><Label>CPF</Label><Input value={createForm.cpf} onChange={(e) => setCreateForm({ ...createForm, cpf: e.target.value })} /></div>
              <div><Label>Telefone / WhatsApp</Label><Input value={createForm.phone} onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })} /></div>
              <div><Label>Cidade</Label><Input value={createForm.cidade} onChange={(e) => setCreateForm({ ...createForm, cidade: e.target.value })} /></div>
              <div><Label>Instagram</Label><Input value={createForm.instagram} onChange={(e) => setCreateForm({ ...createForm, instagram: e.target.value })} placeholder="@tatuador" /></div>
              <div className="md:col-span-2"><Label>Endereço do estúdio</Label><Input value={createForm.address} onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })} /></div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={createForm.grantFreeMonth} onChange={(e) => setCreateForm({ ...createForm, grantFreeMonth: e.target.checked })} />
              Conceder 1 mês de mensalidade grátis
            </label>
            <Button
              className="w-full"
              disabled={creating}
              onClick={async () => {
                if (!createForm.email || !createForm.password || !createForm.fullName) { toast.error("Preencha nome, email e senha."); return; }
                if (String(createForm.password).length < 6) { toast.error("Senha mínima de 6 caracteres."); return; }
                setCreating(true);
                try {
                  await createArtistAccountFn({ data: createForm });
                  toast.success("Conta de tatuador criada. Envie o login e a senha temporária para o tatuador.");
                  setCreateOpen(false);
                  setCreateForm({ email: "", password: "", fullName: "", cpf: "", phone: "", cidade: "", address: "", instagram: "", grantFreeMonth: false });
                  load();
                } catch (e: any) {
                  toast.error(e.message || "Erro ao criar conta.");
                } finally { setCreating(false); }
              }}
            >
              {creating ? "Criando..." : "Criar conta de tatuador"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}