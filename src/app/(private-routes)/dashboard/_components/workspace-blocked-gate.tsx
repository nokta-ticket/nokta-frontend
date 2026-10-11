"use client";

import type { ReactNode } from "react";
import { Ban } from "lucide-react";
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
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-20 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#fcf5f6] text-[#9b1c35]">
        <Ban className="h-6 w-6" />
      </div>
      <h1 className="text-lg font-semibold text-gray-900">Este workspace está bloqueado</h1>
      <p className="text-sm text-gray-600">
        {currentOrg.nome} está com o acesso suspenso pela Nokta. Nada foi apagado. Fale com o suporte para
        regularizar.
      </p>
    </div>
  );
}
