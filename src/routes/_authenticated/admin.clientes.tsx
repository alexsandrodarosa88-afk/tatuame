import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { db } from "@/lib/db";
import { adminDeleteUser, adminUpdateProfile, adminUpdateUserPassword } from "@/lib/admin-users.functions";

export const Route = createFileRoute("/_authenticated/admin/clientes")({
  component: Page,
  head: () => ({ meta: [{ title: "Clientes | Admin TATUAME" }, { name: "description", content: "Gerenciar clientes." }, { property: "og:title", content: "Clientes | Admin TATUAME" }, { property: "og:description", content: "Gerenciar clientes." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
});

function Page() {
  const q = useQuery({ queryKey: ["admin-clients"], queryFn: async () => (await db.from("profiles").select("*").order("created_at", { ascending: false })).data ?? [] });
  const [search, setSearch] = useState("");
  const [edit, setEdit] = useState<any>(null);
  const [pwd, setPwd] = useState("");
  const update = useServerFn(adminUpdateProfile); const del = useServerFn(adminDeleteUser); const setPassword = useServerFn(adminUpdateUserPassword);
  const rows = (q.data ?? []).filter((p: any) => `${p.nome_completo} ${p.email} ${p.cpf}`.toLowerCase().includes(search.toLowerCase()));

  const save = async () => {
    try {
      await update({ data: { userId: edit.id, email: edit.email, nome_completo: edit.nome_completo, telefone: edit.telefone, cpf: edit.cpf, cidade: edit.cidade } });
      if (pwd) await setPassword({ data: { userId: edit.id, newPassword: pwd } });
      toast.success("Cliente atualizado"); setEdit(null); setPwd(""); q.refetch();
    } catch (e: any) { toast.error(e.message); }
  };
  const remove = async (id: string) => {
    if (!confirm("Excluir este cliente e todos os dados dele?")) return;
    try { await del({ data: { userId: id } }); toast.success("Cliente excluído"); q.refetch(); } catch (e: any) { toast.error(e.message); }
  };
  const f = (k: string, l: string) => <div className="space-y-1"><Label>{l}</Label><Input value={edit?.[k] ?? ""} onChange={(e) => setEdit({ ...edit, [k]: e.target.value })} /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl">Clientes</h1>
      <Input placeholder="Buscar por nome, email ou CPF" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm bg-card" />
      <div className="space-y-2">
        {rows.map((p: any) => (
          <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border bg-card p-4">
            <div><p className="font-semibold">{p.nome_completo || "—"}</p><p className="text-sm text-muted-foreground">{p.email} · {p.telefone} · {p.cidade}</p></div>
            <div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => setEdit(p)}>Editar</Button><Button size="sm" variant="ghost" onClick={() => remove(p.id)}>Excluir</Button></div>
          </div>
        ))}
      </div>
      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent><DialogHeader><DialogTitle>Editar cliente</DialogTitle></DialogHeader>
          <div className="space-y-3">{f("nome_completo", "Nome")}{f("email", "Email")}{f("telefone", "Telefone")}{f("cpf", "CPF")}{f("cidade", "Cidade")}
            <div className="space-y-1"><Label>Nova senha (opcional)</Label><Input type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} /></div>
            <Button className="w-full" onClick={save}>Salvar</Button></div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
