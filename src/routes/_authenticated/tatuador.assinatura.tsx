import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/tatuador/assinatura")({
  beforeLoad: () => { throw redirect({ to: "/tatuador/plano" }); },
});
