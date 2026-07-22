import { RouteRedirect } from "@/app/(private-routes)/dashboard/_components/route-redirect";

/** Compatibilidade — a implementação real mora em /dashboard/financeiro (Fase 5). */
export default function ProdutorFinanceiroLegacyPage() {
  return <RouteRedirect to="/dashboard/financeiro" />;
}
