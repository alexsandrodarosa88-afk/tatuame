import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { MapPin, ArrowRight, Instagram } from "lucide-react";

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
      if (data) setArtists(data as unknown as Artist[]);
      setLoading(false);
    })();
  }, []);

  if (!loading && artists.length === 0) return null;

  return (
    <section id="tatuadores" className="py-32 relative">
      <div className="container mx-auto px-4">
        <header className="mb-20 flex flex-col md:flex-row md:items-end md:justify-between gap-8 animate-reveal">
          <div className="max-w-2xl">
            <div className="inline-block px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-4">
              Curadoria Select
            </div>
            <h2 className="font-display text-4xl md:text-6xl font-black text-white italic uppercase leading-tight">
              Artistas <span className="text-primary text-glow">Tatuame</span>
            </h2>
            <p className="mt-4 text-muted-foreground text-lg md:text-xl font-medium">
              Conheça os profissionais que transformam ideias em obras de arte exclusivas.
            </p>
          </div>
          <Button asChild size="lg" variant="outline" className="glass h-12 px-8 font-bold uppercase tracking-widest transition-premium group">
            <Link to="/tatuadores">Ver todos os artistas <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" /></Link>
          </Button>
        </header>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] rounded-3xl bg-white/5 animate-pulse border border-white/5" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {artists.map((a) => (
              <ArtistCard key={a.id} artist={a} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function ArtistCard({ artist }: { artist: Artist }) {
  return (
    <Link
      to="/tatuadores"
      className="group relative flex flex-col glass rounded-[2rem] overflow-hidden transition-premium hover:-translate-y-2 hover:border-primary/40 hover:shadow-elegant"
    >
      <div className="aspect-[3/4] bg-muted overflow-hidden relative">
        {artist.photo_url ? (
          <img
            src={artist.photo_url}
            alt={artist.name}
            loading="lazy"
            className="h-full w-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-premium duration-700 scale-100 group-hover:scale-110"
          />
        ) : (
          <div className="h-full w-full grid place-items-center text-5xl text-white/10 font-black italic uppercase">
            {artist.name.charAt(0)}
          </div>
        )}
        {/* Overlay info */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-80" />
        
        <div className="absolute bottom-4 inset-x-4">
          <h3 className="font-display text-lg font-black text-white italic uppercase truncate tracking-tight">{artist.name}</h3>
          {(artist.city || artist.state) && (
            <div className="flex items-center gap-1 text-[9px] text-white/70 font-bold uppercase tracking-widest mt-0.5">
              <MapPin className="h-2.5 w-2.5 text-primary" />
              <span className="truncate">{[artist.city, artist.state].filter(Boolean).join(" / ")}</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="p-4 bg-card/50">
        <div className="flex flex-wrap gap-1 mb-3 min-h-[1.5rem]">
          {artist.styles?.slice(0, 2).map(style => (
            <span key={style} className="text-[8px] font-black uppercase border border-white/10 px-1.5 py-0.5 rounded text-muted-foreground tracking-tighter">
              {style}
            </span>
          ))}
        </div>
        <Button variant="ghost" size="sm" className="w-full h-8 text-[9px] font-black uppercase tracking-widest text-primary hover:bg-primary hover:text-white transition-premium border border-primary/20">
          Ver Perfil
        </Button>
      </div>
    </Link>
  );
}
