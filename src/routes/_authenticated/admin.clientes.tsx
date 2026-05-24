import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useServerFn } from "@tanstack/react-start";
import { adminGetUserAcceptances } from "@/lib/policy.functions";
import { FileText, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/clientes")({ component: AdminClientes });

type Profile = { id: string; email: string | null; nome_completo: string | null; telefone: string | null; cpf: string | null; cidade: string | null; created_at: string };

function AdminClientes() {
  const [rows, setRows] = useState<Profile[]>([]);
  const [q, setQ] = useState("");
  const [viewing, setViewing] = useState<Profile | null>(null);
  const [acceptances, setAcceptances] = useState<any[] | null>(null);
  const [loadingAcc, setLoadingAcc] = useState(false);
  const getAcc = useServerFn(adminGetUserAcceptances);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(1000);
      if (data) setRows(data as Profile[]);
    })();
  }, []);

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
              <th className="text-left p-3">Políticas</th>
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
                  <Button variant="outline" size="sm" onClick={() => openAcceptances(r)}>
                    <FileText className="h-3.5 w-3.5 mr-1" /> Ver aceites
                  </Button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">Nenhum cliente.</td></tr>}
          </tbody>
        </table>
      </div>

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