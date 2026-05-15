import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export const listActiveCampaigns = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false } }
  );
  const { data, error } = await supabase
    .from("campaigns")
    .select("id, tattoo_value, price_per_quota, total_quotas, sold_quotas, ends_at, status, title")
    .eq("status", "active")
    .order("tattoo_value", { ascending: true });
  if (error) throw error;
  return data ?? [];
});
