import { RouteRedirect } from "../../_components/route-redirect";

/** Compatibilidade — a implementação real mora em /dashboard/reservas (Fase 4). */
export default function VenueReservasLegacyPage() {
  return <RouteRedirect to="/dashboard/reservas" />;
}
