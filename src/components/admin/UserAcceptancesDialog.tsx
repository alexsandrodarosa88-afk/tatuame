import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, FileText, Printer } from "lucide-react";
import { adminGetUserAcceptances } from "@/lib/policy.functions";
import { useState } from "react";

export function UserAcceptancesDialog({
  userId,
  userName,
  open,
  onOpenChange,
}: {
  userId: string | null;
  userName?: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const fn = useServerFn(adminGetUserAcceptances);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-acceptances", userId],
    queryFn: () => fn({ data: { userId: userId! } }),
    enabled: !!userId && open,
  });
  const [selected, setSelected] = useState<string | null>(null);
  const current = (data ?? []).find((r: any) => r.id === selected) ?? (data ?? [])[0];

  const printOne = (a: any) => {
    const w = window.open("", "_blank", "width=900,height=1100");
    if (!w) return;
    w.document.write(`<html><head><title>Aceite ${a.version}</title>
      <style>body{font-family:Arial,sans-serif;color:#111;padding:32px;line-height:1.5;font-size:13px;white-space:pre-wrap;}h1{font-size:18px;}small{color:#555;}</style>
      </head><body><h1>Termo aceito - ${userName ?? ""}</h1>
      <small>Versão ${a.version} · Aceito em ${new Date(a.accepted_at).toLocaleString("pt-BR")}<br/>User-Agent: ${a.user_agent ?? "—"}</small>
      <hr/>${(a.content_snapshot ?? "").replace(/</g, "&lt;")}</body></html>`);
    w.document.close(); w.focus(); w.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Termos aceitos {userName && `· ${userName}`}</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="grid place-items-center py-10 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : !data || data.length === 0 ? (
          <p className="text-muted-foreground py-6 text-center">Este usuário ainda não aceitou nenhum termo.</p>
        ) : (
          <div className="grid sm:grid-cols-[220px_1fr] gap-3 overflow-hidden flex-1 min-h-0">
            <div className="border border-border rounded-md overflow-y-auto">
              {data.map((a: any) => {
                const isClient = a.version?.startsWith("client-") || a.version?.includes("v1.") && !a.version?.includes("artist");
                const label = a.version?.startsWith("artist-") ? "Tatuador" : isClient ? "Cliente" : "Política";
                return (
                  <button
                    key={a.id}
                    onClick={() => setSelected(a.id)}
                    className={`block w-full text-left p-3 border-b border-border hover:bg-muted/40 ${current?.id === a.id ? "bg-muted/60" : ""}`}
                  >
                    <div className="text-xs uppercase tracking-wider text-primary font-semibold">{label}</div>
                    <div className="text-sm font-medium">v{a.version}</div>
                    <div className="text-xs text-muted-foreground">{new Date(a.accepted_at).toLocaleString("pt-BR")}</div>
                  </button>
                );
              })}
            </div>
            <div className="border border-border rounded-md overflow-y-auto p-4 bg-card">
              {current && (
                <>
                  <div className="flex items-center justify-between mb-3 gap-2">
                    <div className="text-sm text-muted-foreground">Aceito em {new Date(current.accepted_at).toLocaleString("pt-BR")}<br/><span className="text-xs">User-Agent: {current.user_agent ?? "—"}</span></div>
                    <Button size="sm" variant="outline" onClick={() => printOne(current)}><Printer className="h-4 w-4 mr-1" />Imprimir / PDF</Button>
                  </div>
                  <pre className="text-xs whitespace-pre-wrap font-sans leading-relaxed">{current.content_snapshot}</pre>
                </>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}