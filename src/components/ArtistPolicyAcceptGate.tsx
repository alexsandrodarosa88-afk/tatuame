import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyArtistPolicyStatus, acceptArtistPolicy } from "@/lib/policy.functions";
import { ARTIST_POLICY_SECTIONS, ARTIST_POLICY_VERSION } from "@/lib/policies";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShieldCheck } from "lucide-react";

export function ArtistPolicyAcceptGate() {
  const statusFn = useServerFn(getMyArtistPolicyStatus);
  const acceptFn = useServerFn(acceptArtistPolicy);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["artist-policy-status"], queryFn: () => statusFn() });
  const [agreed, setAgreed] = useState(false);
  const [reachedEnd, setReachedEnd] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const mut = useMutation({
    mutationFn: () =>
      acceptFn({ data: { userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["artist-policy-status"] }),
  });

  useEffect(() => {
    if (!data?.mustAccept) return;
    const el = scrollRef.current?.querySelector("[data-radix-scroll-area-viewport]") as HTMLElement | null;
    if (!el) return;
    const onScroll = () => {
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 16) setReachedEnd(true);
    };
    el.addEventListener("scroll", onScroll);
    onScroll();
    return () => el.removeEventListener("scroll", onScroll);
  }, [data?.mustAccept]);

  if (!data?.mustAccept) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-background/90 backdrop-blur-sm grid place-items-center p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-border bg-card shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-border flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <div>
            <h2 className="font-display text-lg font-bold leading-tight">Aceite das Políticas do Tatuador</h2>
            <p className="text-xs text-muted-foreground">Versão {ARTIST_POLICY_VERSION} · necessário para continuar</p>
          </div>
        </div>

        <ScrollArea className="flex-1 min-h-0" ref={scrollRef as any}>
          <div className="p-5 space-y-4">
            <p className="text-xs text-muted-foreground">
              Sua mensalidade está ativa. Antes de acessar o sistema, leia e aceite as regras de funcionamento da plataforma para tatuadores.
            </p>
            {ARTIST_POLICY_SECTIONS.map((s) => (
              <div key={s.title}>
                <h3 className="font-semibold text-sm mb-1">{s.title}</h3>
                <p className="text-xs text-muted-foreground whitespace-pre-line leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="p-5 border-t border-border space-y-3">
          <label className="flex items-start gap-2 text-sm cursor-pointer">
            <Checkbox checked={agreed} onCheckedChange={(v) => setAgreed(v === true)} disabled={!reachedEnd} />
            <span>
              Li e concordo com as Políticas do Tatuador TATUAME (v{ARTIST_POLICY_VERSION}), incluindo regras de mensalidade, bloqueio por 5 dias de atraso, multa de R$ 1.500 em caso de 3 atrasos, recebimento mediante termo assinado + foto, fracionamento por sessão e atendimento de vouchers de crédito.
            </span>
          </label>
          {!reachedEnd && <p className="text-[11px] text-muted-foreground">Role o texto até o final para liberar o aceite.</p>}
          <div className="flex items-center justify-end gap-2">
            <Button
              disabled={!agreed || mut.isPending}
              onClick={() => mut.mutate()}
              className="bg-primary hover:bg-[var(--primary-glow)]"
            >
              {mut.isPending ? "Registrando..." : "Aceitar políticas"}
            </Button>
          </div>
          {mut.isError && <p className="text-xs text-destructive">{(mut.error as Error).message}</p>}
        </div>
      </div>
    </div>
  );
}