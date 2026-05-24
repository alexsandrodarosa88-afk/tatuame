import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

export type SiteSettings = Record<string, string>;

async function fetchSiteSettings(): Promise<SiteSettings> {
  const { data, error } = await supabase.from("site_settings").select("key,value");
  if (error) throw error;
  const out: SiteSettings = {};
  for (const row of data ?? []) out[row.key as string] = (row.value as string) ?? "";
  return out;
}

export function useSiteSettings() {
  // Avoid SSR/client hydration mismatch: only expose fetched values after mount.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const { data } = useQuery({
    queryKey: ["site_settings"],
    queryFn: fetchSiteSettings,
    staleTime: 60_000,
  });
  const get = (key: string, fallback = "") =>
    mounted && data?.[key] && data[key].length ? data[key] : fallback;
  return { settings: mounted ? data ?? {} : {}, get };
}

export function useInvalidateSiteSettings() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["site_settings"] });
}