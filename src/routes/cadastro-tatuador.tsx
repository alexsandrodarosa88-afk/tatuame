import { createFileRoute, redirect } from "@tanstack/react-router";
export const Route = createFileRoute("/cadastro-tatuador")({ beforeLoad: () => { throw redirect({ to: "/seja-artista", replace: true }); } });
