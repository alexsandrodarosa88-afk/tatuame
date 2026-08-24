import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, CalendarClock } from "lucide-react";
import { WEEKDAYS, fmtTime, type AvailabilitySlot } from "./AvailabilityDialog";

export function AvailabilityEditor({ artistId }: { artistId: string }) {
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [weekday, setWeekday] = useState("1");
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("18:00");
  const [note, setNote] = useState("");

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("artist_availability" as any)
      .select("id,weekday,start_time,end_time,note")
      .eq("artist_id", artistId)
      .order("weekday")
      .order("start_time");
    setSlots((data as unknown as AvailabilitySlot[]) ?? []);
    setLoading(false);
  }, [artistId]);

  useEffect(() => { void load(); }, [load]);

  const add = async () => {
    if (end <= start) { toast.error("O horário final deve ser maior que o inicial."); return; }
    setSaving(true);
    const { error } = await supabase.from("artist_availability" as any).insert({
      artist_id: artistId,
      weekday: Number(weekday),
      start_time: start,
      end_time: end,
      note: note.trim() || null,
    } as any);
    setSaving(false);
    if (error) { toast.error("Erro ao salvar: " + error.message); return; }
    setNote("");
    toast.success("Janela de atendimento adicionada.");
    void load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("artist_availability" as any).delete().eq("id", id);
    if (error) { toast.error("Erro ao remover: " + error.message); return; }
    setSlots((s) => s.filter((x) => x.id !== id));
  };

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-primary" />
          <h2 className="font-bold">Disponibilidade de atendimento</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Cadastre os dias e janelas de horário em que você atende. Os clientes veem essas opções no site e escolhem
          uma janela para falar com você no WhatsApp.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <Label>Dia</Label>
            <select
              value={weekday}
              onChange={(e) => setWeekday(e.target.value)}
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              {WEEKDAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
            </select>
          </div>
          <div><Label>Início</Label><Input type="time" value={start} onChange={(e) => setStart(e.target.value)} /></div>
          <div><Label>Fim</Label><Input type="time" value={end} onChange={(e) => setEnd(e.target.value)} /></div>
          <div><Label>Observação (opcional)</Label><Input placeholder="Ex.: só com agendamento" value={note} onChange={(e) => setNote(e.target.value)} /></div>
        </div>
        <Button onClick={add} disabled={saving} variant="outline" className="w-full">
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
          Adicionar janela de horário
        </Button>

        <div className="space-y-2 pt-2">
          {loading ? (
            <div className="grid place-items-center py-6 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /></div>
          ) : slots.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum horário cadastrado ainda.</p>
          ) : (
            slots.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
                <div>
                  <span className="font-semibold">{WEEKDAYS[s.weekday]}</span>{" "}
                  <span className="text-muted-foreground">{fmtTime(s.start_time)} — {fmtTime(s.end_time)}</span>
                  {s.note && <span className="block text-xs text-muted-foreground italic">{s.note}</span>}
                </div>
                <Button size="icon" variant="ghost" onClick={() => remove(s.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
