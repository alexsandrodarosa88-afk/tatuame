import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useServerFn } from "@tanstack/react-start";
import { adminGetUserAcceptances } from "@/lib/policy.functions";
import { adminUpdateUserPassword, adminDeleteUser, adminUpdateProfile, adminConvertToArtist } from "@/lib/admin-users.functions";
import { FileText, X, Pencil, Trash2, KeyRound, Brush } from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/admin/clientes")({ component: AdminClientes });

type Profile = { id: string; email: string | null; nome_completo: string | null; telefone: string | null; cpf: string | null; cidade: string | null; created_at: string };

function AdminClientes() {
  const [rows, setRows] = useState<Profile[]>([]);
  const [q, setQ] = useState("");
  const [viewing, setViewing] = useState<Profile | null>(null);
  const [acceptances, setAcceptances] = useState<any[] | null>(null);
  const [loadingAcc, setLoadingAcc] = useState(false);
  const getAcc = useServerFn(adminGetUserAcceptances);
  const updatePwd = useServerFn(adminUpdateUserPassword);
  const deleteUser = useServerFn(adminDeleteUser);
  const updateProfile = useServerFn(adminUpdateProfile);
  const convertToArtist = useServerFn(adminConvertToArtist);
  const [editing, setEditing] = useState<Profile | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [pwdUser, setPwdUser] = useState<Profile | null>(null);
  const [pwd, setPwd] = useState("");
  const [saving, setSaving] = useState(false);
  const [convertUser, setConvertUser] = useState<Profile | null>(null);
  const [convertForm, setConvertForm] = useState<any>({ address: "", instagram: "", phone: "", cpf: "", grantFreeMonth: false });

  const load = async () => {
    const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(1000);
    if (data) setRows(data as Profile[]);
  };
  useEffect(() => { load(); }, []);

  const openEdit = (p: Profile) => {
    setEditing(p);
    setEditForm({
      email: p.email ?? "",
      nome_completo: p.nome_completo ?? "",
      telefone: p.telefone ?? "",
      cpf: p.cpf ?? "",
      cidade: p.cidade ?? "",
    });
  };

  const saveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await updateProfile({ data: { userId: editing.id, ...editForm } });
      toast.success("Cliente atualizado.");
      setEditing(null);
      load();
    } catch (e: any) {
      toast.error(e.message || "Erro ao atualizar.");
    } finally { setSaving(false); }
  };

  const savePwd = async () => {
    if (!pwdUser) return;
    if (pwd.length < 6) { toast.error("Senha deve ter pelo menos 6 caracteres."); return; }
    setSaving(true);
    try {
      await updatePwd({ data: { userId: pwdUser.id, newPassword: pwd } });
      toast.success("Senha redefinida.");
      setPwdUser(null); setPwd("");
    } catch (e: any) {
      toast.error(e.message || "Erro.");
    } finally { setSaving(false); }
  };

  const removeUser = async (p: Profile) => {
    if (!confirm(`Excluir definitivamente o cliente ${p.nome_completo || p.email}? Esta ação não pode ser desfeita.`)) return;
    try {
      await deleteUser({ data: { userId: p.id } });
      toast.success("Cliente excluído.");
      load();
    } catch (e: any) {
      toast.error(e.message || "Erro ao excluir.");
    }
  };

  const openConvert = (p: Profile) => {
    setConvertUser(p);
    setConvertForm({
      address: "",
      instagram: "",
      phone: p.telefone ?? "",
      cpf: p.cpf ?? "",
      grantFreeMonth: false,
    });
  };

  const saveConvert = async () => {
    if (!convertUser) return;
    setSaving(true);
    try {
      await convertToArtist({ data: {
        userId: convertUser.id,
        fullName: convertUser.nome_completo ?? undefined,
        address: convertForm.address,
        instagram: convertForm.instagram || null,
        phone: convertForm.phone || null,
        cpf: convertForm.cpf,
        grantFreeMonth: !!convertForm.grantFreeMonth,
      } });
      toast.success("Cliente convertido em tatuador aprovado.");
      setConvertUser(null);
      load();
    } catch (e: any) {
      toast.error(e.message || "Erro ao converter.");
    } finally { setSaving(false); }
  };

  async function openAcceptances(p: Profile) {
    setViewing(p);
    setAcceptances(null);
    setLoadingAcc(true);
    try {
      const data = await getAcc({ data: { userId: p.id } });
      setAcceptances(data as any[]);
    } finally {
      setLoadingAcc(false);
    }
  }

  const filtered = rows.filter((r) => {
    if (!q) return true;
    const t = q.toLowerCase();
    return [r.email, r.nome_completo, r.telefone, r.cpf, r.cidade].some((v) => v?.toLowerCase().includes(t));
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Clientes ({rows.length})</h1>
        <Input placeholder="Buscar..." value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
      </div>
      <div className="rounded-lg border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase">
            <tr>
              <th className="text-left p-3">Nome</th>
              <th className="text-left p-3">Email</th>
              <th className="text-left p-3">Telefone</th>
              <th className="text-left p-3">CPF</th>
              <th className="text-left p-3">Cidade</th>
              <th className="text-left p-3">Cadastrado</th>
              <th className="text-left p-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className="p-3">{r.nome_completo || "—"}</td>
                <td className="p-3">{r.email || "—"}</td>
                <td className="p-3">{r.telefone || "—"}</td>
                <td className="p-3">{r.cpf || "—"}</td>
                <td className="p-3">{r.cidade || "—"}</td>
                <td className="p-3 text-muted-foreground">{new Date(r.created_at).toLocaleDateString("pt-BR")}</td>
                <td className="p-3">
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" title="Editar" onClick={() => openEdit(r)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" title="Redefinir senha" onClick={() => setPwdUser(r)}>
                      <KeyRound className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" title="Converter em tatuador" onClick={() => openConvert(r)}>
                      <Brush className="h-3.5 w-3.5 text-primary" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" title="Ver aceites" onClick={() => openAcceptances(r)}>
                      <FileText className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" title="Excluir" onClick={() => removeUser(r)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">Nenhum cliente.</td></tr>}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 z-[100] bg-background/90 backdrop-blur-sm grid place-items-center p-4" onClick={() => setEditing(null)}>
          <div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h2 className="font-bold">Editar cliente</h2>
              <Button variant="ghost" size="sm" onClick={() => setEditing(null)}><X className="h-4 w-4" /></Button>
            </div>
            <div className="p-5 space-y-3">
              <div><Label>Nome completo</Label><Input value={editForm.nome_completo} onChange={(e) => setEditForm({ ...editForm, nome_completo: e.target.value })} /></div>
              <div><Label>Email (login)</Label><Input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} /></div>
              <div><Label>Telefone</Label><Input value={editForm.telefone} onChange={(e) => setEditForm({ ...editForm, telefone: e.target.value })} /></div>
              <div><Label>CPF</Label><Input value={editForm.cpf} onChange={(e) => setEditForm({ ...editForm, cpf: e.target.value })} /></div>
              <div><Label>Cidade</Label><Input value={editForm.cidade} onChange={(e) => setEditForm({ ...editForm, cidade: e.target.value })} /></div>
              <Button className="w-full" disabled={saving} onClick={saveEdit}>{saving ? "Salvando..." : "Salvar"}</Button>
            </div>
          </div>
        </div>
      )}

      {pwdUser && (
        <div className="fixed inset-0 z-[100] bg-background/90 backdrop-blur-sm grid place-items-center p-4" onClick={() => { setPwdUser(null); setPwd(""); }}>
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h2 className="font-bold">Redefinir senha</h2>
              <Button variant="ghost" size="sm" onClick={() => { setPwdUser(null); setPwd(""); }}><X className="h-4 w-4" /></Button>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-xs text-muted-foreground">{pwdUser.nome_completo || pwdUser.email}</p>
              <div><Label>Nova senha</Label><Input type="text" value={pwd} onChange={(e) => setPwd(e.target.value)} placeholder="Mínimo 6 caracteres" /></div>
              <Button className="w-full" disabled={saving} onClick={savePwd}>{saving ? "Salvando..." : "Redefinir senha"}</Button>
            </div>
          </div>
        </div>
      )}

      {viewing && (
        <div className="fixed inset-0 z-[100] bg-background/90 backdrop-blur-sm grid place-items-center p-4" onClick={() => setViewing(null)}>
          <div className="w-full max-w-2xl rounded-2xl border border-border bg-card shadow-2xl flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="font-bold text-lg">Aceites de políticas</h2>
                <p className="text-xs text-muted-foreground">{viewing.nome_completo || viewing.email}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewing(null)}><X className="h-4 w-4" /></Button>
            </div>
            <div className="p-5 overflow-y-auto space-y-3">
              {loadingAcc && <p className="text-sm text-muted-foreground">Carregando...</p>}
              {!loadingAcc && (acceptances?.length ?? 0) === 0 && (
                <p className="text-sm text-muted-foreground">Este cliente ainda não aceitou nenhuma política.</p>
              )}
              {acceptances?.map((a) => (
                <details key={a.id} className="rounded-lg border border-border p-3">
                  <summary className="cursor-pointer text-sm font-medium">
                    Versão {a.version} — {new Date(a.accepted_at).toLocaleString("pt-BR")}
                  </summary>
                  <div className="mt-2 text-xs text-muted-foreground space-y-1">
                    {a.user_agent && <div><b>User agent:</b> {a.user_agent}</div>}
                    {a.ip_address && <div><b>IP:</b> {a.ip_address}</div>}
                    <div className="mt-2 p-3 rounded bg-muted/50 whitespace-pre-wrap font-mono text-[11px] max-h-64 overflow-y-auto">{a.content_snapshot}</div>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}