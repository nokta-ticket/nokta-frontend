import { redirect } from "next/navigation";
import { isUnifiedDashboardEnabled } from "@/lib/feature-flags";

// Com a navegação unificada (Fase 3) ligada, /dashboard vai direto para a
// Início unificada. Com a flag desligada, mantém o comportamento antigo:
// contexto default "tickets" — se a org for só-venue, o ProductProvider
// corrige no client para /dashboard/venue/inicio.
export default function DashboardIndex() {
  redirect(isUnifiedDashboardEnabled() ? "/dashboard/inicio" : "/dashboard/tickets/inicio");
}
