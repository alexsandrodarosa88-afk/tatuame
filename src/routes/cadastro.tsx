import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { z } from "zod";
import { Brush } from "lucide-react";

export const Route = createFileRoute("/cadastro")({
  component: SignupPage,
  validateSearch: (s: Record<string, unknown>) => ({ next: typeof s.next === "string" ? s.next : undefined }),
});

const schema = z.object({
  nome_completo: z.string().trim().min(3, "Nome completo é obrigatório").max(120),
  email: z.string().trim().email("Email válido é obrigatório").max(255),
  password: z.string().min(8, "Senha de no mínimo 8 caracteres é obrigatória").max(72),
  cpf: z.string().regex(/^\d{11}$/, "CPF (11 dígitos) é obrigatório"),
  telefone: z.string().regex(/^\d{10,11}$/, "Telefone com DDD é obrigatório"),
  cidade: z.string().trim().min(2, "Cidade é obrigatória").max(80),
  data_nascimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data de nascimento é obrigatória"),
});

function SignupPage() {
  const navigate = useNavigate();
  const { next } = useSearch({ from: "/cadastro" });
  const dest = next || "/campanhas";
  const [form, setForm] = useState({ nome_completo: "", email: "", password: "", cpf: "", telefone: "", cidade: "", data_nascimento: "" });
  const [loading, setLoading] = useState(false);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });
  const onlyDigits = (k: "cpf" | "telefone") => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value.replace(/\D/g, "") });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      parsed.error.issues.forEach((i) => toast.error(i.message));
      return;
    }
    // garante que nenhum campo ficou em branco
    for (const [k, v] of Object.entries(form)) {
      if (!String(v ?? "").trim()) {
        toast.error("Preencha todos os campos obrigatórios para criar sua conta.");
        return;
      }
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}${dest}`,
        data: {
          nome_completo: form.nome_completo,
          cpf: form.cpf,
          telefone: form.telefone,
          cidade: form.cidade,
          data_nascimento: form.data_nascimento,
        },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Conta criada! Confirme seu email para entrar.");
    navigate({ to: "/login", search: next ? { next } as any : undefined });
  };

  const google = async () => {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + dest });
    if (r.error) toast.error("Falha no Google");
  };

  return (
    <div className="min-h-screen grid place-items-center bg-background px-4 py-12">
      <Card className="w-full max-w-md p-8 space-y-5">
        <div>
          <h1 className="font-display text-3xl font-bold">{next === "/tatuador" ? "Cadastro de Tatuador" : "Criar conta"}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {next === "/tatuador"
              ? "Crie sua conta. Em seguida você completa o cadastro de tatuador para aprovação."
              : "Garanta sua próxima tatuagem"}
          </p>
        </div>
        <Button onClick={google} variant="outline" className="w-full">Continuar com Google</Button>
        <div className="flex items-center gap-3 text-xs text-muted-foreground"><div className="h-px bg-border flex-1" />ou<div className="h-px bg-border flex-1" /></div>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5"><Label>Nome completo *</Label><Input value={form.nome_completo} onChange={set("nome_completo")} required /></div>
          <div className="space-y-1.5"><Label>Email *</Label><Input type="email" value={form.email} onChange={set("email")} required /></div>
          <div className="space-y-1.5"><Label>Senha (mín. 8) *</Label><Input type="password" value={form.password} onChange={set("password")} required /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>CPF *</Label><Input value={form.cpf} onChange={onlyDigits("cpf")} maxLength={11} placeholder="00000000000" required /></div>
            <div className="space-y-1.5"><Label>Telefone *</Label><Input value={form.telefone} onChange={onlyDigits("telefone")} maxLength={11} placeholder="11999999999" required /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Data de nascimento *</Label><Input type="date" value={form.data_nascimento} onChange={set("data_nascimento")} required /></div>
            <div className="space-y-1.5"><Label>Cidade *</Label><Input value={form.cidade} onChange={set("cidade")} required /></div>
          </div>
          <p className="text-xs text-muted-foreground">* Todos os campos são obrigatórios.</p>
          <Button type="submit" disabled={loading} className="w-full bg-primary hover:bg-[var(--primary-glow)] mt-2">{loading ? "Criando..." : "Criar conta"}</Button>
        </form>
        <div className="text-sm text-muted-foreground text-center">
          Já tem conta?{" "}
          <Link to="/login" search={next ? { next } as any : undefined} className="text-primary font-medium">Entrar</Link>
        </div>
        <div className="rounded-md border border-primary/30 bg-primary/5 p-3 text-sm flex items-start gap-2">
          <Brush className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-foreground">É tatuador?</p>
            <p className="text-xs text-muted-foreground">
              Use um email diferente do de cliente.{" "}
              <Link to="/cadastro-tatuador" className="text-primary font-medium">Cadastrar como tatuador</Link>.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
