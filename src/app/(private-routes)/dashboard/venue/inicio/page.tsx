"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageContainer } from "../../_components/page/page-container";
import { PageHeader } from "../../_components/page/page-header";
import { BlockSkeleton } from "../../_components/states/loading-state";
import { useVenueAccess } from "@/context/VenueAccessContext";

/**
 * Rota inicial padrão do Venue — só permanece aqui quem tem
 * `venue.dashboard.view` amplo (OWNER/MANAGER). Papéis operacionais
 * (RECEPTION/WAITER/CASHIER/KITCHEN_BAR/STOCK) são redirecionados para a
 * rota inicial sugerida pelo backend (`defaultRoute`) assim que o acesso
 * resolve — evita mostrar um painel vazio para quem não vai usá-lo.
 */
export default function VenueInicioPage() {
  const router = useRouter();
  const { loading, defaultRoute } = useVenueAccess();

  useEffect(() => {
    if (!loading && defaultRoute && defaultRoute !== "/dashboard/venue/inicio") {
      router.replace(defaultRoute);
    }
  }, [loading, defaultRoute, router]);

  if (loading || (defaultRoute && defaultRoute !== "/dashboard/venue/inicio")) {
    return (
      <PageContainer>
        <PageHeader title="Início — Venue" description="Resumo da operação de bar / beach club." />
        <BlockSkeleton className="h-96" />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Início — Venue"
        description="Resumo da operação de bar / beach club. (módulo futuro — placeholder)"
      />
    </PageContainer>
  );
}
