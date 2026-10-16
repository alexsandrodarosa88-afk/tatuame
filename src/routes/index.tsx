import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { ArrowRight, Instagram, MapPin, Ticket, Sparkles, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Navbar, Footer } from "@/components/site/Navbar";
import { db, BRL } from "@/lib/db";
import { supabase } from "@/integrations/supabase/client";
import { useSite } from "@/lib/site-content";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({ meta: [
    { title: "TATUAME — Campanhas de tatuagem com artistas premium" },
    { name: "description", content: "Participe das campanhas TATUAME e concorra a tatuagens com artistas selecionados de todo o Brasil." },
    { property: "og:title", content: "TATUAME — Campanhas de tatuagem com artistas premium" },
    { property: "og:description", content: "Cotas acessíveis, artistas selecionados e campanhas transparentes." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
});

export const campaignsQuery = {
  queryKey: ["public-campaigns"],
  queryFn: async () => {
    const { data } = await db.from("campaigns").select("*").in("status", ["ativa", "encerrada"]).order("created_at", { ascending: false });
    return (data ?? []) as any[];
  },
};

function Index() {
  const { s, t, img } = useSite();
  const campaigns = useQuery(campaignsQuery);
  const artists = useQuery({ queryKey: ["artists"], queryFn: async () => (await db.from("artists").select("*").order("created_at", { ascending: false })).data ?? [] });

  useEffect(() => {
    const ch = supabase.channel("home-campaigns").on("postgres_changes", { event: "*", schema: "public", table: "campaigns" }, () => campaigns.refetch()).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 md:grid-cols-2 md:py-24">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground"><Sparkles className="h-3.5 w-3.5 text-primary" /> {t("hero_badge")}</span>
            <h1 className="text-4xl leading-[1.05] md:text-6xl">{t("hero_title")}</h1>
            <p className="max-w-md text-lg text-muted-foreground">{t("hero_subtitle")}</p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg"><a href="#campanhas">{t("hero_btn1")} <ArrowRight className="ml-1 h-4 w-4" /></a></Button>
              <Button asChild size="lg" variant="outline"><Link to="/seja-artista">{t("hero_btn2")}</Link></Button>
            </div>
          </div>
          <img src={img("hero")} alt="Tatuagem realizada por artista TATUAME" className="aspect-[4/5] w-full rounded-2xl object-cover shadow-soft" />
        </section>

        <section id="campanhas" className="border-t bg-card py-16 md:py-24">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="mb-10 text-3xl md:text-4xl">{t("campaigns_title")}</h2>
            {campaigns.data?.length ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {campaigns.data.map((c) => (
                  <Link key={c.id} to="/campanha/$id" params={{ id: c.id }} className="group overflow-hidden rounded-2xl border bg-background transition hover:shadow-soft">
                    <div className="aspect-[4/3] bg-muted">{c.image_url && <img src={c.image_url} alt={c.title} className="h-full w-full object-cover" />}</div>
                    <div className="space-y-3 p-5">
                      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-widest">
                        <span className="text-primary">{c.kind === "premium" ? "Premium" : "Simples"}</span>
                        {c.status === "encerrada" && <span className="text-muted-foreground">Encerrada</span>}
                      </div>
                      <h3 className="text-xl">{c.title}</h3>
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary" style={{ width: `${c.display_percent ?? 0}%` }} /></div>
                      <p className="text-sm text-muted-foreground">{t("campaigns_price")} <strong className="text-foreground">{BRL(c.quota_price)}</strong></p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : <p className="text-muted-foreground">{t("campaigns_empty")}</p>}
          </div>
        </section>

        <section id="como-funciona" className="mx-auto max-w-6xl px-4 py-16 md:py-24">
          <h2 className="mb-10 text-3xl md:text-4xl">{t("how_title")}</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {[{ i: Ticket, t: t("how1_t"), d: t("how1_d") },
              { i: ShieldCheck, t: t("how2_t"), d: t("how2_d") },
              { i: Sparkles, t: t("how3_t"), d: t("how3_d") }].map(({ i: I, t: title, d }, n) => (
              <div key={n} className="rounded-2xl border bg-card p-6">
                <I className="mb-4 h-6 w-6 text-primary" />
                <p className="text-xs text-muted-foreground">0{n + 1}</p>
                <h3 className="mb-2 text-xl">{title}</h3>
                <p className="text-sm text-muted-foreground">{d}</p>
              </div>
            ))}
          </div>
        </section>

        {!!artists.data?.length && (
          <section id="artistas" className="border-t bg-card py-16 md:py-24">
            <div className="mx-auto max-w-6xl px-4">
              <h2 className="mb-10 text-3xl md:text-4xl">{t("artists_title")}</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {artists.data.map((a: any) => (
                  <div key={a.id} className="rounded-2xl border bg-background p-5">
                    <div className="mb-4 aspect-square overflow-hidden rounded-xl bg-muted">{a.photo_url && <img src={a.photo_url} alt={a.full_name} className="h-full w-full object-cover" />}</div>
                    <h3 className="text-lg">{a.full_name}</h3>
                    <p className="flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{a.city} — {a.state}</p>
                    <a href={`https://instagram.com/${a.instagram.replace("@", "")}`} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm text-primary"><Instagram className="h-3.5 w-3.5" />{a.instagram}</a>
                    {!!a.styles?.length && <p className="mt-2 text-xs text-muted-foreground">{a.styles.join(" · ")}</p>}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="mx-auto max-w-6xl px-4 py-16 md:py-24">
          <div className="grid items-center gap-8 rounded-3xl bg-ink p-8 text-ink-foreground md:grid-cols-[1fr_auto] md:p-14">
            <div className="space-y-3">
              <h2 className="text-3xl md:text-5xl">{t("cta_title")}</h2>
              <p className="max-w-xl opacity-75">{t("cta_text")}</p>
            </div>
            <Button asChild size="lg"><Link to="/seja-artista">{t("cta_btn")}</Link></Button>
          </div>
        </section>

        {!!s.faq?.length && (
          <section id="faq" className="mx-auto max-w-3xl px-4 pb-24">
            <h2 className="mb-8 text-3xl md:text-4xl">{t("faq_title")}</h2>
            <Accordion type="single" collapsible>
              {s.faq.map((f, i) => (
                <AccordionItem key={i} value={String(i)}><AccordionTrigger className="text-left">{f.q}</AccordionTrigger><AccordionContent className="text-muted-foreground">{f.a}</AccordionContent></AccordionItem>
              ))}
            </Accordion>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
