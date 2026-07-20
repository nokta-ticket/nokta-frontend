"use client";

import { useState } from "react";
import axios from "axios";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { useOrganizations } from "@/context/OrganizationContext";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { PageContainer } from "../../_components/page/page-container";
import { PageHeader } from "../../_components/page/page-header";
import { EmptyState } from "../../_components/states/empty-state";
import { ErrorState } from "../../_components/states/error-state";
import { BlockSkeleton } from "../../_components/states/loading-state";
import {
  useActivateCapability,
  useBusinessProfile,
  useDeactivateCapability,
  useDismissRecommendation,
  useExplore,
  useRecommendations,
} from "../../_hooks/use-platform";
import { sortExploreGroups } from "../_lib/capability-display";
import { ExploreCard } from "./explore-card";
import { RecommendationsPanel } from "./recommendations-panel";

const TITLE = "Explore a Nokta";
const DESCRIPTION = "Conheça e ative as funcionalidades disponíveis para o seu negócio.";

function Header() {
  return <PageHeader title={TITLE} description={DESCRIPTION} />;
}

export function ExplorarContent() {
  const { currentOrg, loadingOrgs } = useOrganizations();
  const orgId = currentOrg?.id ?? null;

  const explore = useExplore(orgId);
  const recommendations = useRecommendations(orgId);
  const businessProfile = useBusinessProfile(orgId);
  const activate = useActivateCapability(orgId ?? -1);
  const deactivate = useDeactivateCapability(orgId ?? -1);
  const dismiss = useDismissRecommendation(orgId ?? -1);

  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [dismissingKey, setDismissingKey] = useState<string | null>(null);

  if (loadingOrgs) {
    return (
      <PageContainer>
        <Header />
        <BlockSkeleton className="h-96" />
      </PageContainer>
    );
  }

  if (!orgId) {
    return (
      <PageContainer>
        <Header />
        <EmptyState title="Nenhuma organização selecionada" description="Selecione uma organização para continuar." />
      </PageContainer>
    );
  }

  if (explore.isError) {
    const status = axios.isAxiosError(explore.error) ? explore.error.response?.status : undefined;
    if (status === 403) {
      return (
        <PageContainer>
          <Header />
          <EmptyState
            title="Sem acesso ao Explore"
            description="Só o proprietário ou um gerente autorizado pode ver as funcionalidades disponíveis para ativação."
          />
        </PageContainer>
      );
    }
    return (
      <PageContainer>
        <Header />
        <ErrorState description={getErrorMessage(explore.error, "Não foi possível carregar o Explore a Nokta.")} onRetry={() => explore.refetch()} />
      </PageContainer>
    );
  }

  if (explore.isLoading || !explore.data) {
    return (
      <PageContainer>
        <Header />
        <BlockSkeleton className="h-96" />
      </PageContainer>
    );
  }

  const groups = sortExploreGroups(explore.data).filter((g) => g.cards.length > 0);
  const recommendationByKey = new Map((recommendations.data ?? []).map((r) => [r.capabilityKey, r.reason]));

  const handleActivate = (key: string) => {
    setPendingKey(key);
    activate.mutate(key, {
      onSuccess: () => toast.success("Capacidade ativada."),
      onError: (err) => toast.error(getErrorMessage(err, "Não foi possível ativar.")),
      onSettled: () => setPendingKey(null),
    });
  };

  const handleDeactivate = (key: string) => {
    setPendingKey(key);
    deactivate.mutate(key, {
      onSuccess: () => toast.success("Capacidade desativada."),
      onError: (err) => toast.error(getErrorMessage(err, "Não foi possível desativar.")),
      onSettled: () => setPendingKey(null),
    });
  };

  const handleDismiss = (key: string) => {
    setDismissingKey(key);
    dismiss.mutate(key, {
      onError: (err) => toast.error(getErrorMessage(err, "Não foi possível dispensar a recomendação.")),
      onSettled: () => setDismissingKey(null),
    });
  };

  return (
    <PageContainer>
      <Header />

      {businessProfile.data && !businessProfile.data.profileCompletedAt ? (
        <Link
          href="/dashboard/onboarding"
          className="flex items-center gap-2 rounded-lg border border-violet-200 bg-violet-50 p-3 text-sm text-violet-800 hover:bg-violet-100"
        >
          <Sparkles size={16} />
          Complete o perfil da sua organização para receber recomendações melhores.
        </Link>
      ) : null}

      {!recommendations.isError ? (
        <RecommendationsPanel recommendations={recommendations.data ?? []} onDismiss={handleDismiss} dismissingKey={dismissingKey} />
      ) : null}

      {groups.length === 0 ? (
        <EmptyState title="Nada para explorar por aqui" description="Todas as funcionalidades disponíveis para o seu perfil já estão ativas." />
      ) : (
        <div className="space-y-8">
          {groups.map((group) => (
            <section key={group.group} className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-black/50">{group.groupLabel}</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {group.cards.map((card) => (
                  <ExploreCard
                    key={card.key}
                    card={card}
                    recommendationReason={recommendationByKey.get(card.key) ?? null}
                    onActivate={() => handleActivate(card.key)}
                    onDeactivate={() => handleDeactivate(card.key)}
                    activating={activate.isPending && pendingKey === card.key}
                    deactivating={deactivate.isPending && pendingKey === card.key}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
