import { createFileRoute, redirect } from "@tanstack/react-router";
export const Route = createFileRoute("/tatuador-acesso")({ beforeLoad: () => { throw redirect({ to: "/cadastro-tatuador", replace: true }); } });
