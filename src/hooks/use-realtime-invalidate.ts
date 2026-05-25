import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Subscribe to realtime changes on a Postgres table and invalidate the given
 * react-query keys whenever something changes. Use to make views update
 * instantly when orders are paid / campaigns sold_quotas change.
 */
export function useRealtimeInvalidate(table: string, queryKeys: (string | string[])[]) {
  const qc = useQueryClient();
  useEffect(() => {
    const channel = supabase
      .channel(`rt-${table}-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        () => {
          for (const k of queryKeys) {
            qc.invalidateQueries({ queryKey: Array.isArray(k) ? k : [k] });
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table]);
}

/**
 * Same as above but fires a callback instead of invalidating queries.
 * Useful for pages that load state with useState/useEffect rather than react-query.
 */
export function useRealtimeCallback(table: string, cb: () => void) {
  useEffect(() => {
    const channel = supabase
      .channel(`rt-cb-${table}-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        () => cb(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table]);
}