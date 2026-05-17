import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
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
    <section className="py-24 border-t border-border">
      <div className="container mx-auto px-4">
        <div className="rounded-3xl border border-border bg-card/60 backdrop-blur p-10 md:p-14">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div>
              <div className="inline-flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-[0.2em] font-medium mb-3">
                Próxima campanha fechando
              </div>
              <h3 className="font-display text-3xl md:text-4xl font-semibold">
                Restam <span className="tabular-nums">{remaining}</span> cotas
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
                <div key={u.l} className="min-w-16 text-center rounded-xl border border-border bg-background/60 backdrop-blur px-3 py-2">
                  <div className="font-display text-2xl md:text-3xl font-semibold tabular-nums">
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