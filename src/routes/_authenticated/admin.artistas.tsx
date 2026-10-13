import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";

export const Route = createFileRoute("/_authenticated/admin/artistas")({
  component: Page,
  head: () => ({ meta: [{ title: "Artistas | Admin TATUAME" }, { name: "description", content: "Cadastros de artistas." }, { property: "og:title", content: "Artistas | Admin TATUAME" }, { property: "og:description", content: "Cadastros de artistas." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
});

const label: Record<string, string> = { pendente: "Em análise", aprovado: "Aprovado", recusado: "Recusado" };

function Page() {
  const q = useQuery({
    queryKey: ["admin-apps"],
    queryFn: async () => {
      const [a, p] = await Promise.all([db.from("artist_applications").select("*").order("created_at", { ascending: false }), db.from("artists").select("id")]);
      const pub = new Set((p.data ?? []).map((x: any) => x.id));
      return (a.data ?? []).map((x: any) => ({ ...x, isPublic: pub.has(x.id) }));
    },
  });
  const decide = async (a: any, status: string) => {
    const { error } = await db.from("artist_applications").update({ status, published: status === "aprovado" }).eq("id", a.id);
    if (error) return toast.error(error.message);
    if (status === "aprovado") await db.from("artists").upsert({ id: a.id, full_name: a.full_name, instagram: a.instagram, city: a.city, state: a.state, photo_url: a.photo_url });
    else await db.from("artists").delete().eq("id", a.id);
    toast.success(status === "aprovado" ? "Aprovado e publicado no site" : "Cadastro atualizado"); q.refetch();
  };
  const unpublish = async (a: any) => { await db.from("artists").delete().eq("id", a.id); await db.from("artist_applications").update({ published: false }).eq("id", a.id); q.refetch(); };
  const remove = async (id: string) => { if (!confirm("Excluir este cadastro?")) return; await db.from("artist_applications").delete().eq("id", id); q.refetch(); };
  return (
    <div className="space-y-6">
      <h1 className="text-3xl">Artistas</h1>
      <div className="space-y-3">
        {q.data?.map((a: any) => {
          const wpp = a.whatsapp.length <= 11 ? `55${a.whatsapp}` : a.whatsapp;
          return (
            <div key={a.id} className="space-y-3 rounded-2xl border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div><p className="font-semibold">{a.full_name} <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">{label[a.status]}{a.isPublic && " · no site"}</span></p>
                  <p className="text-sm text-muted-foreground">{a.instagram} · {a.email} · WhatsApp {a.whatsapp}</p>
                  <p className="text-sm text-muted-foreground">{a.studio_address} — {a.city}/{a.state}</p></div>
                <p className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString("pt-BR")}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" asChild><a href={`https://wa.me/${wpp}`} target="_blank" rel="noreferrer">Chamar no WhatsApp</a></Button>
                {a.status !== "aprovado" && <Button size="sm" onClick={() => decide(a, "aprovado")}>Aprovar e publicar</Button>}
                {a.status !== "recusado" && <Button size="sm" variant="outline" onClick={() => decide(a, "recusado")}>Recusar</Button>}
                {a.isPublic && <Button size="sm" variant="outline" onClick={() => unpublish(a)}>Tirar do site</Button>}
                <Button size="sm" variant="ghost" onClick={() => remove(a.id)}>Excluir</Button>
              </div>
            </div>
          );
        })}
        {q.data?.length === 0 && <p className="text-muted-foreground">Nenhum cadastro recebido ainda.</p>}
      </div>
    </div>
  );
}
