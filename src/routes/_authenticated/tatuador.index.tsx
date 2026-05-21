import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useArtist } from "@/hooks/use-artist";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { CheckCircle2, Clock, XCircle, Loader2, Wallet, UserCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/tatuador/")({ component: TatuadorIndex });

function TatuadorIndex() {
  const { user } = useAuth();
  const { application, artist, loading, reload } = useArtist();
  const [form, setForm] = useState({ full_name: "", email: "", address: "", cpf: "" });
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return <div className="grid place-items-center py-20 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  }

  const submit = async () => {
    if (!user) return;
    if (!form.full_name.trim() || !form.email.trim() || !form.address.trim() || !form.cpf.trim()) {
      toast.error("Preencha todos os campos."); return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("artist_applications").insert({
      user_id: user.id,
      full_name: form.full_name.trim(),
      email: form.email.trim(),
      address: form.address.trim(),
      cpf: form.cpf.replace(/\D/g, ""),
    } as any);
    setSubmitting(false);
    if (error) { toast.error("Erro ao enviar cadastro: " + error.message); return; }
    toast.success("Cadastro enviado! Aguarde aprovação do TATUAME.");
    reload();
  };

  // No application yet → show form
  if (!application) {
    return (
      <div className="max-w-xl">
        <h1 className="text-2xl font-bold mb-2">Seja um tatuador parceiro TATUAME</h1>
        <p className="text-muted-foreground mb-6 text-sm">
          Preencha seus dados abaixo. Após o envio, nossa equipe analisará seu cadastro e você será notificado quando aprovado.
        </p>
        <Card>
          <CardContent className="p-6 space-y-3">
            <div><Label>Nome completo *</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
            <div><Label>E-mail *</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div><Label>Endereço completo *</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Rua, número, bairro, cidade/UF, CEP" /></div>
            <div><Label>CPF *</Label><Input value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} placeholder="000.000.000-00" /></div>
            <Button className="w-full" onClick={submit} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Enviar cadastro para aprovação
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (application.status === "pending") {
    return (
      <div className="max-w-xl">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5 text-amber-500" /> Cadastro em análise</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>Recebemos seu cadastro, <strong>{application.full_name}</strong>.</p>
            <p className="text-muted-foreground">Em breve nossa equipe TATUAME irá analisar e você poderá completar seu perfil público.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (application.status === "rejected") {
    return (
      <div className="max-w-xl">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><XCircle className="h-5 w-5 text-destructive" /> Cadastro não aprovado</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-2">
            <p>Seu cadastro não foi aprovado no momento.</p>
            {application.notes && <p className="text-muted-foreground">Motivo: {application.notes}</p>}
            <p className="text-muted-foreground">Entre em contato com a equipe TATUAME para mais informações.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Approved
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-5 w-5 text-green-500" />
        <h1 className="text-2xl font-bold">Bem-vindo(a), {application.full_name.split(" ")[0]}!</h1>
      </div>
      <p className="text-muted-foreground text-sm">Seu cadastro está aprovado. Complete seu perfil para aparecer na vitrine de tatuadores.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Link to="/tatuador/perfil">
          <Card className="hover:shadow-[var(--shadow-elegant)] transition-shadow cursor-pointer">
            <CardContent className="p-5 flex items-start gap-3">
              <UserCircle className="h-8 w-8 text-primary shrink-0" />
              <div>
                <h3 className="font-semibold">Meu perfil público</h3>
                <p className="text-sm text-muted-foreground">Foto, Instagram, WhatsApp, estilos.</p>
                {artist && (
                  <p className="text-xs mt-1">
                    Status: {artist.is_active
                      ? <span className="text-green-500 font-medium">ativo na vitrine</span>
                      : <span className="text-amber-500 font-medium">complete o perfil para ativar</span>}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/tatuador/rateio">
          <Card className="hover:shadow-[var(--shadow-elegant)] transition-shadow cursor-pointer">
            <CardContent className="p-5 flex items-start gap-3">
              <Wallet className="h-8 w-8 text-primary shrink-0" />
              <div>
                <h3 className="font-semibold">Meus rateios</h3>
                <p className="text-sm text-muted-foreground">Acompanhe valores a receber e pagos.</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}