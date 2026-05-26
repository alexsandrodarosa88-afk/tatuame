import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { KeyRound } from "lucide-react";

/**
 * Quando o admin cria a conta do tatuador, marcamos
 * `user_metadata.must_change_password = true`. Aqui forçamos a troca
 * antes de liberar qualquer outra tela autenticada.
 */
export function ForcePasswordChangeGate() {
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (loading || !user) { setOpen(false); return; }
    const must = (user.user_metadata as any)?.must_change_password === true;
    setOpen(!!must);
  }, [user, loading]);

  if (!open) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwd.length < 8) return toast.error("Mínimo de 8 caracteres.");
    if (pwd !== pwd2) return toast.error("As senhas não conferem.");
    setSaving(true);
    const { error } = await supabase.auth.updateUser({
      password: pwd,
      data: { must_change_password: false },
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Senha atualizada com sucesso!");
    setOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[200] grid place-items-center bg-background/95 backdrop-blur-sm p-4">
      <Card className="w-full max-w-md p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-md bg-primary/15 grid place-items-center">
            <KeyRound className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold">Defina sua senha</h2>
            <p className="text-xs text-muted-foreground">
              Sua conta foi criada pela equipe TATUAME. Crie uma senha pessoal antes de continuar.
            </p>
          </div>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <Label>Nova senha (mín. 8)</Label>
            <Input type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} autoFocus />
          </div>
          <div>
            <Label>Confirme a senha</Label>
            <Input type="password" value={pwd2} onChange={(e) => setPwd2(e.target.value)} />
          </div>
          <Button type="submit" disabled={saving} className="w-full">
            {saving ? "Salvando..." : "Salvar e continuar"}
          </Button>
        </form>
      </Card>
    </div>
  );
}