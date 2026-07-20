import { RouteRedirect } from "../../_components/route-redirect";

/** Compatibilidade — a implementação real mora em /dashboard/insights (Fase 4). */
export default function VenueInsightsLegacyPage() {
  return <RouteRedirect to="/dashboard/insights" />;
}
