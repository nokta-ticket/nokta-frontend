"use client";

import { useOrganizations } from "@/context/OrganizationContext";
import { useVenueAccess } from "@/context/VenueAccessContext";
import { PageContainer } from "../_components/page/page-container";
import { PageHeader } from "../_components/page/page-header";
import { EmptyState } from "../_components/states/empty-state";
import { BlockSkeleton } from "../_components/states/loading-state";
import { AvaliacoesList } from "./_components/avaliacoes-list";

export default function AvaliacoesPage() {
  const { currentOrg, loadingOrgs } = useOrganizations();
  const { can, loading: loadingAccess } = useVenueAccess();

  const description = "Veja o que os clientes acharam da experiência no seu estabelecimento.";

  if (loadingOrgs || loadingAccess) {
    return (
      <PageContainer>
        <PageHeader title="Avaliações" description={description} />
        <BlockSkeleton className="h-96" />
      </PageContainer>
    );
  }

  if (!currentOrg) {
    return (
      <PageContainer>
        <PageHeader title="Avaliações" description={description} />
        <EmptyState title="Nenhuma organização selecionada" description="Selecione uma organização para ver as avaliações." />
      </PageContainer>
    );
  }

  if (!can("venue.reviews.view")) {
    return (
      <PageContainer>
        <PageHeader title="Avaliações" description={description} />
        <EmptyState title="Sem acesso" description="Você não tem permissão para ver as avaliações desta organização." />
      </PageContainer>
    );
  }

  const canManage = can("venue.reviews.manage");

  return (
    <PageContainer>
      <PageHeader title="Avaliações" description={description} />
      <AvaliacoesList orgId={currentOrg.id} canManage={canManage} />
    </PageContainer>
  );
}
