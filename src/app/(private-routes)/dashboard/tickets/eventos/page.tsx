import { RouteRedirect } from "../../_components/route-redirect";

/** Compatibilidade — a implementação real mora em /dashboard/eventos (Fase 4). */
export default function TicketsEventosLegacyPage() {
  return <RouteRedirect to="/dashboard/eventos" />;
}
