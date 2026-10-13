import { useEffect, useState } from "react";
import { db } from "@/lib/db";
import { useAuth } from "./use-auth";

export function useIsAdmin() {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setIsAdmin(false); setLoading(false); return; }
    db.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle()
      .then(({ data }: any) => { setIsAdmin(!!data); setLoading(false); });
  }, [user, authLoading]);

  return { isAdmin, loading: loading || authLoading };
}
