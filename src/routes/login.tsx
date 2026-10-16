import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Navbar } from "@/components/site/Navbar";

export const Route = createFileRoute("/login")({
  component: Login,
  validateSearch: (s: Record<string, unknown>) => ({ next: typeof s.next === "string" && s.next.startsWith("/") ? s.next : undefined }),
  head: () => ({ meta: [
    { title: "Entrar | TATUAME" }, { name: "description", content: "Acesse sua conta TATUAME." },
    { property: "og:title", content: "Entrar | TATUAME" }, { property: "og:description", content: "Acesse sua conta TATUAME." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
});

function Login() {
  const { next } = Route.useSearch();
  const navigate = useNavigate();
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [loading, setLoading] = useState(false);
  useEffect(() => {
    const go = () => navigate({ to: (next ?? "/conta") as any });
    supabase.auth.getSession().then(({ data }) => { if (data.session) go(); });
    const { data: sub } = supabase.auth.onAuthStateChange((ev, session) => { if (session && (ev === "SIGNED_IN" || ev === "PASSWORD_RECOVERY")) go(); });
    return () => sub.subscription.unsubscribe();
  }, []);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) return toast.error("Email ou senha incorretos.");
    navigate({ to: (next ?? "/conta") as any });
  };
  const reset = async () => {
    if (!email) return toast.error("Digite seu email primeiro.");
    await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/login` });
    toast.success("Enviamos um link para seu email.");
  };
  return (
    <div className="min-h-screen"><Navbar />
      <main className="mx-auto max-w-md px-4 py-16">
        <form onSubmit={submit} className="space-y-5 rounded-3xl border bg-card p-8 shadow-soft">
          <h1 className="text-3xl">Entrar</h1>
          <div className="space-y-2"><Label htmlFor="e">Email</Label><Input id="e" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
          <div className="space-y-2"><Label htmlFor="p">Senha</Label><Input id="p" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
          <Button className="w-full" size="lg" disabled={loading}>{loading ? "Entrando..." : "Entrar"}</Button>
          <div className="flex justify-between text-sm"><button type="button" onClick={reset} className="text-muted-foreground hover:text-foreground">Esqueci a senha</button><Link to="/cadastro" className="text-primary">Criar conta</Link></div>
        </form>
      </main>
    </div>
  );
}
