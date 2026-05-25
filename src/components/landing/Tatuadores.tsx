import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { MapPin, ArrowRight } from "lucide-react";

type Artist = {
  id: string;
  name: string;
  photo_url: string | null;
  styles: string[] | null;
  city: string | null;
  state: string | null;
};

export function Tatuadores() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("tattoo_artists_public" as any)
        .select("id,name,photo_url,styles,city,state")
        .order("name", { ascending: true })
        .limit(12);
      if (data) setArtists(data as Artist[]);
      setLoading(false);
    })();
  }, []);

  if (!loading && artists.length === 0) return null;

  return (
    <section id="tatuadores" className="py-16 md:py-24 bg-muted/20 border-y border-border">
      <div className="container mx-auto px-4">
        <header className="mb-8 md:mb-12 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-xs md:text-sm uppercase tracking-widest text-primary font-semibold mb-2">Artistas parceiros</p>
            <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight">
              Tatuadores participantes do TATUAME
            </h2>
            <p className="mt-3 text-muted-foreground text-sm md:text-base">
              Conheça os artistas que fazem parte da nossa rede. Escolha seu estilo, sua cidade e seu tatuador.
            </p>
          </div>
          <Button asChild size="lg" variant="outline" className="self-start md:self-auto shrink-0">
            <Link to="/tatuadores">Ver todos <ArrowRight className="h-4 w-4 ml-1" /></Link>
          </Button>
        </header>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
            {artists.map((a) => (
              <Link
                key={a.id}
                to="/tatuadores"
                className="group block rounded-lg overflow-hidden bg-card border border-border hover:border-primary/60 hover:shadow-[var(--shadow-elegant)] transition-all"
              >
                <div className="aspect-square bg-muted overflow-hidden">
                  {a.photo_url ? (
                    <img
                      src={a.photo_url}
                      alt={a.name}
                      loading="lazy"
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="h-full w-full grid place-items-center text-4xl text-muted-foreground font-display">
                      {a.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="p-2 md:p-3">
                  <h3 className="font-semibold text-sm md:text-base leading-tight truncate">{a.name}</h3>
                  {a.styles && a.styles.length > 0 && (
                    <p className="text-[11px] md:text-xs text-muted-foreground truncate mt-0.5">
                      {a.styles.slice(0, 2).join(" • ")}
                    </p>
                  )}
                  {(a.city || a.state) && (
                    <p className="flex items-center gap-1 text-[11px] md:text-xs text-muted-foreground mt-1">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate">{[a.city, a.state].filter(Boolean).join("/")}</span>
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-8 text-center md:hidden">
          <Button asChild size="lg" className="w-full">
            <Link to="/tatuadores">Ver todos os tatuadores <ArrowRight className="h-4 w-4 ml-1" /></Link>
          </Button>
        </div>
      </div>
    </section>
  );
}