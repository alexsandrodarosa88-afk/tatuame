import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated")({ ssr: false, component: AuthLayout });

function AuthLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login", search: { next: window.location.pathname } });
  }, [loading, user, navigate]);
  if (loading || !user) return <div className="grid min-h-screen place-items-center text-muted-foreground">Carregando...</div>;
  return <Outlet />;
}
