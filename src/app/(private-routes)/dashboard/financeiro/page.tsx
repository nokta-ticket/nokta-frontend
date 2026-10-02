"use client";

import { useState } from "react";
import { useOrganizations } from "@/context/OrganizationContext";
import { useRequireWorkspace } from "../_components/require-workspace-provider";
import { PageContainer } from "../_components/page/page-container";
import { EmptyState } from "../_components/states/empty-state";
import { BlockSkeleton } from "../_components/states/loading-state";
import { selectFinanceDispatch } from "../_lib/finance-dispatch";
import { cn } from "@/lib/utils";
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
      <PageContainer>
        <BlockSkeleton className="h-96" />
      </PageContainer>
    );
  }

  if (!currentOrg) {
    return (
      <PageContainer>
        <EmptyState
          title="Nada por aqui ainda"
          description="Crie seu workspace para acompanhar as vendas e os saques."
          actionLabel="Criar workspace"
          onAction={() => guard(() => {})}
        />
      </PageContainer>
    );
  }

  const dispatch = selectFinanceDispatch(activeModuleKeys);

  if (dispatch === "both") {
    const contextSwitch = (
      <div role="tablist" aria-label="Contexto financeiro" className="flex gap-1 rounded-[12px] bg-[#efecf6] p-1">
        {(
          [
            ["tickets", "Ingressos"],
            ["venue", "Bar e restaurante"],
          ] as [Context, string][]
        ).map(([k, l]) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={context === k}
            onClick={() => setContext(k)}
            className={cn(
              "rounded-[9px] px-3.5 py-1.5 text-[13.5px] font-semibold transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.97]",
              context === k ? "bg-white text-[#1c1a24] shadow-[0_1px_2px_rgba(28,24,48,0.1)]" : "text-[#5f5c6b] hover:text-[#1c1a24]",
            )}
          >
            {l}
          </button>
        ))}
      </div>
    );
    return context === "tickets" ? <TicketsFinanceiroPage contextSwitch={contextSwitch} /> : <VenueFinanceiroPage contextSwitch={contextSwitch} />;
  }
  if (dispatch === "venue") return <VenueFinanceiroPage />;
  if (dispatch === "tickets") return <TicketsFinanceiroPage />;

  return (
    <PageContainer>
      <EmptyState title="Nada ativo ainda" description="Ative Eventos e ingressos ou a Operação em Explore a Nokta para ver o Financeiro." />
    </PageContainer>
  );
}
