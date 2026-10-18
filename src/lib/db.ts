import { supabase } from "@/integrations/supabase/client";

// Untyped handle so screens keep working while generated types catch up with the schema.
export const db = supabase as any;

export const BRL = (v: number | string | null | undefined) =>
  Number(v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const BRAZIL_STATES = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

export type SiteSettings = {
  hero_title?: string;
  hero_subtitle?: string;
  whatsapp?: string;
  instagram?: string;
  faq?: { q: string; a: string }[];
  texts?: Record<string, string>;
  images?: Record<string, string>;
  colors?: Record<string, string>;
};

export async function loadSettings(): Promise<SiteSettings> {
  const { data } = await db.from("site_settings").select("data").eq("id", 1).maybeSingle();
  return (data?.data ?? {}) as SiteSettings;
}

/** % mostrado ao público: base do ADM + % real vendido (sobe a cada cota paga). */
export async function withPublicPercent(c: any) {
  const { data } = await db.rpc("campaign_sold", { _campaign_id: c.id });
  const sold = Number(data ?? 0);
  const real = c.total_quotas > 0 ? (sold / c.total_quotas) * 100 : 0;
  const pct = c.status === "encerrada" ? 100 : Math.min(100, Math.round(((c.display_percent ?? 0) + real) * 10) / 10);
  return { ...c, public_percent: pct };
}
