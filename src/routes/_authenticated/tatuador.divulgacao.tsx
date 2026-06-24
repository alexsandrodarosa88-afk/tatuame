import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyPromotionWeek, submitPromotionTask } from "@/lib/artist-plan.functions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Megaphone, Check, Clock, X, Instagram } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/tatuador/divulgacao")({ component: DivulgacaoPage });

type Task = {
  id: string; task_type: string; task_index: number; status: string;
  instagram_url: string | null; submitted_at: string | null; reviewed_at: string | null; notes: string | null;
};

const typeLabel = (t: string) => ({ story: "Story", reel: "Reel", post: "Post" }[t] ?? t);
const statusBadge = (s: string) => {
  if (s === "approved") return <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-green-500/10 text-green-700 dark:text-green-400"><Check className="h-3 w-3" />Aprovado</span>;
  if (s === "submitted") return <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-700 dark:text-blue-400"><Clock className="h-3 w-3" />Em análise</span>;
  if (s === "rejected") return <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-red-500/10 text-red-700 dark:text-red-400"><X className="h-3 w-3" />Rejeitado</span>;
  return <span className="text-xs text-muted-foreground">Pendente</span>;
};

function DivulgacaoPage() {
  const weekFn = useServerFn(getMyPromotionWeek);
  const submitFn = useServerFn(submitPromotionTask);
  const { data, isLoading, refetch } = useQuery({ queryKey: ["promo-week"], queryFn: () => weekFn() });
  const [urls, setUrls] = useState<Record<string, string>>({});

  const submit = useMutation({
    mutationFn: (vars: { taskId: string; instagramUrl?: string }) => submitFn({ data: vars }),
    onSuccess: () => { toast.success("Enviado para revisão!"); refetch(); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading || !data) {
    return <div className="grid place-items-center py-20 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  }

  const tasks = data.tasks as Task[];
  const approved = tasks.filter((t) => t.status === "approved").length;
  const pct = tasks.length ? Math.round((approved / tasks.length) * 100) : 0;
  const weekDate = new Date(data.weekStart);
  const weekEnd = new Date(data.weekStart); weekEnd.setDate(weekEnd.getDate() + 6);

  const groups: Record<string, Task[]> = { story: [], reel: [], post: [] };
  for (const t of tasks) (groups[t.task_type] ??= []).push(t);

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Megaphone className="h-6 w-6" />Divulgação</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Semana de {weekDate.toLocaleDateString("pt-BR")} a {weekEnd.toLocaleDateString("pt-BR")}
          </p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold">{pct}%</p>
          <p className="text-xs text-muted-foreground">{approved}/{tasks.length} aprovados</p>
        </div>
      </div>

      <Card className="bg-amber-500/5 border-amber-500/30">
        <CardContent className="p-4 text-sm">
          <p>
            Para receber <strong>100% do rateio</strong> das campanhas no mês, complete todas as metas semanais:
            <strong> 8 stories + 1 reel + 1 post</strong>. Cole o link da publicação e clique em "Enviar". O admin valida.
          </p>
        </CardContent>
      </Card>

      {(["story", "reel", "post"] as const).map((type) => (
        <div key={type}>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            {typeLabel(type)}s ({groups[type].filter((t) => t.status === "approved").length}/{groups[type].length})
          </h2>
          <div className="space-y-2">
            {groups[type].map((t) => {
              const disabled = t.status === "approved" || t.status === "submitted";
              return (
                <Card key={t.id}>
                  <CardContent className="p-3 flex items-center gap-3 flex-wrap">
                    <div className="font-medium text-sm w-20">{typeLabel(t.task_type)} #{t.task_index}</div>
                    <div className="flex-1 min-w-[200px]">
                      {disabled && t.instagram_url ? (
                        <a href={t.instagram_url} target="_blank" rel="noreferrer" className="text-sm text-primary inline-flex items-center gap-1 underline">
                          <Instagram className="h-3 w-3" /> Link enviado
                        </a>
                      ) : (
                        <Input
                          placeholder="Cole o link da publicação (opcional)"
                          value={urls[t.id] ?? ""}
                          onChange={(e) => setUrls((p) => ({ ...p, [t.id]: e.target.value }))}
                          disabled={disabled}
                          className="h-9"
                        />
                      )}
                      {t.notes && <p className="text-xs text-red-500 mt-1">Obs: {t.notes}</p>}
                    </div>
                    <div>{statusBadge(t.status)}</div>
                    {!disabled && (
                      <Button
                        size="sm"
                        onClick={() => submit.mutate({ taskId: t.id, instagramUrl: urls[t.id] || undefined })}
                        disabled={submit.isPending}
                      >
                        Enviar
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}