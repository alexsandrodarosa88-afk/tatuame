import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { reviewArtistQuestionnaire } from "@/lib/artist-questionnaire.functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Check, X, Loader2, Clock, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/aplicacoes")({
 component: AdminAplicacoes,
 head: () => ({ meta: [
  { title: "Cadastros de tatuadores — Admin TATUAME" },
  { name: "description", content: "Aprovação dos questionários de tatuadores TATUAME." },
  { property: "og:title", content: "Cadastros de tatuadores — Admin TATUAME" },
  { property: "og:description", content: "Gestão dos cadastros de parceiros TATUAME." },
  { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
 ] }),
});
type Application = { id: string; full_name: string; email: string; address: string; status: "pending" | "approved" | "rejected"; created_at: string; notes: string | null; whatsapp?: string; phone?: string | null; instagram?: string | null; city?: string; state?: string; postal_code?: string; styles?: string[]; legacy?: boolean };
const labels = { pending: "Pendentes", approved: "Aprovados", rejected: "Reprovados" };
function AdminAplicacoes() {
 const review = useServerFn(reviewArtistQuestionnaire);
 const [rows, setRows] = useState<Application[]>([]);
 const [filter, setFilter] = useState<Application["status"]>("pending");
 const [loading, setLoading] = useState(true);
 const [busyId, setBusyId] = useState<string | null>(null);
 const [reason, setReason] = useState<Record<string, string>>({});
 const load = async () => {
  const [current, legacy] = await Promise.all([
   supabase.from("artist_partner_applications").select("*").order("created_at", { ascending: false }),
   supabase.from("artist_applications").select("id,full_name,email,address,status,created_at,notes,phone,instagram").order("created_at", { ascending: false }),
  ]);
  if (current.error || legacy.error) toast.error("Não foi possível carregar os cadastros.");
  else setRows([...(current.data ?? []).filter((row): row is typeof row & { status: Application["status"] } => row.status === "pending" || row.status === "approved" || row.status === "rejected"), ...(legacy.data ?? []).map(row => ({ ...row, legacy: true }))].sort((a,b) => b.created_at.localeCompare(a.created_at)));
  setLoading(false);
 };
 useEffect(() => {
  void load();
  const channel = supabase.channel("admin-partner-questionnaires").on("postgres_changes", { event: "*", schema: "public", table: "artist_partner_applications" }, () => void load()).subscribe();
  return () => { void supabase.removeChannel(channel); };
 }, []);
 const decide = async (application: Application, approve: boolean) => {
  setBusyId(application.id);
  try {
   if (application.legacy) {
    const result = approve
     ? await supabase.rpc("approve_artist_application", { _application_id: application.id, _grant_free_month: false })
     : await supabase.rpc("reject_artist_application", { _application_id: application.id, _reason: reason[application.id] || undefined });
    if (result.error) throw new Error("Não foi possível revisar o cadastro.");
   } else await review({ data: { id: application.id, approve, notes: reason[application.id] } });
   toast.success(approve ? "Tatuador aprovado." : "Cadastro reprovado."); await load();
  } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível revisar o cadastro."); }
  finally { setBusyId(null); }
 };
 return <div className="space-y-5">
  <h1 className="text-2xl font-bold">Cadastros de tatuadores</h1>
  <div className="flex flex-wrap gap-2">{(Object.keys(labels) as Application["status"][]).map(status => <Button key={status} size="sm" variant={filter === status ? "default" : "outline"} onClick={() => setFilter(status)}>{labels[status]} ({rows.filter(row => row.status === status).length})</Button>)}</div>
  {loading ? <Loader2 className="mx-auto my-10 h-5 w-5 animate-spin" /> : rows.filter(row => row.status === filter).length === 0 ? <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground"><Clock className="h-5 w-5" />Nenhum cadastro nesta categoria.</div> : <div className="grid gap-3">{rows.filter(row => row.status === filter).map(application => {
   const phone = (application.whatsapp ?? application.phone ?? "").replace(/\D/g, "");
   const validPhone = /^(\d{10,11}|55\d{10,11})$/.test(phone);
   const internationalPhone = phone.length <= 11 ? `55${phone}` : phone;
   return <Card key={application.id}><CardContent className="space-y-4 p-5">
    <div className="flex flex-wrap justify-between gap-2"><div><h2 className="font-semibold">{application.full_name}</h2><p className="text-xs text-muted-foreground">Recebido em {new Date(application.created_at).toLocaleString("pt-BR")}</p></div><span className="text-xs text-muted-foreground">{application.legacy ? "Cadastro anterior · " : ""}{labels[application.status]}</span></div>
    <div className="grid gap-2 text-sm sm:grid-cols-2">
     <p className="break-words"><span className="text-muted-foreground">EMAIL:</span> {application.email}</p>
     <p><span className="text-muted-foreground">Whatsapp:</span> {application.whatsapp ?? application.phone ?? "—"}</p>
     <p><span className="text-muted-foreground">Instagram:</span> {application.instagram ?? "—"}</p>
     <p><span className="text-muted-foreground">Cidade / Estado:</span> {[application.city,application.state].filter(Boolean).join(" / ") || "—"}</p>
     <p className="sm:col-span-2"><span className="text-muted-foreground">Endereço:</span> {application.address}{application.postal_code ? ` — CEP ${application.postal_code}` : ""}</p>
     <p className="sm:col-span-2"><span className="text-muted-foreground">Estilo de tattoo:</span> {application.styles?.join(" • ") || "—"}</p>
     {application.notes && <p className="sm:col-span-2 text-muted-foreground">{application.notes}</p>}
    </div>
    <div className="flex flex-wrap gap-2">
     {validPhone && <Button asChild variant="outline" size="sm"><a href={`https://wa.me/${internationalPhone}`} target="_blank" rel="noopener noreferrer"><MessageCircle className="mr-2 h-4 w-4" />Whatsapp</a></Button>}
     {application.status === "pending" && <><Button size="sm" disabled={busyId === application.id} onClick={() => decide(application,true)}>{busyId === application.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}Aprovar</Button><Button variant="outline" size="sm" disabled={busyId === application.id} onClick={() => decide(application,false)}><X className="mr-2 h-4 w-4" />Reprovar</Button></>}
    </div>
    {application.status === "pending" && <Textarea maxLength={1000} rows={2} aria-label={`Observação sobre ${application.full_name}`} placeholder="Observação (opcional)" value={reason[application.id] ?? ""} onChange={event => setReason(previous => ({ ...previous, [application.id]: event.target.value }))} />}
   </CardContent></Card>;
  })}</div>}
 </div>;
}
