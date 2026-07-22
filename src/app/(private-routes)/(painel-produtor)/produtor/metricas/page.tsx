import { RouteRedirect } from "@/app/(private-routes)/dashboard/_components/route-redirect";

/** Compatibilidade — a implementação real mora em /dashboard/insights (Fase 5). */
export default function ProdutorMetricasLegacyPage() {
  return <RouteRedirect to="/dashboard/insights" />;
}
