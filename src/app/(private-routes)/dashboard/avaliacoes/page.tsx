"use client";

import { useOrganizations } from "@/context/OrganizationContext";
import { useVenueAccess } from "@/context/VenueAccessContext";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { AvaliacoesList } from "./_components/avaliacoes-list";

const TITLE = "Avaliações";

export default function AvaliacoesPage() {
  const { currentOrg, loadingOrgs } = useOrganizations();
  const { can, loading: loadingAccess } = useVenueAccess();

  if (loadingOrgs || loadingAccess) {
    return (
      <div className="space-y-6">
        <PageHeader title={TITLE} />
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-28 rounded-card" />
          <Skeleton className="h-28 rounded-card" />
          <Skeleton className="h-28 rounded-card" />
        </div>
        <Skeleton className="h-80 rounded-card" />
      </div>
    );
  }

  if (!currentOrg) {
    return (
      <div className="space-y-6">
        <PageHeader title={TITLE} />
        <EmptyState icon="building" title="Nenhuma organização selecionada" description="Escolha uma organização no menu lateral pra ver as avaliações." />
      </div>
    );
  }

  if (!can("venue.reviews.view")) {
    return (
      <div className="space-y-6">
        <PageHeader title={TITLE} />
        <EmptyState icon="lock" title="Sem acesso às avaliações" description="Peça ao responsável pela organização a permissão de ver avaliações." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={TITLE} description="O que os clientes acharam, direto do link público de avaliação." />
      <AvaliacoesList orgId={currentOrg.id} canManage={can("venue.reviews.manage")} />
    </div>
  );
}
