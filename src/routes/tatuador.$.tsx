import { createFileRoute, redirect } from "@tanstack/react-router";
export const Route = createFileRoute("/tatuador/$")({
  beforeLoad: () => { throw redirect({ to: "/cadastro-tatuador", replace: true }); },
});
