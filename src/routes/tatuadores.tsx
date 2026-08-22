import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/landing/Navbar";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Instagram, MapPin, MessageCircle, Search, Filter, X } from "lucide-react";

export const Route = createFileRoute("/tatuadores")({
  head: () => ({
    meta: [
      { title: "Artistas TATUAME — Curadoria de Elite" },
      { name: "description", content: "Conheça os tatuadores parceiros do TATUAME. Filtre por estilo, cidade ou estado e encontre o artista ideal para sua próxima tatuagem." },
      { property: "og:title", content: "Artistas TATUAME — Curadoria de Elite" },
      { property: "og:description", content: "Portfólio dos tatuadores parceiros do TATUAME." },
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
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("tattoo_artists_public" as any)
        .select("id,name,photo_url,styles,city,state,address,instagram,whatsapp")
        .order("name", { ascending: true });
      if (!error && data) setArtists(data as unknown as Artist[]);
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

  const clearFilters = () => {
    setQ("");
    setStyle("");
    setCity("");
    setState("");
  };

  const hasActiveFilters = q || style || city || state;

  return (
    <div className="min-h-screen bg-background text-foreground animate-fade-in">
      <Navbar />
      <main className="pt-32 pb-20">
        <div className="container mx-auto px-4">
          <header className="mb-12 max-w-4xl space-y-4">
            <div className="inline-block px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black text-primary uppercase tracking-[0.3em]">
              Curadoria Select
            </div>
            <h1 className="font-display text-4xl md:text-6xl font-black text-white italic uppercase leading-none">
              Artistas <span className="text-primary text-glow">Tatuame</span>
            </h1>
            <p className="text-muted-foreground font-medium italic text-lg max-w-xl">
              Descubra os profissionais mais talentosos do Brasil e encontre a arte perfeita para sua pele.
            </p>
          </header>

          <div className="flex flex-col gap-6 mb-12">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Buscar artista por nome..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="pl-12 h-14 glass rounded-2xl border-white/5 font-medium italic text-lg focus:border-primary/50 transition-premium"
                />
              </div>
              <Button 
                onClick={() => setShowFilters(!showFilters)}
                className={`h-14 px-8 glass rounded-2xl font-black uppercase tracking-widest transition-premium ${showFilters ? 'text-primary border-primary/40' : 'text-white'}`}
              >
                <Filter className="h-5 w-5 mr-2" /> 
                {showFilters ? 'Fechar Filtros' : 'Filtros'}
              </Button>
            </div>

            {showFilters && (
              <div className="glass rounded-[2rem] p-8 grid md:grid-cols-4 gap-6 animate-reveal">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block ml-1">Estilo</label>
                  <select
                    value={style}
                    onChange={(e) => setStyle(e.target.value)}
                    className="w-full h-12 glass rounded-xl px-4 text-sm font-bold bg-card"
                  >
                    <option value="">Todos os estilos</option>
                    {styles.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block ml-1">Estado</label>
                  <select
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full h-12 glass rounded-xl px-4 text-sm font-bold bg-card"
                  >
                    <option value="">Brasil inteiro</option>
                    {states.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block ml-1">Cidade</label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full h-12 glass rounded-xl px-4 text-sm font-bold bg-card"
                  >
                    <option value="">Todas as cidades</option>
                    {cities.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="flex items-end">
                  {hasActiveFilters && (
                    <Button 
                      variant="ghost" 
                      onClick={clearFilters}
                      className="w-full h-12 text-xs font-black uppercase text-muted-foreground hover:text-primary transition-colors"
                    >
                      <X className="h-4 w-4 mr-2" /> Limpar Filtros
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          {loading ? (
            <div className="grid gap-6 grid-cols-2 md:grid-cols-4 lg:grid-cols-5 animate-pulse">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="aspect-[3/4] rounded-[2rem] bg-white/5 border border-white/5" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="glass rounded-[3rem] p-20 text-center space-y-4">
              <Search className="h-12 w-12 text-white/20 mx-auto" />
              <h3 className="font-display text-2xl font-black text-white italic uppercase">Nenhum artista encontrado</h3>
              <p className="text-muted-foreground font-medium italic">Tente mudar os filtros para encontrar novos tatuadores.</p>
              <Button onClick={clearFilters} variant="link" className="text-primary font-black uppercase tracking-widest">Ver todos</Button>
            </div>
          ) : (
            <div className="grid gap-6 grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
              {filtered.map((a) => (
                <ArtistCard key={a.id} artist={a} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function ArtistCard({ artist }: { artist: Artist }) {
  return (
    <Card className="group relative flex flex-col glass rounded-[2.5rem] overflow-hidden transition-premium hover:-translate-y-2 hover:border-primary/40 hover:shadow-elegant">
      <div className="aspect-[3/4] bg-muted overflow-hidden relative">
        {artist.photo_url ? (
          <img 
            src={artist.photo_url} 
            alt={artist.name} 
            loading="lazy" 
            className="h-full w-full object-cover grayscale-[0.4] group-hover:grayscale-0 transition-premium duration-1000 scale-100 group-hover:scale-110" 
          />
        ) : (
          <div className="h-full w-full grid place-items-center text-5xl text-white/5 font-black italic uppercase">
            {artist.name.charAt(0)}
          </div>
        )}
        
        {/* Shadow Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-transparent to-transparent opacity-80" />
        
        {/* Info */}
        <div className="absolute bottom-6 inset-x-6 space-y-2">
          <h3 className="font-display text-xl font-black text-white italic uppercase tracking-tight leading-[0.9] truncate">{artist.name}</h3>
          {(artist.city || artist.state) && (
            <div className="flex items-center gap-1.5 text-[9px] text-white/60 font-black uppercase tracking-widest">
              <MapPin className="h-3 w-3 text-primary shrink-0" />
              <span className="truncate">{[artist.city, artist.state].filter(Boolean).join(" / ")}</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="p-6 pt-5 bg-card/40 flex flex-col gap-5">
        <div className="flex flex-wrap gap-1 min-h-[1.5rem]">
          {artist.styles?.slice(0, 3).map(style => (
            <span key={style} className="text-[8px] font-black uppercase border border-white/5 bg-white/5 px-2 py-0.5 rounded-full text-muted-foreground tracking-tighter">
              {style}
            </span>
          ))}
        </div>
        
        <div className="flex gap-2">
          {artist.instagram && (
            <Button asChild size="icon" variant="ghost" className="h-10 w-10 rounded-xl glass hover:text-primary transition-premium border-white/5">
              <a href={`https://instagram.com/${artist.instagram.replace(/^@/, "")}`} target="_blank" rel="noopener noreferrer">
                <Instagram className="h-4 w-4" />
              </a>
            </Button>
          )}
          {artist.whatsapp && (
            <Button asChild size="icon" variant="ghost" className="h-10 w-10 rounded-xl glass hover:text-primary transition-premium border-white/5">
              <a href={`https://wa.me/${artist.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-4 w-4" />
              </a>
            </Button>
          )}
          <Button variant="ghost" className="flex-1 h-10 glass rounded-xl text-[9px] font-black uppercase tracking-widest hover:text-white hover:bg-primary transition-premium border-white/5">
            VER PERFIL
          </Button>
        </div>
      </div>
    </Card>
  );
}

