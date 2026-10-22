import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Instagram, PlayCircle, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar, Footer } from "@/components/site/Navbar";
import { db, formatLuckyNumber } from "@/lib/db";
import { useSite } from "@/lib/site-content";

export const Route = createFileRoute("/sorteios")({ staticData: { sitemap: true },
  component: Page,
  head: () => ({ meta: [
    { title: "Sorteios ao vivo | TATUAME" },
    { name: "description", content: "Todos os sorteios do TATUAME acontecem ao vivo no Instagram. Veja resultados e gravações." },
    { property: "og:title", content: "Sorteios ao vivo | TATUAME" },
    { property: "og:description", content: "Resultados e gravações de todos os sorteios TATUAME." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
});

const firstName = (n?: string | null) => (n ?? "").trim().split(/\s+/)[0] || "—";

function Page() {
  const { s, t } = useSite();
  const q = useQuery({ queryKey: ["draws"], queryFn: async () => (await db.from("draws").select("*, campaigns(total_quotas)").order("drawn_at", { ascending: false })).data ?? [] });
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-14 md:py-20">
        <h1 className="mb-4 text-4xl md:text-5xl">{t("draws_title")}</h1>
        <p className="mb-6 max-w-2xl text-lg text-muted-foreground">{t("draws_text")}</p>
        {s.instagram && <Button asChild variant="outline" className="mb-10"><a href={s.instagram} target="_blank" rel="noreferrer"><Instagram className="mr-2 h-4 w-4" />Instagram do TATUAME</a></Button>}
        {q.data?.length ? (
          <div className="space-y-4">
            {q.data.map((d: any) => (
              <div key={d.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-card p-5">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">{new Date(d.drawn_at + "T12:00:00").toLocaleDateString("pt-BR")}</p>
                  <h2 className="text-xl">{d.campaign_title}</h2>
                  <p className="flex items-center gap-2 text-sm"><Trophy className="h-4 w-4 text-primary" />Número {d.winning_number != null ? formatLuckyNumber(d.winning_number, d.campaigns?.total_quotas) : "—"} · {firstName(d.winner_name)}</p>
                </div>
                {d.live_url && <Button asChild><a href={d.live_url} target="_blank" rel="noreferrer"><PlayCircle className="mr-2 h-4 w-4" />Ver live</a></Button>}
              </div>
            ))}
          </div>
        ) : <p className="rounded-2xl border bg-card p-6 text-muted-foreground">{t("draws_empty")}</p>}
      </main>
      <Footer />
    </div>
  );
}
