import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Power, Trash2, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/estilos")({ component: AdminEstilos });

type Style = { id: string; name: string; sort_order: number; is_active: boolean };

function AdminEstilos() {
  const [rows, setRows] = useState<Style[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("tattoo_styles").select("*").order("sort_order");
    setRows((data as Style[]) ?? []); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const add = async () => {
    const n = name.trim();
    if (!n) return;
    const next = (rows[rows.length - 1]?.sort_order ?? 0) + 10;
    const { error } = await supabase.from("tattoo_styles").insert({ name: n, sort_order: next } as any);
    if (error) { toast.error(error.message); return; }
    setName(""); toast.success("Estilo adicionado."); load();
  };

  const toggle = async (s: Style) => {
    await supabase.from("tattoo_styles").update({ is_active: !s.is_active }).eq("id", s.id);
    load();
  };
  const remove = async (s: Style) => {
    if (!confirm(`Excluir o estilo "${s.name}"?`)) return;
    const { error } = await supabase.from("tattoo_styles").delete().eq("id", s.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Excluído."); load();
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Estilos de tatuagem</h1>
      <p className="text-sm text-muted-foreground">Gerencie os estilos disponíveis para os tatuadores selecionarem em seus perfis.</p>
      <Card><CardContent className="p-4 flex gap-2">
        <Input placeholder="Nome do novo estilo" value={name} onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()} />
        <Button onClick={add}><Plus className="h-4 w-4 mr-1" /> Adicionar</Button>
      </CardContent></Card>
      {loading ? (
        <div className="grid place-items-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : (
        <Card><CardContent className="p-0">
          <ul className="divide-y divide-border">
            {rows.map(s => (
              <li key={s.id} className="flex items-center justify-between px-4 py-2.5">
                <span className={s.is_active ? "" : "text-muted-foreground line-through"}>{s.name}</span>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => toggle(s)} title={s.is_active ? "Desativar" : "Ativar"}>
                    <Power className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => remove(s)} title="Excluir">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </CardContent></Card>
      )}
    </div>
  );
}