import { Check, ShieldCheck } from "lucide-react";
import { useSiteSettings } from "@/hooks/use-site-settings";

export function Guarantee() {
  const { get } = useSiteSettings();
  const points = [
    get("guarantee.point1", "Toda compra vira crédito na sua conta"),
    get("guarantee.point2", "Crédito válido por 12 meses, sem letras miúdas"),
    get("guarantee.point3", "Use para pagar até 70% de qualquer tatuagem"),
    get("guarantee.point4", "Disponível com todos os tatuadores parceiros"),
  ];
  return (
    <section id="garantia" className="py-24 border-t border-border">
      <div className="container mx-auto px-4">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-card/60 backdrop-blur p-10 md:p-16">
          <div aria-hidden className="absolute -top-32 -right-32 h-80 w-80 rounded-full bg-[image:var(--gradient-primary)] opacity-20 blur-3xl" />
          <div className="grid lg:grid-cols-2 gap-10 items-center relative">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-success/30 bg-success/10 px-3 py-1 text-xs text-success font-semibold mb-5">
                <ShieldCheck className="h-3.5 w-3.5" />
                Garantia TATUAME
              </div>
              <h2 className="font-display text-4xl md:text-5xl font-bold leading-tight">
                {get("guarantee.title", "Você nunca perde.")}{" "}
                <span className="bg-[image:var(--gradient-primary)] bg-clip-text text-transparent">
                  {get("guarantee.title_highlight", "Seu dinheiro vira tatuagem.")}
                </span>
              </h2>
            </div>
            <ul className="space-y-4">
              {points.map((p) => (
                <li key={p} className="flex items-start gap-3">
                  <span className="mt-0.5 grid place-items-center h-6 w-6 rounded-full bg-success/15 border border-success/30">
                    <Check className="h-3.5 w-3.5 text-success" />
                  </span>
                  <span className="text-foreground">{p}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}