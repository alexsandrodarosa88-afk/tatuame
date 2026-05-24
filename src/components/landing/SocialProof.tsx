import { Card } from "@/components/ui/card";
import { Star } from "lucide-react";
import t1 from "@/assets/tattoo-1.jpg";
import t2 from "@/assets/tattoo-2.jpg";
import t3 from "@/assets/tattoo-3.jpg";
import { useSiteSettings } from "@/hooks/use-site-settings";

export function SocialProof() {
  const { get } = useSiteSettings();
  const testimonials = [
    { name: get("social.t1_name", "Marina Costa"), role: get("social.t1_role", "São Paulo, SP"), text: get("social.t1_text", "Comprei R$30 em crédito e acabei levando uma tatuagem de R$2.000. Nunca tinha visto algo assim no Brasil.") },
    { name: get("social.t2_name", "Ricardo Alves"), role: get("social.t2_role", "Rio de Janeiro, RJ"), text: get("social.t2_text", "Mesmo sem ganhar o sorteio, usei meu crédito para pagar parte da tatuagem. Saí no lucro de qualquer jeito.") },
    { name: get("social.t3_name", "Juliana Mendes"), role: get("social.t3_role", "Belo Horizonte, MG"), text: get("social.t3_text", "Plataforma séria, tatuadores incríveis e a campanha foi super transparente. Recomendo demais.") },
  ];
  const images = [get("social.image1", t1), get("social.image2", t2), get("social.image3", t3)];
  return (
    <section id="depoimentos" className="py-24 border-t border-border bg-card/30">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="text-xs uppercase tracking-[0.2em] text-primary font-semibold mb-3">{get("social.eyebrow", "Quem já tatuou")}</div>
          <h2 className="font-display text-4xl md:text-5xl font-bold">{get("social.title", "Histórias reais, tinta de verdade.")}</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-5 mb-10">
          {testimonials.map((t) => (
            <Card key={t.name} className="bg-background/60 backdrop-blur border-border p-6 transition-[var(--transition-smooth)] hover:border-primary/40">
              <div className="flex gap-0.5 mb-3 text-primary">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <p className="text-foreground/90 leading-relaxed mb-5">"{t.text}"</p>
              <div>
                <div className="font-semibold">{t.name}</div>
                <div className="text-xs text-muted-foreground">{t.role}</div>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-3 md:gap-5">
          {images.map((src, i) => (
            <img
              key={i}
              src={src}
              alt={`Tatuagem em preto e cinza realizada por parceiro TATUAME #${i + 1}`}
              loading="lazy"
              width={768}
              height={768}
              className="rounded-xl border border-border object-cover aspect-square w-full"
            />
          ))}
        </div>
      </div>
    </section>
  );
}