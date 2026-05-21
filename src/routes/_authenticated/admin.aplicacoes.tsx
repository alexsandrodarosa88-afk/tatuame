import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Check, X, Loader2, Clock } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/aplicacoes")({ component: AdminAplicacoes });

type App = {
  id: string; user_id: string; full_name: string; email: string; address: string; cpf: string;
  status: "pending" | "approved" | "rejected"; created_at: string; notes: string | null;
};

function AdminAplicacoes() {
  const [rows, setRows] = useState<App[]>([]);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected">("pending");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reason, setReason] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("artist_applications").select("*").order("created_at", { ascending: false });
    setRows((data as App[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const approve = async (id: string) => {
    setBusyId(id);
    const { error } = await supabase.rpc("approve_artist_application", { _application_id: id });
    setBusyId(null);
    if (error) { toast.error("Erro ao aprovar: " + error.message); return; }
    toast.success("Tatuador aprovado.");
    load();
  };
  const reject = async (id: string) => {
    setBusyId(id);
    const { error } = await supabase.rpc("reject_artist_application", { _application_id: id, _reason: reason[id] || undefined });
    setBusyId(null);
    if (error) { toast.error("Erro ao reprovar: " + error.message); return; }
    toast.success("Cadastro reprovado.");
    load();
  };

  const counts = { pending: 0, approved: 0, rejected: 0 };
  rows.forEach(r => counts[r.status]++);
  const filtered = rows.filter(r => r.status === filter);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Cadastros de tatuadores</h1>
      <div className="flex gap-2 flex-wrap">
        {(["pending", "approved", "rejected"] as const).map(s => (
          <Button key={s} variant={filter === s ? "default" : "outline"} size="sm" onClick={() => setFilter(s)}>
            {s === "pending" ? "Pendentes" : s === "approved" ? "Aprovados" : "Reprovados"} ({counts[s]})
          </Button>
        ))}
      </div>
      {loading ? (
        <div className="grid place-items-center py-20"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="p-6 text-center text-muted-foreground text-sm flex flex-col items-center gap-2">
          <Clock className="h-8 w-8 opacity-40" /> Nenhum cadastro nesta categoria.
        </CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map(a => (
            <Card key={a.id}>
              <CardContent className="p-4 space-y-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold">{a.full_name}</h3>
                    <p className="text-xs text-muted-foreground">Recebido em {new Date(a.created_at).toLocaleString("pt-BR")}</p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted">{a.status}</span>
                </div>
                <div className="grid sm:grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <p><span className="text-muted-foreground">E-mail:</span> {a.email}</p>
                  <p><span className="text-muted-foreground">CPF:</span> {a.cpf}</p>
                  <p className="sm:col-span-2"><span className="text-muted-foreground">Endereço:</span> {a.address}</p>
                  {a.notes && <p className="sm:col-span-2"><span className="text-muted-foreground">Observação:</span> {a.notes}</p>}
                </div>
                {a.status === "pending" && (
                  <div className="pt-2 space-y-2">
                    <Textarea
                      rows={2} placeholder="Motivo da reprovação (opcional)"
                      value={reason[a.id] ?? ""} onChange={(e) => setReason({ ...reason, [a.id]: e.target.value })}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => approve(a.id)} disabled={busyId === a.id}>
                        {busyId === a.id ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Check className="h-3.5 w-3.5 mr-1" />}
                        Aprovar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => reject(a.id)} disabled={busyId === a.id}>
                        <X className="h-3.5 w-3.5 mr-1" /> Reprovar
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}