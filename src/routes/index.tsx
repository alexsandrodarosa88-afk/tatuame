import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Instagram, MapPin, Ticket, Sparkles, ShieldCheck, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Navbar, Footer } from "@/components/site/Navbar";
import { db, BRL, withPublicPercent, formatLuckyNumber } from "@/lib/db";
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
    const [{ data }, { data: all }] = await Promise.all([
      db.from("campaigns").select("*").in("status", ["ativa", "encerrada"]).order("created_at", { ascending: false }),
      db.from("campaigns").select("id").order("created_at", { ascending: true }),
    ]);
    const order = new Map(((all ?? []) as any[]).map((x, i) => [x.id, i + 1]));
    return Promise.all(((data ?? []) as any[]).map(async (c) => ({ ...(await withPublicPercent(c)), serial: order.get(c.id) ?? 0 })));
  },
};

function Index() {
  const { s, t, img, styles, loaded } = useSite();
  const [city, setCity] = useState("");
  const [style, setStyle] = useState("");
  const [limit, setLimit] = useState(8);
  const campaigns = useQuery({ ...campaignsQuery, refetchInterval: 15000 });
  const draws = useQuery({ queryKey: ["draws-home"], queryFn: async () => (await db.from("draws").select("*, campaigns(total_quotas)").order("drawn_at", { ascending: false }).limit(3)).data ?? [] });
  const artists = useQuery({ queryKey: ["artists"], queryFn: async () => (await db.from("artists").select("*").order("position").order("created_at", { ascending: false })).data ?? [] });
  const cities = useMemo(() => Array.from(new Set(((artists.data ?? []) as any[]).map((a) => `${a.city} — ${a.state}`))).sort(), [artists.data]);
  const filtered = ((artists.data ?? []) as any[]).filter((a) => (!city || `${a.city} — ${a.state}` === city) && (!style || a.styles?.includes(style)));

  useEffect(() => {
    const ch = supabase.channel("home-campaigns").on("postgres_changes", { event: "*", schema: "public", table: "campaigns" }, () => campaigns.refetch()).on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => campaigns.refetch()).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <section id="sorteios" className="bg-ink py-10 text-ink-foreground md:py-14">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div className="space-y-3">
                <span className="inline-flex items-center gap-2 rounded-full bg-primary px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary-foreground"><Trophy className="h-3.5 w-3.5" /> {t("draws_home_badge")}</span>
                <h2 className="text-3xl md:text-4xl">{t("draws_home_title")}</h2>
              </div>
              <Button asChild size="lg" variant="outline" className="border-ink-foreground/30 bg-transparent text-ink-foreground hover:bg-ink-foreground/10"><Link to="/sorteios">{t("draws_home_btn")} <ArrowRight className="ml-1 h-4 w-4" /></Link></Button>
            </div>
            {draws.data?.length ? (
              <div className="grid gap-4 md:grid-cols-3">
                {draws.data.slice(0, 3).map((d: any, i: number) => (
                  <div key={d.id} className={i === 0 ? "relative overflow-hidden rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/25 via-background/5 to-background/5 p-6 md:col-span-2 md:p-8" : "rounded-2xl border border-ink-foreground/10 bg-background/5 p-5"}>
                    {i === 0 && <span className="absolute right-4 top-4 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-primary-foreground">Último sorteio</span>}
                    <p className="text-xs uppercase tracking-widest text-ink-foreground/60">{new Date(d.drawn_at + "T12:00:00").toLocaleDateString("pt-BR")}</p>
                    <h3 className={i === 0 ? "mt-1 text-2xl md:text-3xl" : "mt-1 text-xl"}>{d.campaign_title}</h3>
                    <div className="mt-4 flex flex-wrap items-center gap-4">
                      <span className={i === 0 ? "inline-flex h-20 w-20 items-center justify-center rounded-full bg-primary text-xl font-extrabold text-primary-foreground shadow-soft md:h-24 md:w-24 md:text-2xl" : "inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-base font-extrabold text-primary"}>{d.winning_number != null ? formatLuckyNumber(d.winning_number, d.campaigns?.total_quotas) : "—"}</span>
                      <div>
                        <p className="text-xs uppercase tracking-widest text-ink-foreground/60">Ganhador(a)</p>
                        <p className={i === 0 ? "text-xl font-semibold" : "font-semibold"}>{(d.winner_name ?? "").trim().split(/\s+/)[0] || "—"}</p>
                      </div>
                    </div>
                    {d.live_url && <a href={d.live_url} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"><Instagram className="h-4 w-4" />Ver live</a>}
                  </div>
                ))}
              </div>
            ) : <p className="text-ink-foreground/70">{t("draws_empty")}</p>}
          </div>
        </section>

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
          <div className="aspect-[4/5] w-full overflow-hidden rounded-[2rem] bg-muted shadow-soft ring-1 ring-border">{loaded && img("hero") && <img src={img("hero")} alt="Tatuagem realizada por artista TATUAME" fetchPriority="high" className="h-full w-full object-cover" />}</div>
        </section>

        <section aria-label="Garantias" className="border-y bg-card">
          <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 text-sm sm:grid-cols-3">
            {[[ShieldCheck, "Pagamento seguro", "Pix e cartão processados pelo Mercado Pago"], [Ticket, "Números únicos", "Cada número da sorte é exclusivo na campanha"], [Instagram, "Sorteio ao vivo", "Lives no Instagram, todas ficam salvas"]].map(([I, a, b]: any) => (
              <div key={a} className="flex items-start gap-3"><span className="rounded-full bg-primary/10 p-2.5 text-primary"><I className="h-5 w-5" /></span><div><p className="font-semibold">{a}</p><p className="text-muted-foreground">{b}</p></div></div>
            ))}
          </div>
        </section>

        <section id="campanhas" className="py-16 md:py-24">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="mb-10 text-3xl md:text-4xl">{t("campaigns_title")}</h2>
            {campaigns.data?.length ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {campaigns.data.map((c) => (
                  <Link key={c.id} to="/campanha/$id" params={{ id: c.id }} className="group overflow-hidden rounded-2xl border bg-background transition duration-300 hover:-translate-y-1 hover:shadow-soft">
                    <div className="aspect-[4/3] overflow-hidden bg-muted">{c.image_url && <img src={c.image_url} alt={c.title} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />}</div>
                    <div className="space-y-3 p-5">
                      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-widest">
                        <span className="text-muted-foreground">Nº {String(c.serial).padStart(3, "0")}</span>
                        {c.status === "encerrada" && <span className="text-muted-foreground">Encerrada</span>}
                      </div>
                      <h3 className="text-xl">{c.title}</h3>
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary" style={{ width: `${c.public_percent ?? 0}%` }} /></div>
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
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {[{ i: Ticket, t: t("how1_t"), d: t("how1_d") },
              { i: ShieldCheck, t: t("how2_t"), d: t("how2_d") },
              { i: Instagram, t: t("how3_t"), d: t("how3_d") },
              { i: Sparkles, t: t("how4_t"), d: t("how4_d") },
              { i: ArrowRight, t: t("how5_t"), d: t("how5_d") }].map(({ i: I, t: title, d }, n, arr) => (
              <div key={n} className="relative rounded-2xl border bg-card p-6">
                <I className="mb-4 h-6 w-6 text-primary" />
                <p className="text-xs text-muted-foreground">0{n + 1}</p>
                <h3 className="mb-2 text-xl">{title}</h3>
                <p className="text-sm text-muted-foreground">{d}</p>
                {n < arr.length - 1 && <ArrowRight className="absolute -right-4 top-1/2 hidden h-5 w-5 -translate-y-1/2 text-primary lg:block" />}
              </div>
            ))}
          </div>
        </section>

        {!!artists.data?.length && (
          <section id="artistas" className="border-t bg-card py-16 md:py-24">
            <div className="mx-auto max-w-6xl px-4">
              <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
                <h2 className="text-3xl md:text-4xl">{t("artists_title")}</h2>
                <div className="flex flex-wrap gap-2">
                  <select aria-label="Filtrar por cidade" className="h-10 rounded-full border bg-background px-4 text-sm" value={city} onChange={(e) => { setCity(e.target.value); setLimit(8); }}><option value="">Todas as cidades</option>{cities.map((c) => <option key={c}>{c}</option>)}</select>
                  <select aria-label="Filtrar por estilo" className="h-10 max-w-[14rem] rounded-full border bg-background px-4 text-sm" value={style} onChange={(e) => { setStyle(e.target.value); setLimit(8); }}><option value="">Todos os estilos</option>{styles.map((st) => <option key={st}>{st}</option>)}</select>
                </div>
              </div>
              {!filtered.length && <p className="text-muted-foreground">Nenhum artista encontrado com esses filtros.</p>}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {filtered.slice(0, limit).map((a: any) => (
                  <div key={a.id} className="group rounded-2xl border bg-background p-4 transition duration-300 hover:-translate-y-1 hover:shadow-soft">
                    <div className="mb-4 aspect-square overflow-hidden rounded-xl bg-muted">{a.photo_url && <img src={a.photo_url} alt={a.full_name} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />}</div>
                    <h3 className="text-lg">{a.full_name}</h3>
                    <p className="flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{a.city} — {a.state}</p>
                    <a href={`https://instagram.com/${a.instagram.replace("@", "")}`} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm text-primary"><Instagram className="h-3.5 w-3.5" />{a.instagram}</a>
                    {!!a.styles?.length && <p className="mt-2 text-xs text-muted-foreground">{a.styles.join(" · ")}</p>}
                  </div>
                ))}
              </div>
              {filtered.length > limit && <div className="mt-10 text-center"><Button variant="outline" size="lg" onClick={() => setLimit(limit + 8)}>Mostrar mais artistas</Button></div>}
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
