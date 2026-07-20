"use client";

import { useOrganizations } from "@/context/OrganizationContext";
import { PageContainer } from "../_components/page/page-container";
import { PageHeader } from "../_components/page/page-header";
import { EmptyState } from "../_components/states/empty-state";
import { BlockSkeleton } from "../_components/states/loading-state";
import { selectFinanceDispatch } from "../_lib/finance-dispatch";
import TicketsFinanceiroPage from "./_tickets/tickets-financeiro-content";
import VenueFinanceiroPage from "./_venue/venue-financeiro-content";

/**
 * Rota canônica de Financeiro. Tickets e Venue têm ledgers diferentes e
 * NUNCA são somados (ver docs/platform/unified-navigation.md "Separação
 * financeira" e a arquitetura da Fase 1) — cada bloco renderiza a
 * implementação real já existente, sem recalcular nada aqui. Organização
 * híbrida vê os dois blocos, cada um com seu próprio título; só-Tickets ou
 * só-Venue vê um único bloco.
 */
export default function FinanceiroPage() {
  const { activeModuleKeys, loadingModules } = useOrganizations();

  if (loadingModules) {
    return (
      <PageContainer>
        <PageHeader title="Financeiro" />
        <BlockSkeleton className="h-96" />
      </PageContainer>
    );
  }

  const dispatch = selectFinanceDispatch(activeModuleKeys);

  if (dispatch === "both") {
    return (
      <div className="space-y-10">
        <TicketsFinanceiroPage />
        <VenueFinanceiroPage />
      </div>
    );
  }
  if (dispatch === "venue") return <VenueFinanceiroPage />;
  if (dispatch === "tickets") return <TicketsFinanceiroPage />;

  return (
    <PageContainer>
      <PageHeader title="Financeiro" description="Acompanhe vendas, caixas, despesas e o resultado do negócio." />
      <EmptyState title="Nada ativo ainda" description="Ative Eventos e ingressos ou a Operação em Explore a Nokta para ver o Financeiro." />
    </PageContainer>
  );
}
