import { createFileRoute, redirect } from "@tanstack/react-router";
export const Route = createFileRoute("/cadastro-tatuador")({ staticData: { sitemap: false }, beforeLoad: () => { throw redirect({ to: "/seja-artista", replace: true }); } });
