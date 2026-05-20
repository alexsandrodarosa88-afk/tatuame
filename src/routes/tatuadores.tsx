import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/landing/Navbar";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Instagram, MapPin, MessageCircle, Search } from "lucide-react";

export const Route = createFileRoute("/tatuadores")({
  head: () => ({
    meta: [
      { title: "Tatuadores — Tatua.me" },
      { name: "description", content: "Conheça os tatuadores parceiros do Tatua.me. Filtre por estilo, cidade ou estado e encontre o artista ideal para sua próxima tatuagem." },
      { property: "og:title", content: "Tatuadores — Tatua.me" },
      { property: "og:description", content: "Portfólio dos tatuadores parceiros do Tatua.me." },
    ],
  }),
  component: TatuadoresPage,
});

type Artist = {
  id: string;
  name: string;
  photo_url: string | null;
  styles: string[];
  city: string | null;
  state: string | null;
  address: string | null;
  instagram: string | null;
  whatsapp: string | null;
};

function TatuadoresPage() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [style, setStyle] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("tattoo_artists")
        .select("id,name,photo_url,styles,city,state,address,instagram,whatsapp")
        .eq("is_active", true)
        .order("name", { ascending: true });
      if (!error && data) setArtists(data as Artist[]);
      setLoading(false);
    })();
  }, []);

  const styles = useMemo(
    () => Array.from(new Set(artists.flatMap((a) => a.styles ?? []))).sort(),
    [artists],
  );
  const cities = useMemo(
    () => Array.from(new Set(artists.map((a) => a.city).filter(Boolean) as string[])).sort(),
    [artists],
  );
  const states = useMemo(
    () => Array.from(new Set(artists.map((a) => a.state).filter(Boolean) as string[])).sort(),
    [artists],
  );

  const filtered = artists.filter((a) => {
    if (q && !a.name.toLowerCase().includes(q.toLowerCase())) return false;
    if (style && !(a.styles ?? []).includes(style)) return false;
    if (city && a.city !== city) return false;
    if (state && a.state !== state) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          <header className="mb-8 max-w-2xl">
            <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">Tatuadores</h1>
            <p className="mt-2 text-muted-foreground">
              Conheça os artistas parceiros do Tatua.me. Filtre por estilo, cidade ou estado.
            </p>
          </header>

          <div className="grid gap-3 md:grid-cols-4 mb-8">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="pl-9"
              />
            </div>
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
            >
              <option value="">Todos os estilos</option>
              {styles.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="h-9 rounded-md border border-input bg-transparent px-2 text-sm"
              >
                <option value="">Estado</option>
                {states.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="h-9 rounded-md border border-input bg-transparent px-2 text-sm"
              >
                <option value="">Cidade</option>
                {cities.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {loading ? (
            <p className="text-muted-foreground">Carregando tatuadores...</p>
          ) : filtered.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-10 text-center text-muted-foreground">
              <p className="mb-1">Nenhum tatuador encontrado.</p>
              <p className="text-sm">Em breve novos artistas chegam ao Tatua.me.</p>
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {filtered.map((a) => (
                <Card key={a.id} className="overflow-hidden hover:shadow-[var(--shadow-elegant)] transition-shadow">
                  <div className="aspect-square bg-muted overflow-hidden">
                    {a.photo_url ? (
                      <img src={a.photo_url} alt={a.name} loading="lazy" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full grid place-items-center text-3xl text-muted-foreground font-display">
                        {a.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <CardContent className="p-3 space-y-2">
                    <div>
                      <h3 className="font-semibold leading-tight truncate">{a.name}</h3>
                      {a.styles?.length > 0 && (
                        <p className="text-xs text-muted-foreground truncate">{a.styles.join(" • ")}</p>
                      )}
                    </div>
                    {(a.city || a.state) && (
                      <p className="flex items-start gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 mt-0.5 shrink-0" />
                        <span className="truncate">
                          {[a.address, a.city, a.state].filter(Boolean).join(", ")}
                        </span>
                      </p>
                    )}
                    <div className="flex gap-2 pt-1">
                      {a.instagram && (
                        <Button asChild size="sm" variant="outline" className="h-8 px-2 flex-1">
                          <a
                            href={`https://instagram.com/${a.instagram.replace(/^@/, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Instagram className="h-3.5 w-3.5" />
                          </a>
                        </Button>
                      )}
                      {a.whatsapp && (
                        <Button asChild size="sm" variant="outline" className="h-8 px-2 flex-1">
                          <a
                            href={`https://wa.me/${a.whatsapp.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
