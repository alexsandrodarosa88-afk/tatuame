import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";

export type ArtistApplication = {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  address: string;
  cpf: string;
  status: "pending" | "approved" | "rejected";
  notes: string | null;
  created_at: string;
};

export type ArtistProfile = {
  id: string;
  user_id: string | null;
  name: string;
  photo_url: string | null;
  bio: string | null;
  styles: string[];
  city: string | null;
  state: string | null;
  address: string | null;
  instagram: string | null;
  whatsapp: string | null;
  is_active: boolean;
};

export function useArtist() {
  const { user, loading: authLoading } = useAuth();
  const [application, setApplication] = useState<ArtistApplication | null>(null);
  const [artist, setArtist] = useState<ArtistProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!user) { setApplication(null); setArtist(null); setLoading(false); return; }
    setLoading(true);
    const [{ data: app }, { data: art }] = await Promise.all([
      supabase.from("artist_applications").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("tattoo_artists").select("*").eq("user_id", user.id).maybeSingle(),
    ]);
    setApplication((app as ArtistApplication) ?? null);
    setArtist((art as ArtistProfile) ?? null);
    setLoading(false);
  }, [user]);

  useEffect(() => { if (!authLoading) reload(); }, [authLoading, reload]);

  return { application, artist, loading: loading || authLoading, reload };
}