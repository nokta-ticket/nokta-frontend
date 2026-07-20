import { RouteRedirect } from "../../_components/route-redirect";

/** Compatibilidade — a Início unificada mora em /dashboard/inicio (Fase 4). */
export default function TicketsInicioLegacyPage() {
  return <RouteRedirect to="/dashboard/inicio" />;
}
