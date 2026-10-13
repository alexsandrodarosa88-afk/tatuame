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
  faq?: { q: string; a: string }[];
};

export async function loadSettings(): Promise<SiteSettings> {
  const { data } = await db.from("site_settings").select("data").eq("id", 1).maybeSingle();
  return (data?.data ?? {}) as SiteSettings;
}
