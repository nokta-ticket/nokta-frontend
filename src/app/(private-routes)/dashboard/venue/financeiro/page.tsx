import { RouteRedirect } from "../../_components/route-redirect";

/** Compatibilidade — a implementação real mora em /dashboard/financeiro (Fase 4). */
export default function VenueFinanceiroLegacyPage() {
  return <RouteRedirect to="/dashboard/financeiro" />;
}
