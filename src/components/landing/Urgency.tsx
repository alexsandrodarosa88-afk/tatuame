import { useEffect, useState } from "react";
import { Clock, Flame } from "lucide-react";
import { campaigns } from "@/data/campaigns";

function useCountdown(target: string) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  if (now === null) return { d: 0, h: 0, m: 0, s: 0 };
  const diff = Math.max(0, new Date(target).getTime() - now);
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff / 3600000) % 24);
  const m = Math.floor((diff / 60000) % 60);
  const s = Math.floor((diff / 1000) % 60);
  return { d, h, m, s };
}

export function Urgency() {
  const next = [...campaigns].sort((a, b) => +new Date(a.endsAt) - +new Date(b.endsAt))[0];
  const remaining = next.totalQuotas - next.soldQuotas;
  const { d, h, m, s } = useCountdown(next.endsAt);

  return (
    <section className="py-20 border-t border-border">
      <div className="container mx-auto px-4">
        <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-card/80 to-background p-8 md:p-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div>
              <div className="inline-flex items-center gap-2 text-primary text-xs uppercase tracking-[0.2em] font-bold mb-3">
                <Flame className="h-4 w-4" /> Próxima campanha fechando
              </div>
              <h3 className="font-display text-3xl md:text-4xl font-bold">
                Restam <span className="text-primary">{remaining}</span> cotas
              </h3>
              <p className="text-muted-foreground mt-2">Não deixe sua vaga escapar.</p>
            </div>
            <div className="flex items-center gap-2 md:gap-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              {[
                { v: d, l: "dias" },
                { v: h, l: "hrs" },
                { v: m, l: "min" },
                { v: s, l: "seg" },
              ].map((u) => (
                <div key={u.l} className="min-w-16 text-center rounded-lg border border-border bg-card/80 backdrop-blur px-3 py-2">
                  <div className="font-display text-2xl md:text-3xl font-bold tabular-nums">
                    {String(u.v).padStart(2, "0")}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{u.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}