import { createFileRoute } from "@tanstack/react-router";
import { AssinaturaPage } from "@/components/tatuador/AssinaturaPage";

export const Route = createFileRoute("/_authenticated/tatuador/assinatura")({ component: AssinaturaPage });
