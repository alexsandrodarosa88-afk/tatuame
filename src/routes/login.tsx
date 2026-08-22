import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Brush } from "lucide-react";

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
  const [resetLoading, setResetLoading] = useState(false);

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

  const forgotPassword = async () => {
    if (!email) return toast.error("Digite seu email para receber o link de redefinição.");
    setResetLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setResetLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Enviamos o link para redefinir sua senha.");
  };

  return (
    <div className="min-h-screen grid place-items-center bg-background px-4 relative overflow-hidden animate-fade-in">
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 blur-[120px] rounded-full -z-10" />
      
      <Card className="w-full max-w-md glass p-8 md:p-10 rounded-[2.5rem] relative overflow-hidden transition-premium hover:border-primary/40">
        <div className="space-y-8">
          <header className="space-y-2">
            <h1 className="font-display text-4xl font-black text-white italic uppercase leading-none">Acessar</h1>
            <p className="text-muted-foreground font-medium italic text-sm">Bem-vindo de volta ao universo TATUAME.</p>
          </header>

          {next === "/tatuador" && (
            <div className="glass bg-primary/5 border-primary/20 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest leading-relaxed text-white">
              <span className="text-primary">Área do Artista.</span> Faça o login para acessar seu painel profissional.
            </div>
          )}

          <Button onClick={google} variant="outline" className="w-full h-12 glass font-bold uppercase tracking-widest text-xs transition-premium">
            Entrar com Google
          </Button>

          <div className="flex items-center gap-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
            <div className="h-px bg-white/5 flex-1" /> ou <div className="h-px bg-white/5 flex-1" />
          </div>

          <form onSubmit={submit} className="space-y-5">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Email Profissional</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 glass rounded-xl border-white/5 px-4 font-medium italic" required />
            </div>
            
            <div className="space-y-1.5">
              <div className="flex justify-between items-center px-1">
                <Label className="text-[10px] font-black uppercase tracking-widest">Senha</Label>
                <button type="button" onClick={forgotPassword} disabled={resetLoading} className="text-[9px] font-black text-primary uppercase tracking-widest hover:text-white transition-colors">
                  {resetLoading ? "Enviando..." : "Esqueci a senha"}
                </button>
              </div>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 glass rounded-xl border-white/5 px-4 font-medium italic" required />
            </div>

            <Button type="submit" disabled={loading} className="w-full h-14 bg-primary hover:bg-[oklch(0.6_0.23_27)] text-primary-foreground font-black italic uppercase shadow-glow transition-premium mt-4">
              {loading ? "Autenticando..." : "Entrar na plataforma"}
            </Button>
          </form>

          <div className="text-xs font-bold text-muted-foreground text-center uppercase tracking-widest">
            Novo por aqui?{" "}
            <Link to="/cadastro" search={next ? { next } as any : undefined} className="text-primary hover:text-white transition-colors">Criar conta agora</Link>
          </div>

          <div className="pt-6 border-t border-white/5 flex items-start gap-4">
            <div className="h-10 w-10 rounded-xl glass grid place-items-center shrink-0">
              <Brush className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-white uppercase tracking-widest">Sou Artista</p>
              <p className="text-[9px] font-bold text-muted-foreground uppercase leading-relaxed tracking-tighter italic">
                A conta de artista é exclusiva para tatuadores.{" "}
                <Link to="/tatuador-acesso" className="text-primary hover:text-white transition-colors">Cadastrar Estúdio</Link>
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
