import { Play } from "lucide-react";
import { useState } from "react";

export function TestimonialVideo() {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <section className="py-24 border-t border-border bg-background relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="text-xs uppercase tracking-[0.2em] text-primary font-semibold mb-3">Depoimento</div>
          <h2 className="font-display text-4xl md:text-6xl font-bold mb-6">
            A Experiência <span className="text-primary italic">TATUAME</span>
          </h2>
          <p className="text-foreground/60 text-lg">
            Veja como transformamos o sonho da nova tattoo em realidade para centenas de clientes em todo o Brasil.
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="relative aspect-video rounded-2xl overflow-hidden border border-border group cursor-pointer shadow-2xl shadow-primary/10">
            {!isPlaying ? (
              <>
                <img 
                  src="https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?q=80&w=2071&auto=format&fit=crop" 
                  alt="Cliente TATUAME" 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                  <button 
                    onClick={() => setIsPlaying(true)}
                    className="w-20 h-20 bg-primary text-white rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-xl"
                  >
                    <Play className="fill-current ml-1" />
                  </button>
                </div>
                <div className="absolute bottom-6 left-6 right-6 p-6 glass rounded-xl border border-white/10 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500">
                  <div className="font-bold text-lg">"Não acreditei até ver minha tattoo pronta"</div>
                  <div className="text-sm text-white/70">Lucas Silveira — São Paulo, SP</div>
                </div>
              </>
            ) : (
              <iframe
                className="w-full h-full"
                src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"
                title="Depoimento Cliente TATUAME"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            )}
          </div>
        </div>
      </div>
      
      {/* Decorative elements */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-64 h-64 bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/5 blur-[150px] pointer-events-none" />
    </section>
  );
}
