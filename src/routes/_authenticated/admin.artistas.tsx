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
    refetchInterval: 10000,
    queryFn: async () => {
      const [a, p] = await Promise.all([db.from("artist_applications").select("*").order("created_at", { ascending: false }), db.from("artists").select("id")]);
      if (a.error) throw a.error;
      if (p.error) throw p.error;
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
        {q.isLoading && <p className="text-muted-foreground" role="status">Carregando cadastros...</p>}
        {q.isError && <div role="alert" className="space-y-2"><p className="text-destructive">Não foi possível carregar os cadastros.</p><Button variant="outline" onClick={() => q.refetch()}>Tentar novamente</Button></div>}
        {q.data?.map((a: any) => {
          const digits = String(a.whatsapp ?? "").replace(/\D/g, "");
          const wpp = digits.length <= 11 ? `55${digits}` : digits;
          return (
            <div key={a.id} className="space-y-3 rounded-2xl border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div><p className="font-semibold">{a.full_name} <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">{label[a.status]}{a.isPublic && " · no site"}</span></p>
                  <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                    <div><dt className="text-muted-foreground">Instagram</dt><dd className="break-words">{a.instagram}</dd></div>
                    <div><dt className="text-muted-foreground">Email</dt><dd className="break-all"><a className="text-primary underline" href={`mailto:${a.email}`}>{a.email}</a></dd></div>
                    <div><dt className="text-muted-foreground">WhatsApp</dt><dd>{a.whatsapp}</dd></div>
                    <div><dt className="text-muted-foreground">Cidade / Estado</dt><dd className="break-words">{a.city} / {a.state}</dd></div>
                    <div className="sm:col-span-2"><dt className="text-muted-foreground">Endereço completo do estúdio</dt><dd className="whitespace-pre-line break-words">{a.studio_address}</dd></div>
                  </dl></div>
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
