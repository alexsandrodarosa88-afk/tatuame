import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminListPromotionQueue, adminReviewPromotionTask } from "@/lib/artist-plan.functions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Megaphone, Check, X, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/admin/divulgacao")({ component: AdminDivulgacao });

function AdminDivulgacao() {
  const listFn = useServerFn(adminListPromotionQueue);
  const reviewFn = useServerFn(adminReviewPromotionTask);
  const { data, isLoading, refetch } = useQuery({ queryKey: ["admin-promo-queue"], queryFn: () => listFn() });
  const [filter, setFilter] = useState<"submitted" | "all">("submitted");

  const review = useMutation({
    mutationFn: (vars: { taskId: string; approve: boolean; notes?: string }) => reviewFn({ data: vars }),
    onSuccess: () => { toast.success("Revisado."); refetch(); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading || !data) {
    return <div className="grid place-items-center py-20"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  }

  const items = (data.items as any[]).filter((i) => filter === "all" || i.status === "submitted");

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Megaphone className="h-6 w-6" />Divulgação dos tatuadores</h1>
          <p className="text-sm text-muted-foreground mt-1">Aprove ou rejeite os stories, reels e posts enviados.</p>
        </div>
        <div className="flex gap-2">
          <Button variant={filter === "submitted" ? "default" : "outline"} size="sm" onClick={() => setFilter("submitted")}>
            Fila ({(data.items as any[]).filter((i) => i.status === "submitted").length})
          </Button>
          <Button variant={filter === "all" ? "default" : "outline"} size="sm" onClick={() => setFilter("all")}>
            Todos
          </Button>
        </div>
      </div>

      {items.length === 0 ? (
        <Card><CardContent className="p-6 text-sm text-muted-foreground text-center">Nada por aqui.</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {items.map((it) => (
            <Card key={it.id}>
              <CardContent className="p-4 flex items-center gap-3 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <p className="font-semibold text-sm">{it.tattoo_artists?.name ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">
                    {it.task_type} #{it.task_index} · semana {new Date(it.week_start).toLocaleDateString("pt-BR")}
                  </p>
                  {it.instagram_url && (
                    <a href={it.instagram_url} target="_blank" rel="noreferrer" className="text-xs text-primary inline-flex items-center gap-1 underline mt-1">
                      <ExternalLink className="h-3 w-3" /> Abrir publicação
                    </a>
                  )}
                </div>
                <div>
                  {it.status === "approved" && <span className="text-xs px-2 py-1 rounded bg-green-500/10 text-green-700 dark:text-green-400">Aprovado</span>}
                  {it.status === "rejected" && <span className="text-xs px-2 py-1 rounded bg-red-500/10 text-red-700 dark:text-red-400">Rejeitado</span>}
                  {it.status === "submitted" && <span className="text-xs px-2 py-1 rounded bg-blue-500/10 text-blue-700 dark:text-blue-400">Aguardando</span>}
                </div>
                {it.status === "submitted" && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => {
                      const notes = prompt("Motivo (opcional):") ?? undefined;
                      review.mutate({ taskId: it.id, approve: false, notes });
                    }} disabled={review.isPending}>
                      <X className="h-4 w-4" />
                    </Button>
                    <Button size="sm" onClick={() => review.mutate({ taskId: it.id, approve: true })} disabled={review.isPending}>
                      <Check className="h-4 w-4" />
                    </Button>
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