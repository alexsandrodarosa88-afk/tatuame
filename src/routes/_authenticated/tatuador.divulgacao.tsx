import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyPromotionWeek, submitPromotionTask } from "@/lib/artist-plan.functions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Megaphone, Check, Clock, X, Instagram, Target, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";
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
  const submitted = tasks.filter((t) => t.status === "submitted").length;
  const remaining = tasks.length - approved;
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

      {/* Painel de progresso do rateio */}
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-amber-500/5">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">Progresso para 100% do rateio</h2>
            </div>
            <span className={`text-sm font-semibold ${pct === 100 ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"}`}>
              Você receberá <strong>{pct}%</strong> do rateio
            </span>
          </div>
          <Progress value={pct} className="h-3" />
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-md bg-green-500/10 p-2">
              <p className="text-xl font-bold text-green-600 dark:text-green-400">{approved}</p>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Aprovados</p>
            </div>
            <div className="rounded-md bg-blue-500/10 p-2">
              <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{submitted}</p>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Em análise</p>
            </div>
            <div className="rounded-md bg-muted p-2">
              <p className="text-xl font-bold">{remaining}</p>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Faltam</p>
            </div>
          </div>
          {pct === 100 ? (
            <p className="text-sm text-green-700 dark:text-green-400 flex items-center gap-1">
              <TrendingUp className="h-4 w-4" /> Parabéns! Você bateu todas as metas e receberá 100% do rateio neste mês.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Faltam <strong>{remaining}</strong> {remaining === 1 ? "publicação aprovada" : "publicações aprovadas"} para atingir 100% do rateio nesta semana.
            </p>
          )}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t">
            {(["story", "reel", "post"] as const).map((type) => {
              const g = groups[type];
              const a = g.filter((t) => t.status === "approved").length;
              const left = g.length - a;
              return (
                <div key={type} className="text-center">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{typeLabel(type)}s</p>
                  <p className="text-lg font-semibold">{a}/{g.length}</p>
                  {left > 0 ? (
                    <p className="text-[11px] text-amber-600 dark:text-amber-400">faltam {left}</p>
                  ) : (
                    <p className="text-[11px] text-green-600 dark:text-green-400">completo ✓</p>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

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