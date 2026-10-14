"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useOrganizations } from "@/context/OrganizationContext";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { BusinessNeedGroupsPicker, flattenSelection, type BusinessNeedSelectionState } from "../../_components/business-needs/business-need-groups-picker";
import { useActivateBusinessNeeds, useBusinessNeedsCatalog, useCapabilities, useDeactivateCapability, useDismissRecommendation, useRecommendations } from "../../_hooks/use-platform";
import { RecommendationsPanel } from "./recommendations-panel";
import { DeactivateCapabilityDialog } from "./deactivate-capability-dialog";

const TITLE = "Explore a Nokta";
const DESCRIPTION = "Ative as funcionalidades que fazem sentido pro seu negócio, organizadas por como você trabalha.";

function Header() {
  return <PageHeader title={TITLE} description={DESCRIPTION} />;
}

export function ExplorarSkeleton() {
  return (
    <div className="space-y-6">
      <Header />
      <Skeleton className="h-16 w-full rounded-card" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-36 rounded-card" />
        ))}
      </div>
    </div>
  );
}

export function ExplorarContent() {
  const { currentOrg, loadingOrgs } = useOrganizations();
  const orgId = currentOrg?.id ?? null;

  const catalog = useBusinessNeedsCatalog(orgId);
  const capabilities = useCapabilities(orgId);
  const recommendations = useRecommendations(orgId);
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

  if (loadingOrgs) return <ExplorarSkeleton />;

  if (!orgId) {
    return (
      <div className="space-y-6">
        <Header />
        <EmptyState icon="building" title="Nenhuma organização selecionada" description="Selecione uma organização para continuar." />
      </div>
    );
  }

  if (catalog.isError) {
    const status = axios.isAxiosError(catalog.error) ? catalog.error.response?.status : undefined;
    if (status === 403) {
      return (
        <div className="space-y-6">
          <Header />
          <EmptyState icon="lock" title="Sem acesso ao Explore" description="Só o proprietário ou um gerente autorizado pode ver as funcionalidades disponíveis para ativação." />
        </div>
      );
    }
    return (
      <div className="space-y-6">
        <Header />
        <ErrorState description={getErrorMessage(catalog.error, "Não foi possível carregar o Explore a Nokta.")} onRetry={() => catalog.refetch()} />
      </div>
    );
  }

  if (catalog.isLoading || capabilities.isLoading || !catalog.data || !capabilities.data || !selection) {
    return <ExplorarSkeleton />;
  }

  const activeCapabilityKeys = new Set(capabilities.data.filter((c) => c.status === "ACTIVE").map((c) => c.key));
  const activeCount = activeCapabilityKeys.size;
  const totalCount = catalog.data.reduce((sum, g) => sum + g.capabilities.length, 0);

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

  const payload = flattenSelection(catalog.data, selection);
  const selectedCapabilityCount = payload.capabilityKeys
    ? payload.capabilityKeys.filter((k) => !activeCapabilityKeys.has(k)).length
    : catalog.data.filter((g) => selection.selectedGroupKeys.has(g.key)).reduce((sum, g) => sum + g.capabilities.filter((c) => !activeCapabilityKeys.has(c.key)).length, 0);

  const handleActivateSelection = () => {
    if (!catalog.data) return;
    if (payload.businessNeedKeys.length === 0) return;
    activateNeeds.mutate(payload, {
      onSuccess: () => {
        toast.success("Funcionalidades ativadas.");
        setSelection({ selectedGroupKeys: new Set(), deselectedCapabilityKeysByGroup: new Map() });
      },
      onError: (err) => toast.error(getErrorMessage(err, "Não foi possível ativar.")),
    });
  };

  const pendingCapabilityLabel = pendingDeactivateKey ? (catalog.data.flatMap((g) => g.capabilities).find((c) => c.key === pendingDeactivateKey)?.label ?? pendingDeactivateKey) : "";
  const hasSelection = selection.selectedGroupKeys.size > 0;

  return (
    <div className="space-y-8 pb-24">
      <PageHeader
        title={TITLE}
        description={DESCRIPTION}
        meta={
          <span className="tnum">
            {activeCount} de {totalCount} funcionalidades ativas
          </span>
        }
      />

      {!recommendations.isError ? <RecommendationsPanel recommendations={recommendations.data ?? []} onDismiss={handleDismiss} dismissingKey={dismissingKey} /> : null}

      <BusinessNeedGroupsPicker groups={catalog.data} selection={selection} onChange={setSelection} activeCapabilityKeys={activeCapabilityKeys} onDeactivateCapability={handleDeactivate} deactivatingKey={deactivate.isPending ? pendingDeactivateKey : null} />

      {/* Barra de ação flutuante: só aparece com algo marcado. */}
      <div aria-live="polite" className={`pointer-events-none fixed inset-x-0 bottom-0 z-20 flex justify-center px-4 pb-safe transition-all duration-300 ease-out-soft lg:left-[272px] ${hasSelection ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}>
        <div className="pointer-events-auto mb-4 flex w-full max-w-xl items-center gap-3 rounded-card border border-border bg-surface/95 p-3 pl-4 shadow-3 backdrop-blur-md">
          <p className="min-w-0 flex-1 text-sm text-foreground">
            <span className="font-semibold tnum">{selectedCapabilityCount}</span> {selectedCapabilityCount === 1 ? "funcionalidade marcada" : "funcionalidades marcadas"}
          </p>
          <Button variant="ghost" size="sm" onClick={() => setSelection({ selectedGroupKeys: new Set(), deselectedCapabilityKeysByGroup: new Map() })} disabled={activateNeeds.isPending}>
            Limpar
          </Button>
          <Button onClick={handleActivateSelection} disabled={!hasSelection} loading={activateNeeds.isPending} leftIcon="bolt">
            Ativar
          </Button>
        </div>
      </div>

      <DeactivateCapabilityDialog open={Boolean(pendingDeactivateKey)} onOpenChange={(open) => !open && setPendingDeactivateKey(null)} capabilityName={pendingCapabilityLabel} onConfirm={confirmDeactivate} />
    </div>
  );
}
