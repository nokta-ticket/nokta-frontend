"use client";

import { GenericStatusBadge } from "../../estoque/_components/stock-status-badge";
import { EmptyState } from "../../_components/states/empty-state";
import { TableSkeleton } from "../../_components/states/loading-state";
import { ORG_PROMOTER_STATUS_LABEL, type OrganizationPromoterStatus } from "@/services/promoters";
import { useMyPromoterOrganizations } from "../_hooks/use-my-promoter";

function statusTone(status: OrganizationPromoterStatus) {
  if (status === "ACTIVE") return "success" as const;
  if (status === "INVITED") return "neutral" as const;
  if (status === "SUSPENDED") return "warning" as const;
  return "danger" as const;
}

export function OrganizacoesTab() {
  const { data: organizations, isLoading } = useMyPromoterOrganizations(true);

  if (isLoading) return <TableSkeleton />;
  if (!organizations || organizations.length === 0) {
    return <EmptyState title="Nenhuma organização ainda" description="Organizações que já te convidaram como promoter aparecem aqui, mesmo depois de um vínculo terminar." />;
  }

  return (
    <div className="space-y-2">
      {organizations.map((org) => (
        <div key={org.id} className="flex items-center gap-3 rounded-xl border border-black/10 bg-white p-3">
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-gray-900">{org.organization.nome}</p>
            <p className="truncate text-xs text-black/50">Convidado em {new Date(org.invitedAt).toLocaleDateString("pt-BR")}</p>
          </div>
          <GenericStatusBadge label={ORG_PROMOTER_STATUS_LABEL[org.status]} tone={statusTone(org.status)} />
        </div>
      ))}
    </div>
  );
}
