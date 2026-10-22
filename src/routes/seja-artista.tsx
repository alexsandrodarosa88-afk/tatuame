import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Navbar, Footer } from "@/components/site/Navbar";
import { db, BRAZIL_STATES } from "@/lib/db";

export const Route = createFileRoute("/seja-artista")({ staticData: { sitemap: true },
  component: Page,
  head: () => ({ meta: [
    { title: "Seja um artista TATUAME — Cadastro" },
    { name: "description", content: "Envie seus dados para fazer parte da rede de artistas TATUAME." },
    { property: "og:title", content: "Seja um artista TATUAME" },
    { property: "og:description", content: "Cadastro de tatuadores para a rede TATUAME." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
});

const schema = z.object({
  full_name: z.string().trim().min(3, "Informe o nome completo").max(120),
  instagram: z.string().trim().min(2, "Informe o Instagram").max(40),
  whatsapp: z.string().regex(/^\d{10,13}$/, "WhatsApp com DDD (só números)"),
  email: z.string().trim().email("Email inválido").max(255),
  city: z.string().trim().min(2, "Informe a cidade").max(80),
  state: z.string().length(2, "Selecione o estado"),
  studio_address: z.string().trim().min(5, "Informe o endereço do estúdio").max(300),
});
type Form = z.infer<typeof schema>;
const empty: Form = { full_name: "", instagram: "", whatsapp: "", email: "", city: "", state: "", studio_address: "" };

function Page() {
  const [form, setForm] = useState<Form>(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const set = (k: keyof Form, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const err = (k: string) => errors[k] && <p className="text-xs text-destructive">{errors[k]}</p>;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const p = schema.safeParse(form);
    if (!p.success) { const n: Record<string, string> = {}; p.error.issues.forEach((i) => (n[String(i.path[0])] = i.message)); setErrors(n); return; }
    setLoading(true); setErrors({});
    try {
      const { error } = await db.from("artist_applications").insert(p.data);
      if (error) throw error;
      setDone(true);
    } catch {
      setErrors({ submit: "Não foi possível enviar. Tente novamente." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-12 md:py-20">
        {done ? (
          <div className="space-y-5 rounded-3xl border bg-card p-10 text-center shadow-soft" role="status">
            <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
            <h1 className="text-3xl">Cadastro em análise</h1>
            <p className="text-lg text-muted-foreground">Cadastro em análise, você vai receber uma mensagem no seu WhatsApp.</p>
            <Button asChild><Link to="/">Voltar ao site</Link></Button>
          </div>
        ) : (
          <>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-primary">Rede de artistas</p>
            <h1 className="mb-3 text-4xl md:text-5xl">Seja um artista TATUAME</h1>
            <p className="mb-10 text-muted-foreground">Preencha todos os campos. Nossa equipe analisa e retorna pelo WhatsApp.</p>
            <form onSubmit={submit} className="grid gap-5 rounded-3xl border bg-card p-6 shadow-soft sm:grid-cols-2 md:p-8">
              <div className="space-y-2 sm:col-span-2"><Label htmlFor="n">Nome completo</Label><Input id="n" value={form.full_name} onChange={(e) => set("full_name", e.target.value)} maxLength={120} />{err("full_name")}</div>
              <div className="space-y-2"><Label htmlFor="i">Instagram</Label><Input id="i" placeholder="@seuperfil" value={form.instagram} onChange={(e) => set("instagram", e.target.value)} maxLength={40} />{err("instagram")}</div>
              <div className="space-y-2"><Label htmlFor="w">WhatsApp</Label><Input id="w" inputMode="numeric" placeholder="DDD + número" value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value.replace(/\D/g, ""))} maxLength={13} />{err("whatsapp")}</div>
              <div className="space-y-2 sm:col-span-2"><Label htmlFor="e">Email</Label><Input id="e" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} maxLength={255} />{err("email")}</div>
              <div className="space-y-2"><Label htmlFor="c">Cidade</Label><Input id="c" value={form.city} onChange={(e) => set("city", e.target.value)} maxLength={80} />{err("city")}</div>
              <div className="space-y-2"><Label htmlFor="s">Estado</Label>
                <select id="s" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.state} onChange={(e) => set("state", e.target.value)}>
                  <option value="">Selecione</option>{BRAZIL_STATES.map((u) => <option key={u}>{u}</option>)}
                </select>{err("state")}</div>
              <div className="space-y-2 sm:col-span-2"><Label htmlFor="a">Endereço completo do estúdio</Label><Textarea id="a" rows={3} value={form.studio_address} onChange={(e) => set("studio_address", e.target.value)} maxLength={300} />{err("studio_address")}</div>
              {errors.submit && <p className="text-sm text-destructive sm:col-span-2">{errors.submit}</p>}
              <Button type="submit" size="lg" disabled={loading} className="sm:col-span-2">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar cadastro"}</Button>
            </form>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
