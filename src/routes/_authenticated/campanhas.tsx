import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { listActiveCampaigns } from "@/lib/campaigns.functions";
import { upsertCartItem, getCart } from "@/lib/cart.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Minus, Plus, ShoppingCart } from "lucide-react";

export const Route = createFileRoute("/_authenticated/campanhas")({ component: CampanhasPage });

const formatBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function CampanhasPage() {
  const list = useServerFn(listActiveCampaigns);
  const cartFn = useServerFn(getCart);
  const upsert = useServerFn(upsertCartItem);
  const qc = useQueryClient();

  const { data: campaigns } = useQuery({ queryKey: ["campaigns"], queryFn: () => list() });
  const { data: cart } = useQuery({ queryKey: ["cart"], queryFn: () => cartFn() });

  const add = useMutation({
    mutationFn: (input: { campaign_id: string; quantity: number }) => upsert({ data: input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cart"] });
      toast.success("Adicionado ao carrinho");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-bold">Campanhas ativas</h1>
          <p className="text-muted-foreground mt-1">Escolha quantas cotas quiser e finalize com PIX.</p>
        </div>
        <Button asChild variant="outline"><a href="/carrinho"><ShoppingCart className="h-4 w-4 mr-2" /> Carrinho ({cart?.length ?? 0})</a></Button>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {campaigns?.map((c) => (
          <CampaignBuyCard key={c.id} c={c} onAdd={(q) => add.mutate({ campaign_id: c.id, quantity: q })} loading={add.isPending} />
        ))}
      </div>
    </div>
  );
}

function CampaignBuyCard({ c, onAdd, loading }: { c: any; onAdd: (q: number) => void; loading: boolean }) {
  const [qty, setQty] = useState(1);
  const remaining = c.total_quotas - c.sold_quotas;
  const pct = Math.round((c.sold_quotas / c.total_quotas) * 100);
  return (
    <Card className="p-5 flex flex-col gap-4 bg-card/80 border-border">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {c.code && <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-mono font-semibold text-primary border border-primary/20">{c.code}</span>}
          </div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Tatuagem de</div>
          <div className="font-display text-2xl font-bold">{formatBRL(Number(c.tattoo_value))}</div>
        </div>
        {pct >= 70 && <Badge className="bg-primary/15 text-primary border border-primary/30">Quase fechando</Badge>}
      </div>
      <div className="text-sm text-muted-foreground">
        Cota: <span className="text-foreground font-semibold">{formatBRL(Number(c.price_per_quota))}</span>
      </div>
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Cotas vendidas</span>
          <span className="font-semibold text-primary">{pct}%</span>
        </div>
        <div className="h-2 rounded-full bg-secondary overflow-hidden">
          <div className="h-full" style={{ width: `${pct}%`, background: "var(--gradient-primary)" }} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button size="icon" variant="outline" onClick={() => setQty(Math.max(1, qty - 1))}><Minus className="h-4 w-4" /></Button>
        <Input type="number" value={qty} min={1} max={Math.min(50, remaining)} onChange={(e) => setQty(Math.max(1, Math.min(50, Number(e.target.value) || 1)))} className="text-center" />
        <Button size="icon" variant="outline" onClick={() => setQty(Math.min(50, remaining, qty + 1))}><Plus className="h-4 w-4" /></Button>
      </div>
      <div className="text-sm">Total: <span className="font-semibold">{formatBRL(qty * Number(c.price_per_quota))}</span></div>
      {remaining < 1 ? (
        <Button disabled className="mt-auto">Esgotado</Button>
      ) : (
        <Button disabled={loading} onClick={() => onAdd(qty)} className="bg-primary hover:bg-[var(--primary-glow)] mt-auto">
          Adicionar ao carrinho
        </Button>
      )}
    </Card>
  );
}
