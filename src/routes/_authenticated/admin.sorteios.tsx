import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { db } from "@/lib/db";

export const Route = createFileRoute("/_authenticated/admin/sorteios")({ staticData: { sitemap: false },
  component: Page,
  head: () => ({ meta: [{ title: "Sorteios | Admin TATUAME" }, { name: "description", content: "Cadastre os sorteios realizados." }, { property: "og:title", content: "Sorteios | Admin TATUAME" }, { property: "og:description", content: "Cadastre os sorteios realizados." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
});

const empty = { id: "", campaign_id: "", drawn_at: new Date().toISOString().slice(0, 10), winning_number: "", winner_name: "", live_url: "" };

function Page() {
  const qc = useQueryClient();
  const [f, setF] = useState<any>(empty);
  const draws = useQuery({ queryKey: ["draws"], queryFn: async () => (await db.from("draws").select("*").order("drawn_at", { ascending: false })).data ?? [] });
  const camps = useQuery({ queryKey: ["admin-camps-list"], queryFn: async () => (await db.from("campaigns").select("id,title").order("created_at", { ascending: false })).data ?? [] });
  const save = async () => {
    const c = (camps.data as any[])?.find((x) => x.id === f.campaign_id);
    if (!c) return toast.error("Escolha o sorteio");
    const row = { campaign_id: c.id, campaign_title: c.title, drawn_at: f.drawn_at, winning_number: f.winning_number ? Number(f.winning_number) : null, winner_name: f.winner_name || null, live_url: f.live_url || null };
    const { error } = f.id ? await db.from("draws").update(row).eq("id", f.id) : await db.from("draws").insert(row);
    if (error) return toast.error(error.message);
    toast.success("Sorteio salvo"); setF(empty); qc.invalidateQueries({ queryKey: ["draws"] });
  };
  const del = async (id: string) => {
    if (!confirm("Excluir este sorteio?")) return;
    await db.from("draws").delete().eq("id", id); qc.invalidateQueries({ queryKey: ["draws"] });
  };
  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-3xl">Sorteios</h1>
      <section className="space-y-3 rounded-2xl border bg-card p-5">
        <h2 className="text-xl">{f.id ? "Editar sorteio" : "Novo sorteio"}</h2>
        <div className="space-y-1"><Label>Sorteio</Label>
          <select className="h-10 w-full rounded-md border bg-background px-3" value={f.campaign_id} onChange={(e) => setF({ ...f, campaign_id: e.target.value })}>
            <option value="">Selecione</option>
            {(camps.data as any[])?.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1"><Label>Data do sorteio</Label><Input type="date" value={f.drawn_at} onChange={(e) => setF({ ...f, drawn_at: e.target.value })} /></div>
          <div className="space-y-1"><Label>Número sorteado</Label><Input type="number" value={f.winning_number} onChange={(e) => setF({ ...f, winning_number: e.target.value })} /></div>
        </div>
        <div className="space-y-1"><Label>Nome do vencedor (no site aparece só o primeiro nome)</Label><Input value={f.winner_name} onChange={(e) => setF({ ...f, winner_name: e.target.value })} /></div>
        <div className="space-y-1"><Label>Link da live no Instagram</Label><Input value={f.live_url} placeholder="https://instagram.com/..." onChange={(e) => setF({ ...f, live_url: e.target.value.trim() })} /></div>
        <div className="flex gap-2"><Button onClick={save}>Salvar sorteio</Button>{f.id && <Button variant="ghost" onClick={() => setF(empty)}>Cancelar</Button>}</div>
      </section>
      <section className="space-y-3">
        {(draws.data as any[])?.map((d) => (
          <div key={d.id} className="flex items-center justify-between gap-3 rounded-xl border bg-card p-4">
            <div><p className="font-medium">{d.campaign_title}</p><p className="text-sm text-muted-foreground">{new Date(d.drawn_at + "T12:00:00").toLocaleDateString("pt-BR")} · Nº {d.winning_number ?? "—"} · {d.winner_name ?? "—"}</p></div>
            <div className="flex gap-1">
              <Button size="icon" variant="ghost" aria-label="Editar" onClick={() => setF({ ...d, winning_number: d.winning_number ?? "", winner_name: d.winner_name ?? "", live_url: d.live_url ?? "", campaign_id: d.campaign_id ?? "" })}><Pencil className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" aria-label="Excluir" onClick={() => del(d.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
