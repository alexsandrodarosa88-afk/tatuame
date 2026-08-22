import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { z } from "zod";
import { Brush, CheckCircle2, Mail } from "lucide-react";

export const Route = createFileRoute("/cadastro-tatuador")({ component: SignupArtistPage });

const schema = z.object({
  nome_completo: z.string().min(3, "Nome muito curto").max(120),
  email: z.string().email("Email inválido").max(255),
  password: z.string().min(8, "Senha de no mínimo 8 caracteres").max(72),
  cpf: z.string().regex(/^\d{11}$/, "CPF deve ter 11 dígitos"),
  telefone: z.string().regex(/^\d{10,11}$/, "Telefone com DDD (10 ou 11 dígitos)"),
  cidade: z.string().min(2).max(80),
  data_nascimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data de nascimento obrigatória"),
  address: z.string().min(8, "Endereço completo (rua, número, bairro, cidade/UF, CEP)").max(300),
  instagram: z.string().min(2, "Instagram obrigatório").max(60),
});

function SignupArtistPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nome_completo: "", email: "", password: "", cpf: "", telefone: "",
    cidade: "", data_nascimento: "", address: "", instagram: "",
  });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.value });
  const onlyDigits = (k: "cpf" | "telefone") => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value.replace(/\D/g, "") });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    for (const [k, v] of Object.entries(form)) {
      if (!String(v ?? "").trim()) {
        return toast.error("Preencha todos os campos obrigatórios para enviar seu cadastro.");
      }
    }
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      parsed.error.issues.forEach((i) => toast.error(i.message));
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/tatuador`,
        data: {
          is_artist_application: true,
          nome_completo: form.nome_completo,
          cpf: form.cpf,
          telefone: form.telefone,
          cidade: form.cidade,
          data_nascimento: form.data_nascimento,
          address: form.address,
          instagram: form.instagram.replace(/^@/, ""),
        },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    setDone(true);
  };

  if (done) {
    return (
      <div className="min-h-screen grid place-items-center bg-background px-4 py-12">
        <Card className="w-full max-w-lg p-8 space-y-5 text-center">
          <div className="mx-auto h-14 w-14 rounded-full bg-primary/15 grid place-items-center">
            <CheckCircle2 className="h-7 w-7 text-primary" />
          </div>
          <h1 className="font-display text-2xl font-bold">Cadastro enviado para aprovação!</h1>
          <p className="text-muted-foreground text-sm">
            Recebemos seus dados, <strong className="text-foreground">{form.nome_completo.split(" ")[0]}</strong>.
            Nossa equipe TATUAME vai analisar seu cadastro.
          </p>
          <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-left flex gap-3">
            <Mail className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-foreground">Confirme seu email</p>
              <p className="text-muted-foreground text-xs mt-1">
                Enviamos um link de confirmação para <strong>{form.email}</strong>. Confirme para ativar sua conta.
                Assim que o admin aprovar seu cadastro, você receberá um email de boas-vindas com acesso à área do tatuador.
              </p>
            </div>
          </div>
          <Button asChild className="w-full"><Link to="/login" search={{ next: "/tatuador" }}>Ir para o login</Link></Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid place-items-center bg-background px-4 py-12">
      <Card className="w-full max-w-2xl p-8 space-y-5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-md bg-primary/15 grid place-items-center">
            <Brush className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">Cadastro de Tatuador</h1>
            <p className="text-muted-foreground text-sm">Seja um tatuador parceiro TATUAME. Seu cadastro passa por aprovação.</p>
          </div>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5 md:col-span-2"><Label>Nome completo *</Label><Input value={form.nome_completo} onChange={set("nome_completo")} required /></div>
            <div className="space-y-1.5"><Label>Email *</Label><Input type="email" value={form.email} onChange={set("email")} required /></div>
            <div className="space-y-1.5"><Label>Senha (mín. 8) *</Label><Input type="password" value={form.password} onChange={set("password")} required /></div>
            <div className="space-y-1.5"><Label>CPF *</Label><Input value={form.cpf} onChange={onlyDigits("cpf")} maxLength={11} placeholder="00000000000" required /></div>
            <div className="space-y-1.5"><Label>Telefone / WhatsApp *</Label><Input value={form.telefone} onChange={onlyDigits("telefone")} maxLength={11} placeholder="11999999999" required /></div>
            <div className="space-y-1.5"><Label>Data de nascimento *</Label><Input type="date" value={form.data_nascimento} onChange={set("data_nascimento")} required /></div>
            <div className="space-y-1.5"><Label>Cidade *</Label><Input value={form.cidade} onChange={set("cidade")} required /></div>
            <div className="space-y-1.5 md:col-span-2"><Label>Instagram *</Label><Input value={form.instagram} onChange={set("instagram")} placeholder="@seuinstagram" required /></div>
            <div className="space-y-1.5 md:col-span-2"><Label>Endereço completo do estúdio *</Label><Textarea rows={2} value={form.address} onChange={set("address")} placeholder="Rua, número, bairro, cidade/UF, CEP" required /></div>
          </div>
          <p className="text-xs text-muted-foreground">
            Já é cliente TATUAME? Sem problema — o cadastro de tatuador é independente do de cliente. Use um email diferente para criar sua conta de tatuador.
          </p>
          <Button type="submit" disabled={loading} className="w-full bg-primary hover:bg-[var(--primary-glow)] mt-2">
            {loading ? "Enviando..." : "Enviar cadastro para aprovação"}
          </Button>
        </form>
        <div className="text-sm text-muted-foreground text-center">
          Já tem conta de tatuador?{" "}
          <Link to="/login" search={{ next: "/tatuador" }} className="text-primary font-medium">Entrar</Link>
          {" · "}
          <Link to="/cadastro" search={{ next: "/" }} className="text-primary font-medium">Sou cliente</Link>
        </div>
      </Card>
    </div>
  );
}