import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Brush, CheckCircle2, ArrowLeft, Loader2 } from "lucide-react";
import { TATTOO_STYLES } from "@/lib/tattoo-styles";
import { BRAZIL_STATES, artistQuestionnaireSchema } from "@/lib/artist-questionnaire";
import { submitArtistQuestionnaire } from "@/lib/artist-questionnaire.functions";
import logo from "@/assets/tatuame-logo-new.png.asset.json";

export const Route = createFileRoute("/cadastro-tatuador")({
  component: SignupArtistPage,
  head: () => ({ meta: [
    { title: "Faça parte do TATUAME — Cadastro de tatuador" },
    { name: "description", content: "Envie seu cadastro de tatuador para aprovação da equipe TATUAME." },
    { property: "og:title", content: "Faça parte do TATUAME — Cadastro de tatuador" },
    { property: "og:description", content: "Cadastre seus contatos, localização e estilos de tattoo no TATUAME." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
});

function SignupArtistPage() {
  const send = useServerFn(submitArtistQuestionnaire);
  const [form, setForm] = useState({ full_name: "", email: "", whatsapp: "", instagram: "", address: "", postal_code: "", city: "", state: "", styles: [] as string[] });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const change = (key: keyof typeof form, value: string) => setForm(previous => ({ ...previous, [key]: value }));
  const valid = artistQuestionnaireSchema.safeParse(form).success;
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (loading) return;
    const parsed = artistQuestionnaireSchema.safeParse(form);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      parsed.error.issues.forEach(issue => { next[String(issue.path[0])] = issue.message; });
      setErrors(next); return;
    }
    setLoading(true); setErrors({});
    try { await send({ data: parsed.data }); setDone(true); }
    catch { setErrors({ submit: "Não foi possível enviar seu cadastro. Tente novamente." }); }
    finally { setLoading(false); }
  };
  const fieldError = (key: string) => errors[key] ? <p role="alert" className="text-xs text-destructive">{errors[key]}</p> : null;
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-5">
          <Link to="/" aria-label="TATUAME — página inicial"><img src={logo.url} alt="TATUAME" className="h-9 w-auto" /></Link>
          <Button asChild variant="ghost" size="sm"><Link to="/"><ArrowLeft className="mr-2 h-4 w-4" />Voltar ao site</Link></Button>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-10 md:py-14">
        {done ? (
          <div className="mx-auto max-w-xl space-y-6 py-12 text-center" role="status">
            <CheckCircle2 className="mx-auto h-14 w-14 text-primary" />
            <h1 className="font-display text-2xl font-bold">Cadastro enviado para aprovação!</h1>
            <p className="text-lg leading-relaxed">Você esta quase lá, logo você receberá no seu whats uma retorno da equipe TATUAME</p>
            <Button asChild><Link to="/">Voltar ao site</Link></Button>
          </div>
        ) : (
          <>
            <div className="mb-8 space-y-3">
              <Brush className="h-8 w-8 text-primary" />
              <h1 className="font-display text-3xl font-black uppercase md:text-4xl">FAÇA PARTE DO TATUAME</h1>
            </div>
            <form onSubmit={submit} className="space-y-6">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2"><Label htmlFor="full_name">Nome completo *</Label><Input id="full_name" autoComplete="name" maxLength={120} value={form.full_name} onChange={e => change("full_name", e.target.value)} required />{fieldError("full_name")}</div>
                <div className="space-y-2"><Label htmlFor="email">EMAIL *</Label><Input id="email" type="email" autoComplete="email" maxLength={255} value={form.email} onChange={e => change("email", e.target.value)} required />{fieldError("email")}</div>
                <div className="space-y-2"><Label htmlFor="whatsapp">Whatsapp *</Label><Input id="whatsapp" type="tel" autoComplete="tel" maxLength={13} value={form.whatsapp} onChange={e => change("whatsapp", e.target.value.replace(/\D/g, ""))} required />{fieldError("whatsapp")}</div>
                <div className="space-y-2 sm:col-span-2"><Label htmlFor="instagram">Instagram *</Label><Input id="instagram" maxLength={31} value={form.instagram} onChange={e => change("instagram", e.target.value)} required />{fieldError("instagram")}</div>
                <div className="space-y-2 sm:col-span-2"><Label htmlFor="address">Endereço completo *</Label><Textarea id="address" autoComplete="street-address" maxLength={300} rows={2} value={form.address} onChange={e => change("address", e.target.value)} required />{fieldError("address")}</div>
                <div className="space-y-2"><Label htmlFor="postal_code">CEP *</Label><Input id="postal_code" autoComplete="postal-code" inputMode="numeric" maxLength={8} value={form.postal_code} onChange={e => change("postal_code", e.target.value.replace(/\D/g, ""))} required />{fieldError("postal_code")}</div>
                <div className="space-y-2"><Label htmlFor="city">Cidade *</Label><Input id="city" autoComplete="address-level2" maxLength={80} value={form.city} onChange={e => change("city", e.target.value)} required />{fieldError("city")}</div>
                <div className="space-y-2"><Label htmlFor="state">Estado *</Label><select id="state" autoComplete="address-level1" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground" value={form.state} onChange={e => change("state", e.target.value)} required><option value="">Estado</option>{BRAZIL_STATES.map(uf => <option key={uf} value={uf}>{uf}</option>)}</select>{fieldError("state")}</div>
              </div>
              <fieldset className="space-y-3">
                <legend className="mb-3 text-sm font-medium">Estilo de tattoo *</legend>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
                  {TATTOO_STYLES.map(style => <label key={style} className="flex min-h-9 cursor-pointer items-center gap-2 text-sm"><Checkbox checked={form.styles.includes(style)} onCheckedChange={checked => setForm(previous => ({ ...previous, styles: checked === true ? [...previous.styles, style] : previous.styles.filter(item => item !== style) }))} /><span>{style}</span></label>)}
                </div>
                {fieldError("styles")}
              </fieldset>
              {fieldError("submit")}
              <Button type="submit" disabled={loading || !valid} className="h-12 w-full font-bold">{loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enviando...</> : "Enviar cadastro para aprovação"}</Button>
            </form>
          </>
        )}
      </main>
    </div>
  );
}
