import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { getCart, removeCartItem, upsertCartItem } from "@/lib/cart.functions";
import { createPixCheckout } from "@/lib/checkout.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Minus, Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/carrinho")({ component: CartPage });

const formatBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function CartPage() {
  const cartFn = useServerFn(getCart);
  const removeFn = useServerFn(removeCartItem);
  const upsertFn = useServerFn(upsertCartItem);
  const checkoutFn = useServerFn(createPixCheckout);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const { data: cart, isLoading } = useQuery({ queryKey: ["cart"], queryFn: () => cartFn() });

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
          environment: getStripeEnvironment(),
          returnUrl: `${window.location.origin}/checkout/return`,
        },
      }),
    onSuccess: (r) => { setClientSecret(r.clientSecret); },
    onError: (e: Error) => toast.error(e.message),
  });

  const total = (cart ?? []).reduce((acc: number, i: any) => acc + Number(i.campaigns?.price_per_quota ?? 0) * i.quantity, 0);

  if (clientSecret) {
    return (
      <div className="container mx-auto px-4 py-10 max-w-3xl">
        <h1 className="font-display text-3xl font-bold mb-6">Pagamento PIX</h1>
        <Card className="p-2 overflow-hidden">
          <EmbeddedCheckoutProvider stripe={getStripe()} options={{ clientSecret }}>
            <EmbeddedCheckout />
          </EmbeddedCheckoutProvider>
        </Card>
        <p className="text-xs text-muted-foreground text-center mt-4">Pagamento processado com segurança pela Stripe.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-3xl">
      <h1 className="font-display text-3xl font-bold mb-6">Seu carrinho</h1>
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
          <Button onClick={() => checkout.mutate()} disabled={checkout.isPending} className="w-full bg-primary hover:bg-[var(--primary-glow)] h-12 text-base font-semibold">
            {checkout.isPending ? "Gerando PIX..." : "Pagar com PIX"}
          </Button>
          <p className="text-xs text-muted-foreground text-center">Você será redirecionado para a página segura de pagamento.</p>
        </Card>
      )}
    </div>
  );
}
