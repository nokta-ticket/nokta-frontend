import { RouteRedirect } from "@/app/(private-routes)/dashboard/_components/route-redirect";

/** Compatibilidade — a implementação real mora em /dashboard/onboarding (Fase 5). */
export default function ProdutorOnboardingLegacyPage() {
  return <RouteRedirect to="/dashboard/onboarding" />;
}
