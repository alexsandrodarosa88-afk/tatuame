import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CalendarClock, Loader2, MessageCircle } from "lucide-react";

export const WEEKDAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export type AvailabilitySlot = {
  id: string;
  weekday: number;
  start_time: string;
  end_time: string;
  note: string | null;
};

export const fmtTime = (t: string) => t.slice(0, 5);

export function AvailabilityDialog({
  artistId,
  artistName,
  whatsapp,
  bookingNotes,
  trigger,
}: {
  artistId: string;
  artistName: string;
  whatsapp?: string | null;
  bookingNotes?: string | null;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [selected, setSelected] = useState<AvailabilitySlot | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    supabase
      .from("artist_availability" as any)
      .select("id,weekday,start_time,end_time,note")
      .eq("artist_id", artistId)
      .order("weekday")
      .order("start_time")
      .then(({ data }) => {
        setSlots((data as unknown as AvailabilitySlot[]) ?? []);
        setLoading(false);
      });
  }, [open, artistId]);

  const whatsappLink = () => {
    const phone = (whatsapp ?? "").replace(/\D/g, "");
    const janela = selected
      ? `${WEEKDAYS[selected.weekday]} das ${fmtTime(selected.start_time)} às ${fmtTime(selected.end_time)}`
      : "um horário disponível";
    const msg = `Olá ${artistName}! Vim pelo TATUAME e gostaria de agendar minha tatuagem em ${janela}. Podemos confirmar?`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-lg glass border-white/10">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-black italic uppercase text-white">
            Disponibilidade · {artistName}
          </DialogTitle>
        </DialogHeader>

        {bookingNotes && (
          <p className="text-sm text-muted-foreground italic">{bookingNotes}</p>
        )}

        {loading ? (
          <div className="grid place-items-center py-10 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : slots.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <CalendarClock className="h-8 w-8 text-white/20 mx-auto" />
            <p className="text-sm text-muted-foreground italic">
              Este artista ainda não publicou seus horários. Fale direto com ele para combinar.
            </p>
          </div>
        ) : (
          <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Escolha uma janela de atendimento
            </p>
            {WEEKDAYS.map((day, idx) => {
              const daySlots = slots.filter((s) => s.weekday === idx);
              if (daySlots.length === 0) return null;
              return (
                <div key={day} className="space-y-2">
                  <p className="text-xs font-black uppercase tracking-widest text-white/80">{day}</p>
                  <div className="flex flex-wrap gap-2">
                    {daySlots.map((s) => {
                      const active = selected?.id === s.id;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setSelected(active ? null : s)}
                          className={`rounded-xl px-4 py-2 text-xs font-bold border transition-premium ${
                            active
                              ? "bg-primary text-primary-foreground border-primary"
                              : "glass border-white/10 text-white hover:border-primary/50"
                          }`}
                        >
                          {fmtTime(s.start_time)} — {fmtTime(s.end_time)}
                          {s.note ? <span className="block text-[9px] font-medium opacity-70">{s.note}</span> : null}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {whatsapp ? (
          <Button asChild className="w-full h-12 rounded-xl font-black uppercase tracking-widest">
            <a href={whatsappLink()} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-4 w-4 mr-2" />
              {selected ? "Reservar este horário" : "Falar no WhatsApp"}
            </a>
          </Button>
        ) : (
          <p className="text-xs text-muted-foreground italic text-center">
            Este artista não cadastrou WhatsApp. Entre em contato pelo Instagram.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
