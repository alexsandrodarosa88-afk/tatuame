import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { db, BRL } from "@/lib/db";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/vendas")({
  component: Page,
  head: () => ({ meta: [{ title: "Vendas | Admin TATUAME" }, { name: "description", content: "Pedidos e pagamentos." }, { property: "og:title", content: "Vendas | Admin TATUAME" }, { property: "og:description", content: "Pedidos e pagamentos." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
});

function Page() {
  const q = useQuery({
    queryKey: ["admin-orders"],
    refetchInterval: 10000,
    queryFn: async () => {
      const { data: orders } = await db.from("orders").select("*, campaigns(title), lucky_numbers(number)").order("created_at", { ascending: false });
      const ids = [...new Set((orders ?? []).map((o: any) => o.user_id))];
      const { data: profiles } = ids.length ? await db.from("profiles").select("id,nome_completo,email,telefone").in("id", ids) : { data: [] };
      const map = Object.fromEntries((profiles ?? []).map((p: any) => [p.id, p]));
      return (orders ?? []).map((o: any) => ({ ...o, profile: map[o.user_id] }));
    },
  });
  useEffect(() => {
    const ch = supabase.channel("admin-orders").on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => q.refetch()).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);
  const setStatus = async (id: string, status: string) => {
    const { error } = await db.from("orders").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(status === "pago" ? "Pagamento confirmado e números gerados" : "Pedido atualizado"); q.refetch();
  };
  const remove = async (id: string) => {
    if (!confirm("Excluir este pedido?")) return;
    await db.from("orders").delete().eq("id", id); q.refetch();
  };
  return (
    <div className="space-y-6">
      <h1 className="text-3xl">Vendas</h1>
      <div className="space-y-3">
        {q.data?.map((o: any) => (
          <div key={o.id} className="space-y-2 rounded-2xl border bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div><p className="font-semibold">{o.profile?.nome_completo || o.profile?.email || "Cliente"}</p><p className="text-sm text-muted-foreground">{o.campaigns?.title} · {o.quantity} cota(s) · {BRL(o.total)} · {new Date(o.created_at).toLocaleString("pt-BR")}</p><p className="text-xs text-muted-foreground">{o.profile?.email} {o.profile?.telefone && `· ${o.profile.telefone}`}</p></div>
              <div className="flex flex-wrap gap-2">
                {o.status === "pendente" && !o.mp_preference_id && <><Button size="sm" onClick={() => setStatus(o.id, "pago")}>Confirmar pagamento</Button><Button size="sm" variant="outline" onClick={() => setStatus(o.id, "cancelado")}>Cancelar</Button></>}
                {o.status === "pendente" && o.mp_preference_id && <span className="text-xs text-muted-foreground">Aguardando confirmação do Mercado Pago</span>}
                {o.status !== "pendente" && <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold">{o.status === "pago" ? `Pago ${o.paid_at ? new Date(o.paid_at).toLocaleDateString("pt-BR") : ""}` : "Cancelado"}</span>}
                <Button size="sm" variant="ghost" onClick={() => remove(o.id)}>Excluir</Button>
              </div>
            </div>
            {o.mp_payment_id && <p className="text-xs text-muted-foreground">Mercado Pago · Pagamento {o.mp_payment_id} · {o.mp_payment_status}</p>}
            {!!o.lucky_numbers?.length && <p className="font-mono text-xs text-muted-foreground">Números: {o.lucky_numbers.map((n: any) => String(n.number).padStart(4, "0")).join(", ")}</p>}
          </div>
        ))}
        {q.data?.length === 0 && <p className="text-muted-foreground">Nenhuma venda ainda.</p>}
      </div>
    </div>
  );
}
