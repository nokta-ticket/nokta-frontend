import { RouteRedirect } from "@/app/(private-routes)/dashboard/_components/route-redirect";

/** Compatibilidade — a implementação real mora em /dashboard/eventos (Fase 5). */
export default function ProdutorEventosLegacyPage() {
  return <RouteRedirect to="/dashboard/eventos" />;
}
