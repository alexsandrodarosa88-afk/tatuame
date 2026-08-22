import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect } from "react";
import { getMyParticipations, getMyCredits, getMyProfile, reconcileMyPendingOrders } from "@/lib/cart.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Ticket, Wallet, User as UserIcon, FileText, ArrowRight, History, CreditCard } from "lucide-react";

export const Route = createFileRoute("/_authenticated/conta")({ component: AccountPage });

const formatBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const formatDate = (s: string) => new Date(s).toLocaleDateString("pt-BR");

function AccountPage() {
  const partsFn = useServerFn(getMyParticipations);
  const credFn = useServerFn(getMyCredits);
  const profFn = useServerFn(getMyProfile);
  const reconcileFn = useServerFn(reconcileMyPendingOrders);
  const qc = useQueryClient();
  const { data: parts } = useQuery({ queryKey: ["participations"], queryFn: () => partsFn() });
  const { data: credits } = useQuery({ queryKey: ["credits"], queryFn: () => credFn() });
  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: () => profFn() });

  useEffect(() => {
    let cancelled = false;
    reconcileFn()
      .then((r) => {
        if (!cancelled && r?.confirmed && r.confirmed > 0) {
          qc.invalidateQueries({ queryKey: ["participations"] });
          qc.invalidateQueries({ queryKey: ["credits"] });
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [reconcileFn, qc]);

  const totalCredit = (credits ?? []).reduce((a, c) => a + (Number(c.amount) - Number(c.used_amount)), 0);

  const now = Date.now();
  const isEnded = (p: any) => p.campaigns?.status === "closed" || (p.campaigns?.ends_at && new Date(p.campaigns.ends_at).getTime() < now);
  const ativos = (parts ?? []).filter((p: any) => !isEnded(p));
  const historico = (parts ?? []).filter(isEnded);

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl animate-fade-in">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div className="space-y-2">
          <div className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Minha Área</div>
          <h1 className="font-display text-4xl md:text-5xl font-black text-white italic uppercase leading-none">
            Olá, <span className="text-glow">{profile?.nome_completo?.split(" ")[0] || "Usuário"}</span>
          </h1>
        </div>
        <Button asChild variant="outline" className="glass h-10 px-6 font-bold uppercase tracking-widest text-xs">
          <Link to="/politicas"><FileText className="h-4 w-4 mr-2" /> Políticas da Plataforma</Link>
        </Button>
      </header>

      {/* Overview Cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <Card className="glass p-8 relative overflow-hidden group transition-premium hover:border-primary/40">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl -z-10" />
          <div className="flex items-center gap-2 text-muted-foreground text-[10px] font-black uppercase tracking-widest mb-4">
            <Wallet className="h-4 w-4 text-primary" /> Crédito Disponível
          </div>
          <div className="font-display text-4xl font-black text-white italic tracking-tighter tabular-nums">
            {formatBRL(totalCredit)}
          </div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase mt-4 italic">Válidos por 12 meses</p>
        </Card>
        
        <Card className="glass p-8 relative overflow-hidden group transition-premium hover:border-primary/40">
          <div className="flex items-center gap-2 text-muted-foreground text-[10px] font-black uppercase tracking-widest mb-4">
            <Ticket className="h-4 w-4 text-primary" /> Números Ativos
          </div>
          <div className="font-display text-4xl font-black text-white italic tracking-tighter tabular-nums">
            {ativos.length}
          </div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase mt-4 italic">Participando agora</p>
        </Card>

        <Card className="glass p-8 relative overflow-hidden group transition-premium hover:border-primary/40">
          <div className="flex items-center gap-2 text-muted-foreground text-[10px] font-black uppercase tracking-widest mb-4">
            <CreditCard className="h-4 w-4 text-primary" /> Uso do Crédito
          </div>
          <div className="font-display text-4xl font-black text-white italic tracking-tighter">70%</div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase mt-4 italic">Limite por tatuagem</p>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-12">
        {/* Left Column: Participations */}
        <div className="lg:col-span-2 space-y-12">
          <section>
            <h2 className="font-display text-2xl font-black text-white italic uppercase mb-6 flex items-center gap-3">
              <Ticket className="h-6 w-6 text-primary" /> Sorteios em Aberto
            </h2>
            
            {ativos.length === 0 ? (
              <Card className="glass p-12 text-center rounded-[2rem]">
                <p className="text-muted-foreground font-medium italic mb-6">Você ainda não tem participações ativas.</p>
                <Button asChild className="bg-primary hover:bg-[oklch(0.6_0.23_27)] text-primary-foreground font-black italic uppercase h-12 px-8">
                  <Link to="/campanhas">Explorar Campanhas <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {ativos.map((p: any) => (
                  <ParticipationCard key={p.id} participation={p} />
                ))}
              </div>
            )}
          </section>

          {historico.length > 0 && (
            <section>
              <h2 className="font-display text-2xl font-black text-white italic uppercase mb-6 flex items-center gap-3">
                <History className="h-6 w-6 text-muted-foreground" /> Histórico
              </h2>
              <div className="space-y-3">
                {historico.map((p: any) => (
                  <ParticipationCard key={p.id} participation={p} isHistory />
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right Column: Profile & Info */}
        <aside className="space-y-6">
          <Card className="glass p-8 rounded-[2rem]">
            <h3 className="font-display text-xs font-black text-white uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
              <UserIcon className="h-4 w-4 text-primary" /> Perfil Verificado
            </h3>
            {profile && (
              <div className="space-y-6">
                <ProfileItem label="Email" value={profile.email} />
                <ProfileItem label="CPF" value={profile.cpf} />
                <ProfileItem label="Telefone" value={profile.telefone} />
                <ProfileItem label="Cidade" value={profile.cidade} />
                <Button variant="outline" className="w-full h-11 glass text-[10px] font-black uppercase tracking-widest hover:text-primary transition-premium">
                  Editar Dados
                </Button>
              </div>
            )}
          </Card>

          <Card className="glass p-8 rounded-[2rem] border-primary/20 bg-primary/5">
            <h3 className="font-display text-xs font-black text-white uppercase tracking-[0.3em] mb-4">Central de Ajuda</h3>
            <p className="text-[11px] text-muted-foreground font-medium italic mb-6">Dúvidas sobre o funcionamento das campanhas ou créditos?</p>
            <Button variant="link" className="p-0 h-auto text-[10px] font-black uppercase tracking-widest text-primary hover:text-white transition-colors">
              Falar com Suporte <ArrowRight className="ml-2 h-3 w-3" />
            </Button>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function ParticipationCard({ participation, isHistory }: { participation: any, isHistory?: boolean }) {
  return (
    <Card className={`glass rounded-2xl p-6 transition-premium hover:border-primary/40 group ${isHistory ? 'opacity-60' : ''}`}>
      <div className="flex justify-between items-start gap-4 mb-4">
        <div className="space-y-1">
          {participation.campaigns?.code && (
            <span className="inline-block px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-[9px] font-black text-primary uppercase font-mono tracking-tighter">
              {participation.campaigns.code}
            </span>
          )}
          <h4 className="font-display text-lg font-black text-white italic uppercase tracking-tight leading-tight group-hover:text-primary transition-colors">
            {participation.campaigns?.title || "Campanha Tatuame"}
          </h4>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Cota</div>
          <div className={`font-display text-3xl font-black italic tracking-tighter tabular-nums leading-none ${isHistory ? 'text-muted-foreground' : 'text-primary text-glow'}`}>
            {String(participation.lucky_number).padStart(3, "0")}
          </div>
        </div>
      </div>
      
      <div className="pt-4 border-t border-white/5 flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase italic">
        <span>{isHistory ? 'Sorteio Realizado' : 'Aguardando Sorteio'}</span>
        <span>{isHistory ? formatDate(participation.campaigns?.ends_at) : 'Em progresso'}</span>
      </div>
    </Card>
  );
}

function ProfileItem({ label, value }: { label: string, value: string | null }) {
  return (
    <div className="space-y-1">
      <div className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]">{label}</div>
      <div className="text-sm font-bold text-white truncate">{value || "—"}</div>
    </div>
  );
}

