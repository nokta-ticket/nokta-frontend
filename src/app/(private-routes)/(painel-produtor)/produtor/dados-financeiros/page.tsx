import { RouteRedirect } from "@/app/(private-routes)/dashboard/_components/route-redirect";

/** Compatibilidade — a implementação real mora em /dashboard/eventos/dados-financeiros (Fase 5). */
export default function ProdutorDadosFinanceirosLegacyPage() {
  return <RouteRedirect to="/dashboard/eventos/dados-financeiros" />;
}
