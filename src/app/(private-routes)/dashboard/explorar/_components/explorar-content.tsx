"use client";

import { useEffect, useState } from "react";
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
  BusinessNeedGroupsPicker,
  flattenSelection,
  type BusinessNeedSelectionState,
} from "../../_components/business-needs/business-need-groups-picker";
import { Button } from "@/components/ui/button";
import {
  useActivateBusinessNeeds,
  useBusinessNeedsCatalog,
  useBusinessProfile,
  useCapabilities,
  useDeactivateCapability,
  useDismissRecommendation,
  useRecommendations,
} from "../../_hooks/use-platform";
import { RecommendationsPanel } from "./recommendations-panel";
import { DeactivateCapabilityDialog } from "./deactivate-capability-dialog";

const TITLE = "Explore a Nokta";
const DESCRIPTION = "Conheça e ative as funcionalidades disponíveis para o seu negócio, organizadas por como você trabalha.";

function Header() {
  return <PageHeader title={TITLE} description={DESCRIPTION} />;
}

export function ExplorarContent() {
  const { currentOrg, loadingOrgs } = useOrganizations();
  const orgId = currentOrg?.id ?? null;

  const catalog = useBusinessNeedsCatalog(orgId);
  const capabilities = useCapabilities(orgId);
  const recommendations = useRecommendations(orgId);
  const businessProfile = useBusinessProfile(orgId);
  const activateNeeds = useActivateBusinessNeeds(orgId ?? -1);
  const deactivate = useDeactivateCapability(orgId ?? -1);
  const dismiss = useDismissRecommendation(orgId ?? -1);

  const [selection, setSelection] = useState<BusinessNeedSelectionState | null>(null);
  const [dismissingKey, setDismissingKey] = useState<string | null>(null);
  const [pendingDeactivateKey, setPendingDeactivateKey] = useState<string | null>(null);

  useEffect(() => {
    // Explore parte de "nada novo marcado além do que já está ativo" —
    // diferente do onboarding (que pré-marca o grupo default), aqui o
    // usuário está adicionando por cima do que já existe.
    if (catalog.data && !selection) {
      setSelection({ selectedGroupKeys: new Set(), deselectedCapabilityKeysByGroup: new Map() });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalog.data]);

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

  if (catalog.isError) {
    const status = axios.isAxiosError(catalog.error) ? catalog.error.response?.status : undefined;
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
        <ErrorState description={getErrorMessage(catalog.error, "Não foi possível carregar o Explore a Nokta.")} onRetry={() => catalog.refetch()} />
      </PageContainer>
    );
  }

  if (catalog.isLoading || capabilities.isLoading || !catalog.data || !capabilities.data || !selection) {
    return (
      <PageContainer>
        <Header />
        <BlockSkeleton className="h-96" />
      </PageContainer>
    );
  }

  const activeCapabilityKeys = new Set(capabilities.data.filter((c) => c.status === "ACTIVE").map((c) => c.key));

  const handleDismiss = (key: string) => {
    setDismissingKey(key);
    dismiss.mutate(key, {
      onError: (err) => toast.error(getErrorMessage(err, "Não foi possível dispensar a recomendação.")),
      onSettled: () => setDismissingKey(null),
    });
  };

  const handleDeactivate = (key: string) => setPendingDeactivateKey(key);

  const confirmDeactivate = () => {
    if (!pendingDeactivateKey) return;
    const key = pendingDeactivateKey;
    setPendingDeactivateKey(null);
    deactivate.mutate(key, {
      onSuccess: () => toast.success("Capacidade desativada."),
      onError: (err) => toast.error(getErrorMessage(err, "Não foi possível desativar.")),
    });
  };

  const handleActivateSelection = () => {
    if (!catalog.data) return;
    const payload = flattenSelection(catalog.data, selection);
    if (payload.businessNeedKeys.length === 0) return;
    activateNeeds.mutate(payload, {
      onSuccess: () => {
        toast.success("Funcionalidades ativadas.");
        setSelection({ selectedGroupKeys: new Set(), deselectedCapabilityKeysByGroup: new Map() });
      },
      onError: (err) => toast.error(getErrorMessage(err, "Não foi possível ativar.")),
    });
  };

  const pendingCapabilityLabel = pendingDeactivateKey
    ? (catalog.data.flatMap((g) => g.capabilities).find((c) => c.key === pendingDeactivateKey)?.label ?? pendingDeactivateKey)
    : "";

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

      <BusinessNeedGroupsPicker
        groups={catalog.data}
        selection={selection}
        onChange={setSelection}
        activeCapabilityKeys={activeCapabilityKeys}
        onDeactivateCapability={handleDeactivate}
        deactivatingKey={deactivate.isPending ? pendingDeactivateKey : null}
      />

      <div className="sticky bottom-4 flex justify-end">
        <Button
          onClick={handleActivateSelection}
          disabled={selection.selectedGroupKeys.size === 0 || activateNeeds.isPending}
          className="shadow-lg"
        >
          {activateNeeds.isPending ? "Ativando…" : "Ativar selecionadas"}
        </Button>
      </div>

      <DeactivateCapabilityDialog
        open={Boolean(pendingDeactivateKey)}
        onOpenChange={(open) => !open && setPendingDeactivateKey(null)}
        capabilityName={pendingCapabilityLabel}
        onConfirm={confirmDeactivate}
      />
    </PageContainer>
  );
}
