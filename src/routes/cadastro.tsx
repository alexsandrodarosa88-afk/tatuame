import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Navbar } from "@/components/site/Navbar";

export const Route = createFileRoute("/cadastro")({ staticData: { sitemap: false },
  component: Signup,
  head: () => ({ meta: [
    { title: "Criar conta | TATUAME" }, { name: "description", content: "Crie sua conta para participar dos sorteios TATUAME." },
    { property: "og:title", content: "Criar conta | TATUAME" }, { property: "og:description", content: "Participe dos sorteios TATUAME." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
});

const schema = z.object({
  nome_completo: z.string().trim().min(3, "Nome completo obrigatório").max(120),
  email: z.string().trim().email("Email inválido").max(255),
  password: z.string().min(8, "Senha com no mínimo 8 caracteres").max(72),
  cpf: z.string().regex(/^\d{11}$/, "CPF com 11 números"),
  telefone: z.string().regex(/^\d{10,11}$/, "Telefone com DDD"),
  cidade: z.string().trim().min(2, "Cidade obrigatória").max(80),
});

function Signup() {
  const navigate = useNavigate();
  const [f, setF] = useState({ nome_completo: "", email: "", password: "", cpf: "", telefone: "", cidade: "" });
  const [loading, setLoading] = useState(false);
  const field = (k: keyof typeof f, label: string, opts: { type?: string; digits?: boolean; max?: number } = {}) => (
    <div className="space-y-2"><Label htmlFor={k}>{label}</Label>
      <Input id={k} type={opts.type ?? "text"} maxLength={opts.max} value={f[k]} onChange={(e) => setF({ ...f, [k]: opts.digits ? e.target.value.replace(/\D/g, "") : e.target.value })} /></div>
  );
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const p = schema.safeParse(f);
    if (!p.success) return toast.error(p.error.issues[0].message);
    setLoading(true);
    const { email, password, ...meta } = p.data;
    const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/login`, data: meta } });
    setLoading(false);
    if (error) return toast.error(error.message);
    if (data.session) navigate({ to: "/conta" });
    else { toast.success("Conta criada! Confirme pelo link enviado ao seu email."); navigate({ to: "/login", search: { next: undefined } }); }
  };
  return (
    <div className="min-h-screen"><Navbar />
      <main className="mx-auto max-w-md px-4 py-16">
        <form onSubmit={submit} className="space-y-4 rounded-3xl border bg-card p-8 shadow-soft">
          <h1 className="text-3xl">Criar conta</h1>
          {field("nome_completo", "Nome completo", { max: 120 })}
          {field("email", "Email", { type: "email", max: 255 })}
          {field("password", "Senha", { type: "password", max: 72 })}
          <div className="grid grid-cols-2 gap-3">{field("cpf", "CPF", { digits: true, max: 11 })}{field("telefone", "WhatsApp", { digits: true, max: 11 })}</div>
          {field("cidade", "Cidade", { max: 80 })}
          <Button className="w-full" size="lg" disabled={loading}>{loading ? "Criando..." : "Criar conta"}</Button>
          <p className="text-center text-sm text-muted-foreground">Já tem conta? <Link to="/login" search={{ next: undefined }} className="text-primary">Entrar</Link></p>
        </form>
      </main>
    </div>
  );
}
