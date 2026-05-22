import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getCart, removeCartItem, upsertCartItem } from "@/lib/cart.functions";
import { createPixCheckout } from "@/lib/checkout.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/carrinho")({ component: CartPage });

const formatBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

type ProfileForm = {
  nome_completo: string;
  cpf: string;
  telefone: string;
  cidade: string;
};

function CartPage() {
  const cartFn = useServerFn(getCart);
  const removeFn = useServerFn(removeCartItem);
  const upsertFn = useServerFn(upsertCartItem);
  const checkoutFn = useServerFn(createPixCheckout);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: cart, isLoading } = useQuery({ queryKey: ["cart"], queryFn: () => cartFn() });

  const { data: profile, refetch: refetchProfile } = useQuery({
    queryKey: ["my-profile"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("nome_completo, cpf, telefone, cidade, email")
        .eq("id", u.user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<ProfileForm>({ nome_completo: "", cpf: "", telefone: "", cidade: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        nome_completo: profile.nome_completo ?? "",
        cpf: profile.cpf ?? "",
        telefone: profile.telefone ?? "",
        cidade: profile.cidade ?? "",
      });
    }
  }, [profile]);

  const profileIncomplete = !profile?.nome_completo || !profile?.cpf;

  const remove = useMutation({
    mutationFn: (id: string) => removeFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart"] }),
  });
  const update = useMutation({
    mutationFn: (v: { campaign_id: string; quantity: number }) => upsertFn({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart"] }),
  });
  const checkout = useMutation({
    mutationFn: () =>
      checkoutFn({
        data: {
          returnUrl: `${window.location.origin}/checkout/return`,
        },
      }),
    onSuccess: (r: any) => {
      if (r?.checkoutUrl) {
        window.location.href = r.checkoutUrl;
      } else {
        toast.error("Não foi possível abrir o pagamento.");
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handlePayClick = () => {
    if (profileIncomplete) {
      setDialogOpen(true);
      return;
    }
    checkout.mutate();
  };

  const onlyDigits = (s: string) => s.replace(/\D/g, "");
  const maskCpf = (s: string) => {
    const d = onlyDigits(s).slice(0, 11);
    return d
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  };
  const maskPhone = (s: string) => {
    const d = onlyDigits(s).slice(0, 11);
    if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3").trim();
    return d.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3").trim();
  };

  const saveProfileAndCheckout = async () => {
    const nome = form.nome_completo.trim();
    const cpfDigits = onlyDigits(form.cpf);
    if (nome.length < 3) {
      toast.error("Informe seu nome completo.");
      return;
    }
    if (cpfDigits.length !== 11) {
      toast.error("CPF inválido. Digite os 11 dígitos.");
      return;
    }
    setSaving(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Sessão expirada. Faça login novamente.");
      const payload = {
        id: u.user.id,
        email: u.user.email,
        nome_completo: nome,
        cpf: cpfDigits,
        telefone: onlyDigits(form.telefone) || null,
        cidade: form.cidade.trim() || null,
      };
      const { error } = await supabase.from("profiles").upsert(payload, { onConflict: "id" });
      if (error) throw error;
      await refetchProfile();
      qc.invalidateQueries({ queryKey: ["my-profile"] });
      setDialogOpen(false);
      toast.success("Cadastro salvo. Gerando pagamento...");
      checkout.mutate();
    } catch (e: any) {
      toast.error(e?.message ?? "Falha ao salvar cadastro.");
    } finally {
      setSaving(false);
    }
  };

  const total = (cart ?? []).reduce((acc: number, i: any) => acc + Number(i.campaigns?.price_per_quota ?? 0) * i.quantity, 0);

  return (
    <div className="container mx-auto px-4 py-10 max-w-3xl">
      <h1 className="font-display text-3xl font-bold mb-6">Seu carrinho</h1>
      {cart && cart.length > 0 && profileIncomplete && (
        <Card className="p-4 mb-4 border-amber-500/50 bg-amber-500/10">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="text-sm">
              <strong>Complete seu cadastro</strong> para finalizar a compra (nome e CPF).
            </div>
            <Button size="sm" variant="outline" onClick={() => setDialogOpen(true)}>
              Completar agora
            </Button>
          </div>
        </Card>
      )}
      {isLoading && <p className="text-muted-foreground">Carregando...</p>}
      {cart && cart.length === 0 && (
        <Card className="p-10 text-center">
          <p className="text-muted-foreground mb-4">Seu carrinho está vazio.</p>
          <Button onClick={() => navigate({ to: "/campanhas" })} className="bg-primary hover:bg-[var(--primary-glow)]">Ver campanhas</Button>
        </Card>
      )}
      <div className="space-y-3">
        {cart?.map((item: any) => {
          const c = item.campaigns;
          const sub = Number(c?.price_per_quota ?? 0) * item.quantity;
          return (
            <Card key={item.id} className="p-5 flex items-center gap-4">
              <div className="flex-1">
                <div className="font-display text-lg font-semibold">Tatuagem até {formatBRL(Number(c?.tattoo_value ?? 0))}</div>
                <div className="text-sm text-muted-foreground">{formatBRL(Number(c?.price_per_quota ?? 0))} por cota</div>
              </div>
              <div className="flex items-center gap-1">
                <Button size="icon" variant="outline" onClick={() => update.mutate({ campaign_id: item.campaign_id, quantity: Math.max(1, item.quantity - 1) })}><Minus className="h-3 w-3" /></Button>
                <span className="w-8 text-center font-semibold">{item.quantity}</span>
                <Button size="icon" variant="outline" onClick={() => update.mutate({ campaign_id: item.campaign_id, quantity: item.quantity + 1 })}><Plus className="h-3 w-3" /></Button>
              </div>
              <div className="w-24 text-right font-semibold">{formatBRL(sub)}</div>
              <Button size="icon" variant="ghost" onClick={() => remove.mutate(item.id)}><Trash2 className="h-4 w-4 text-muted-foreground" /></Button>
            </Card>
          );
        })}
      </div>
      {cart && cart.length > 0 && (
        <Card className="p-6 mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Total</span>
            <span className="font-display text-2xl font-bold">{formatBRL(total)}</span>
          </div>
          <Button onClick={handlePayClick} disabled={checkout.isPending} className="w-full bg-primary hover:bg-[var(--primary-glow)] h-12 text-base font-semibold">
            {checkout.isPending ? "Gerando pagamento..." : "PAGAR"}
          </Button>
          <p className="text-xs text-muted-foreground text-center">Você será redirecionado para a página segura do Asaas e poderá pagar com PIX ou cartão (cartão disponível para compras acima de R$ 150,00).</p>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Complete seu cadastro</DialogTitle>
            <DialogDescription>
              Precisamos desses dados para emitir sua cobrança no Asaas. Eles ficam salvos para as próximas compras.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="nome">Nome completo *</Label>
              <Input id="nome" value={form.nome_completo} onChange={(e) => setForm({ ...form, nome_completo: e.target.value })} placeholder="Seu nome completo" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cpf">CPF *</Label>
              <Input id="cpf" value={maskCpf(form.cpf)} onChange={(e) => setForm({ ...form, cpf: e.target.value })} placeholder="000.000.000-00" inputMode="numeric" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tel">Telefone</Label>
              <Input id="tel" value={maskPhone(form.telefone)} onChange={(e) => setForm({ ...form, telefone: e.target.value })} placeholder="(11) 90000-0000" inputMode="tel" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cid">Cidade</Label>
              <Input id="cid" value={form.cidade} onChange={(e) => setForm({ ...form, cidade: e.target.value })} placeholder="Sua cidade" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={saveProfileAndCheckout} disabled={saving} className="bg-primary hover:bg-[var(--primary-glow)]">
              {saving ? "Salvando..." : "Salvar e pagar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
