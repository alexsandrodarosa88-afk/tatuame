import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useArtist } from "@/hooks/use-artist";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Lock, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/tatuador/dados")({ component: TatuadorDados });

const empty = {
  full_name: "", address: "", phone: "", email: "", cpf: "", rg: "", birth_date: "",
  bank_name: "", bank_agency: "", bank_account: "", pix_key: "",
};

function TatuadorDados() {
  const { artist, application, loading } = useArtist();
  const [data, setData] = useState<any>(null);
  const [form, setForm] = useState({ ...empty });
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!artist) { setLoaded(true); return; }
    (supabase as any).from("artist_bank_details").select("*").eq("artist_id", artist.id).maybeSingle()
      .then(({ data: d }: any) => {
        setData(d);
        if (d) setForm({
          full_name: d.full_name, address: d.address, phone: d.phone, email: d.email,
          cpf: d.cpf, rg: d.rg, birth_date: d.birth_date,
          bank_name: d.bank_name, bank_agency: d.bank_agency, bank_account: d.bank_account, pix_key: d.pix_key,
        });
        setLoaded(true);
      });
  }, [artist]);

  if (loading || !loaded) return <div className="grid place-items-center py-20 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>;

  if (!application || application.status !== "approved" || !artist) {
    return <Card><CardContent className="p-6 text-sm text-muted-foreground">Aguarde a aprovação do cadastro.</CardContent></Card>;
  }

  const locked = !!data;

  const save = async () => {
    for (const [k, v] of Object.entries(form)) {
      if (!String(v).trim()) { toast.error("Preencha todos os campos."); return; }
    }
    setSaving(true);
    const { error } = await (supabase as any).from("artist_bank_details").insert({
      artist_id: artist.id, ...form,
      cpf: form.cpf.replace(/\D/g, ""),
      rg: form.rg.replace(/\D/g, ""),
    });
    setSaving(false);
    if (error) { toast.error("Erro ao salvar: " + error.message); return; }
    toast.success("Dados salvos! Agora estão bloqueados para alteração.");
    const { data: d } = await (supabase as any).from("artist_bank_details").select("*").eq("artist_id", artist.id).maybeSingle();
    setData(d);
  };

  const field = (key: keyof typeof empty, label: string, type = "text", placeholder?: string) => (
    <div>
      <Label>{label}</Label>
      <Input type={type} value={(form as any)[key]} disabled={locked} placeholder={placeholder}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
    </div>
  );

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">Meus dados</h1>

      {locked ? (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4 flex gap-3 text-sm">
            <Lock className="h-5 w-5 text-amber-500 shrink-0" />
            <p>Seus dados estão <strong>bloqueados</strong>. Para alterar qualquer informação (especialmente bancária e PIX), abra um chamado com o administrador TATUAME.</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 flex gap-3 text-sm">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
            <p><strong>Atenção:</strong> os pagamentos de rateios só serão feitos na conta bancária e chave PIX cadastrada, que deve estar na <strong>titularidade do proprietário do cadastro</strong>. Após salvar, os dados ficarão bloqueados e só poderão ser alterados via chamado.</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="font-semibold">Dados pessoais</h2>
          {field("full_name", "Nome completo *")}
          {field("address", "Endereço completo *", "text", "Rua, número, bairro, cidade/UF, CEP")}
          <div className="grid grid-cols-2 gap-3">
            {field("phone", "Telefone *", "text", "(11) 99999-9999")}
            {field("email", "E-mail *", "email")}
          </div>
          <div className="grid grid-cols-3 gap-3">
            {field("cpf", "CPF *", "text", "000.000.000-00")}
            {field("rg", "RG *")}
            {field("birth_date", "Data de nascimento *", "date")}
          </div>

          <h2 className="font-semibold pt-2">Dados bancários</h2>
          <div className="grid grid-cols-3 gap-3">
            {field("bank_name", "Banco *")}
            {field("bank_agency", "Agência *")}
            {field("bank_account", "Conta *")}
          </div>
          {field("pix_key", "Chave PIX *", "text", "CPF, e-mail, telefone ou chave aleatória")}

          {!locked && (
            <Button onClick={save} disabled={saving} className="w-full">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Salvar dados (após salvar não será possível alterar)
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
