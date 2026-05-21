import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  validateSearch: (s: Record<string, unknown>) => ({ next: typeof s.next === "string" ? s.next : undefined }),
});

function LoginPage() {
  const navigate = useNavigate();
  const { next } = useSearch({ from: "/login" });
  const dest = next || "/campanhas";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    navigate({ to: dest as any });
  };

  const google = async () => {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + dest });
    if (r.error) toast.error("Falha no login com Google");
  };

  return (
    <div className="min-h-screen grid place-items-center bg-background px-4">
      <Card className="w-full max-w-md p-8 space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold">Entrar</h1>
          <p className="text-muted-foreground text-sm mt-1">Acesse sua conta TATUAME</p>
        </div>
        {next === "/tatuador" && (
          <div className="rounded-md border border-primary/40 bg-primary/5 p-3 text-sm">
            <strong>Área do Tatuador.</strong> Entre ou crie sua conta para enviar seu cadastro de tatuador parceiro.
          </div>
        )}
        <Button onClick={google} variant="outline" className="w-full">Entrar com Google</Button>
        <div className="flex items-center gap-3 text-xs text-muted-foreground"><div className="h-px bg-border flex-1" />ou<div className="h-px bg-border flex-1" /></div>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2"><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
          <div className="space-y-2"><Label>Senha</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
          <Button type="submit" disabled={loading} className="w-full bg-primary hover:bg-[var(--primary-glow)]">{loading ? "Entrando..." : "Entrar"}</Button>
        </form>
        <div className="text-sm text-muted-foreground text-center">
          Não tem conta?{" "}
          <Link to="/cadastro" search={next ? { next } as any : undefined} className="text-primary font-medium">Criar agora</Link>
        </div>
      </Card>
    </div>
  );
}
