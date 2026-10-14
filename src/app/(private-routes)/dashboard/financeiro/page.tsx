"use client";

import { useState } from "react";
import { useOrganizations } from "@/context/OrganizationContext";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Skeleton } from "@/components/ui/skeleton";
import { useRequireWorkspace } from "../_components/require-workspace-provider";
import { selectFinanceDispatch } from "../_lib/finance-dispatch";
import TicketsFinanceiroPage from "./_tickets/tickets-financeiro-content";
import VenueFinanceiroPage from "./_venue/venue-financeiro-content";

type Context = "tickets" | "venue";

/**
 * Rota canônica de Financeiro. Ingressos (dinheiro na conta da Nokta, com
 * saldo e saque) e Bar e restaurante (dinheiro direto na maquininha) nunca
 * são somados: organização com os dois módulos escolhe o contexto no seletor.
 */
export default function FinanceiroPage() {
  const { currentOrg, activeModuleKeys, loadingOrgs, loadingModules } = useOrganizations();
  const { guard } = useRequireWorkspace();
  const [context, setContext] = useState<Context>("tickets");

  if (loadingOrgs || loadingModules) {
    return (
      <div className="space-y-6">
        <PageHeader title="Financeiro" />
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-card" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-card" />
      </div>
    );
  }

  if (!currentOrg) {
    return (
      <div className="space-y-6">
        <PageHeader title="Financeiro" />
        <EmptyState icon="wallet" title="Nada por aqui ainda" description="Crie seu workspace para acompanhar as vendas e os saques." action={<Button onClick={() => guard(() => undefined)}>Criar workspace</Button>} />
      </div>
    );
  }

  const dispatch = selectFinanceDispatch(activeModuleKeys);

  if (dispatch === "both") {
    const contextSwitch = (
      <SegmentedControl
        value={context}
        onChange={setContext}
        options={[
          { value: "tickets", label: "Ingressos", icon: "ticket" },
          { value: "venue", label: "Bar e restaurante", icon: "utensils" },
        ]}
      />
    );
    return context === "tickets" ? <TicketsFinanceiroPage contextSwitch={contextSwitch} /> : <VenueFinanceiroPage contextSwitch={contextSwitch} />;
  }
  if (dispatch === "venue") return <VenueFinanceiroPage />;
  if (dispatch === "tickets") return <TicketsFinanceiroPage />;

  return (
    <div className="space-y-6">
      <PageHeader title="Financeiro" />
      <EmptyState icon="wallet" title="Nada ativo ainda" description="Ative Eventos e ingressos ou a Operação em Explore a Nokta para ver o Financeiro." />
    </div>
  );
}
