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
    <div className="min-h-screen grid place-items-center bg-background px-4 py-12 animate-fade-in relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 blur-[120px] rounded-full -z-10" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 blur-[120px] rounded-full -z-10" />
      
      <Card className="w-full max-w-md glass p-8 md:p-10 rounded-[2.5rem] relative overflow-hidden transition-premium hover:border-primary/40">
        <div className="space-y-6">
          <header className="space-y-2">
            <h1 className="font-display text-4xl font-black text-white italic uppercase leading-none">
              {next === "/tatuador" ? "Cadastro Artista" : "Criar conta"}
            </h1>
            <p className="text-muted-foreground font-medium italic text-sm">
              {next === "/tatuador"
                ? "Junte-se à nossa rede exclusiva de artistas."
                : "Acesse a elite da tatuagem brasileira."}
            </p>
          </header>

          <Button onClick={google} variant="outline" className="w-full h-12 glass font-bold uppercase tracking-widest text-xs transition-premium">
            Continuar com Google
          </Button>

          <div className="flex items-center gap-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
            <div className="h-px bg-white/5 flex-1" /> ou <div className="h-px bg-white/5 flex-1" />
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Nome completo</Label>
              <Input value={form.nome_completo} onChange={set("nome_completo")} className="h-12 glass rounded-xl border-white/5 px-4 font-medium italic" required />
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Email</Label>
              <Input type="email" value={form.email} onChange={set("email")} className="h-12 glass rounded-xl border-white/5 px-4 font-medium italic" required />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Senha (mín. 8)</Label>
              <Input type="password" value={form.password} onChange={set("password")} className="h-12 glass rounded-xl border-white/5 px-4 font-medium italic" required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest ml-1">CPF</Label>
                <Input value={form.cpf} onChange={onlyDigits("cpf")} maxLength={11} className="h-12 glass rounded-xl border-white/5 px-4 font-medium italic" placeholder="000.000..." required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Telefone</Label>
                <Input value={form.telefone} onChange={onlyDigits("telefone")} maxLength={11} className="h-12 glass rounded-xl border-white/5 px-4 font-medium italic" placeholder="(00) 00000..." required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Nascimento</Label>
                <Input type="date" value={form.data_nascimento} onChange={set("data_nascimento")} className="h-12 glass rounded-xl border-white/5 px-4 font-medium italic" required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Cidade</Label>
                <Input value={form.cidade} onChange={set("cidade")} className="h-12 glass rounded-xl border-white/5 px-4 font-medium italic" required />
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full h-14 bg-primary hover:bg-[oklch(0.6_0.23_27)] text-primary-foreground font-black italic uppercase shadow-glow transition-premium mt-4">
              {loading ? "Processando..." : "Criar conta agora"}
            </Button>
          </form>

          <div className="text-xs font-bold text-muted-foreground text-center uppercase tracking-widest">
            Já tem conta?{" "}
            <Link to="/login" search={next ? { next } as any : undefined} className="text-primary hover:text-white transition-colors">Entrar</Link>
          </div>

          <div className="pt-6 mt-6 border-t border-white/5 flex items-start gap-4">
            <div className="h-10 w-10 rounded-xl glass grid place-items-center shrink-0">
              <Brush className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-white uppercase tracking-widest">É Tatuador?</p>
              <p className="text-[9px] font-bold text-muted-foreground uppercase leading-relaxed tracking-tighter italic">
                Crie um perfil profissional separado.{" "}
                <Link to="/tatuador-acesso" className="text-primary hover:text-white transition-colors">Saiba mais</Link>
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
