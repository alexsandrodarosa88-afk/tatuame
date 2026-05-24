import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SiteSettings = Record<string, string>;

async function fetchSiteSettings(): Promise<SiteSettings> {
  const { data, error } = await supabase.from("site_settings").select("key,value");
  if (error) throw error;
  const out: SiteSettings = {};
  for (const row of data ?? []) out[row.key as string] = (row.value as string) ?? "";
  return out;
}

export function useSiteSettings() {
  const { data } = useQuery({
    queryKey: ["site_settings"],
    queryFn: fetchSiteSettings,
    staleTime: 60_000,
  });
  const get = (key: string, fallback = "") => (data?.[key] && data[key].length ? data[key] : fallback);
  return { settings: data ?? {}, get };
}

export function useInvalidateSiteSettings() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["site_settings"] });
}