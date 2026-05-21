import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AdminNotification = {
  id: string;
  type: string;
  title: string;
  message: string | null;
  link: string | null;
  related_id: string | null;
  is_read: boolean;
  created_at: string;
};

export function useAdminNotifications() {
  const [items, setItems] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const { data } = await (supabase as any)
      .from("admin_notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(30);
    setItems((data as AdminNotification[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    reload();
    const channel = supabase
      .channel("admin_notifications_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "admin_notifications" }, () => reload())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [reload]);

  const markAllRead = async () => {
    await (supabase as any).from("admin_notifications").update({ is_read: true }).eq("is_read", false);
    reload();
  };

  const markRead = async (id: string) => {
    await (supabase as any).from("admin_notifications").update({ is_read: true }).eq("id", id);
    reload();
  };

  const unread = items.filter((n) => !n.is_read).length;
  return { items, unread, loading, markAllRead, markRead, reload };
}
