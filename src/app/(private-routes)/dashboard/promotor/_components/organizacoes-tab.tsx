"use client";

import { ORG_PROMOTER_STATUS_LABEL } from "@/services/promoters";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { RowsSkeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/badge";
import { ORG_PROMOTER_TONE } from "../../promotores/_components/promoter-meta";
import { useMyPromoterOrganizations } from "../_hooks/use-my-promoter";

export function OrganizacoesTab() {
  const { data: organizations, isLoading } = useMyPromoterOrganizations(true);

  if (isLoading) return <RowsSkeleton rows={3} />;
  if (!organizations || organizations.length === 0) {
    return <EmptyState icon="building" title="Nenhuma organização ainda" description="Organizações que já te convidaram como promoter aparecem aqui, mesmo depois de um vínculo terminar." />;
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {organizations.map((org, i) => (
        <article key={org.id} className="fade-up flex items-center gap-3 rounded-card border border-border bg-surface p-4 shadow-card" style={{ ["--i" as string]: i } as never}>
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
            <Icon name="building" size={15} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">{org.organization.nome}</p>
            <p className="text-caption text-muted-foreground">Convidado em {new Date(org.invitedAt).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}</p>
          </div>
          <StatusBadge tone={ORG_PROMOTER_TONE[org.status]}>{ORG_PROMOTER_STATUS_LABEL[org.status]}</StatusBadge>
        </article>
      ))}
    </div>
  );
}
