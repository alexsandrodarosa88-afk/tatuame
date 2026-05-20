import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/admin/clientes")({ component: AdminClientes });

type Profile = { id: string; email: string | null; nome_completo: string | null; telefone: string | null; cpf: string | null; cidade: string | null; created_at: string };

function AdminClientes() {
  const [rows, setRows] = useState<Profile[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(1000);
      if (data) setRows(data as Profile[]);
    })();
  }, []);

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
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Nenhum cliente.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}