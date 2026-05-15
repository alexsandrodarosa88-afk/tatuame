import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { z } from "zod";

export const Route = createFileRoute("/cadastro")({ component: SignupPage });

const schema = z.object({
  nome_completo: z.string().min(3, "Nome muito curto").max(120),
  email: z.string().email("Email inválido").max(255),
  password: z.string().min(8, "Mínimo 8 caracteres").max(72),
  cpf: z.string().regex(/^\d{11}$/, "CPF deve ter 11 dígitos"),
  telefone: z.string().regex(/^\d{10,11}$/, "Telefone com DDD (10 ou 11 dígitos)"),
  cidade: z.string().min(2).max(80),
});

function SignupPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ nome_completo: "", email: "", password: "", cpf: "", telefone: "", cidade: "" });
  const [loading, setLoading] = useState(false);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });
  const onlyDigits = (k: "cpf" | "telefone") => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value.replace(/\D/g, "") });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/campanhas`,
        data: {
          nome_completo: form.nome_completo,
          cpf: form.cpf,
          telefone: form.telefone,
          cidade: form.cidade,
        },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Conta criada! Confirme seu email para entrar.");
    navigate({ to: "/login" });
  };

  const google = async () => {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/campanhas" });
    if (r.error) toast.error("Falha no Google");
  };

  return (
    <div className="min-h-screen grid place-items-center bg-background px-4 py-12">
      <Card className="w-full max-w-md p-8 space-y-5">
        <div>
          <h1 className="font-display text-3xl font-bold">Criar conta</h1>
          <p className="text-muted-foreground text-sm mt-1">Garanta sua próxima tatuagem</p>
        </div>
        <Button onClick={google} variant="outline" className="w-full">Continuar com Google</Button>
        <div className="flex items-center gap-3 text-xs text-muted-foreground"><div className="h-px bg-border flex-1" />ou<div className="h-px bg-border flex-1" /></div>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5"><Label>Nome completo</Label><Input value={form.nome_completo} onChange={set("nome_completo")} required /></div>
          <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={form.email} onChange={set("email")} required /></div>
          <div className="space-y-1.5"><Label>Senha (mín. 8)</Label><Input type="password" value={form.password} onChange={set("password")} required /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>CPF</Label><Input value={form.cpf} onChange={onlyDigits("cpf")} maxLength={11} placeholder="00000000000" required /></div>
            <div className="space-y-1.5"><Label>Telefone</Label><Input value={form.telefone} onChange={onlyDigits("telefone")} maxLength={11} placeholder="11999999999" required /></div>
          </div>
          <div className="space-y-1.5"><Label>Cidade</Label><Input value={form.cidade} onChange={set("cidade")} required /></div>
          <Button type="submit" disabled={loading} className="w-full bg-primary hover:bg-[var(--primary-glow)] mt-2">{loading ? "Criando..." : "Criar conta"}</Button>
        </form>
        <div className="text-sm text-muted-foreground text-center">
          Já tem conta? <Link to="/login" className="text-primary font-medium">Entrar</Link>
        </div>
      </Card>
    </div>
  );
}
