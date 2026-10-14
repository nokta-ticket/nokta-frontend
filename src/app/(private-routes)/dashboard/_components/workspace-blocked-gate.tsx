"use client";

import type { ReactNode } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { useOrganizations } from "@/context/OrganizationContext";

/**
 * Workspace bloqueado pelo painel admin (`status !== "ACTIVE"`): a API já
 * recusa tudo com 403, então em vez de cada tela mostrar o seu erro, o
 * conteúdo dá lugar a um aviso único. O topo continua visível para quem tem
 * outro workspace poder trocar.
 */
export function WorkspaceBlockedGate({ children }: { children: ReactNode }) {
  const { currentOrg } = useOrganizations();

  if (!currentOrg || currentOrg.status === "ACTIVE") return <>{children}</>;

  return (
    <div className="mx-auto w-full max-w-md py-16">
      <EmptyState icon="ban" title="Este workspace está bloqueado" description={`${currentOrg.nome} está com o acesso suspenso pela Nokta. Nada foi apagado — fale com o suporte para regularizar.`} />
    </div>
  );
}
