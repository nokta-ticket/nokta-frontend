"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useOrganizations } from "@/context/OrganizationContext";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { crmApi, crmKeys, type CrmFilters } from "@/services/crm";
import { crmMarketingApi, crmMarketingKeys } from "@/services/crm-marketing";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRequireWorkspace } from "../_components/require-workspace-provider";
import { useUrlTab } from "../_hooks/use-url-tab";
import { AudiencesTab } from "./_components/audiences-tab";
import { ContactsTab } from "./_components/contacts-tab";
import { CRM_TABS as TABS, IMPORTED_FILTER as IMPORTED, useCrmPermissions, type CrmTabKey } from "./_components/crm-ui";
import { ImportsTab } from "./_components/imports-tab";
import { CampaignsTab } from "./_components/campaigns-tab";
import { ChannelsTab } from "./_components/channels-tab";
import { TemplatesTab } from "./_components/templates-tab";

const TAB_LABEL: Record<CrmTabKey, string> = { contacts: "Contatos", audiences: "Públicos", campaigns: "Campanhas", templates: "Modelos", channels: "Canais" };

/**
 * CRM: a lista de quem compra do produtor, os públicos que ele recorta,
 * as campanhas que ele manda e os canais por onde elas saem.
 */
export default function CrmPage() {
  const { currentOrg, activeModuleKeys, loadingOrgs, loadingModules } = useOrganizations();
  const { guard } = useRequireWorkspace();
  const orgId = currentOrg?.id ?? null;

  const [tab, setTab] = useUrlTab<CrmTabKey>(TABS, "contacts");
  // Importações são parte de Contatos: a lista dá lugar à importação e volta.
  const [importing, setImporting] = useState(false);
  const [filters, setFilters] = useState<CrmFilters>({});
  const [exporting, setExporting] = useState(false);
  const perms = useCrmPermissions();

  useEffect(() => {
    setFilters({});
    setImporting(false);
  }, [orgId]);

  const enabled = orgId !== null && activeModuleKeys.includes("tickets");
  const overview = useQuery({ queryKey: crmKeys.overview(orgId ?? -1), queryFn: () => crmApi.overview(orgId as number), enabled });
  const imported = useQuery({
    queryKey: crmKeys.contacts(orgId ?? -1, { count: "imported" }),
    queryFn: () => crmApi.listContacts(orgId as number, IMPORTED, { page: 1, perPage: 1, sort: "created", dir: "desc" }),
    enabled,
  });
  const options = useQuery({ queryKey: crmKeys.options(orgId ?? -1), queryFn: () => crmApi.filterOptions(orgId as number), enabled, staleTime: 5 * 60_000 });
  const segments = useQuery({ queryKey: crmKeys.segments(orgId ?? -1), queryFn: () => crmApi.listSegments(orgId as number), enabled });
  const channels = useQuery({ queryKey: crmMarketingKeys.channels(orgId ?? -1), queryFn: () => crmMarketingApi.channels(orgId as number), enabled });

  if (loadingOrgs || loadingModules) {
    return (
      <div className="space-y-6">
        <PageHeader title="CRM" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-28 rounded-card" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-card" />
      </div>
    );
  }
  if (!currentOrg || orgId === null) {
    return (
      <div className="space-y-6">
        <PageHeader title="CRM" />
        <EmptyState icon="users" title="Nada por aqui ainda" description="Crie seu workspace para ver quem compra de você." action={<Button onClick={() => guard(() => undefined)}>Criar workspace</Button>} />
      </div>
    );
  }
  if (!enabled) {
    return (
      <div className="space-y-6">
        <PageHeader title="CRM" />
        <EmptyState icon="users" title="O CRM ainda não está ativo" description="Ative Eventos e ingressos em Explore a Nokta para ver quem compra de você." />
      </div>
    );
  }
  const forbidden = (overview.error as { response?: { status?: number } } | null)?.response?.status === 403;
  if (forbidden) {
    return (
      <div className="space-y-6">
        <PageHeader title="CRM" />
        <EmptyState icon="lock" title="Sem acesso aos clientes" description="Só o proprietário ou um gerente do workspace vê a lista de clientes." />
      </div>
    );
  }

  function applyFilters(next: CrmFilters) {
    setFilters(next);
    setImporting(false);
    setTab("contacts");
  }
  function goTo(next: CrmTabKey) {
    setImporting(false);
    setTab(next);
  }

  async function exportCsv() {
    setExporting(true);
    try {
      const blob = await crmApi.exportContacts(orgId as number, filters);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "contatos.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(getErrorMessage(error, "Não foi possível exportar os contatos."));
    } finally {
      setExporting(false);
    }
  }

  const ov = overview.data;
  const showOverview = tab === "contacts" || tab === "audiences";

  return (
    <div className="space-y-6">
      <PageHeader
        title="CRM"
        actions={
          tab === "contacts" && !importing ? (
            <>
              {perms.exportData ? (
                <Button variant="outline" leftIcon="download" loading={exporting} onClick={() => void exportCsv()}>
                  Exportar
                </Button>
              ) : null}
              {perms.manage ? (
                <Button leftIcon="upload" onClick={() => setImporting(true)}>
                  Importar
                </Button>
              ) : null}
            </>
          ) : undefined
        }
      />

      {showOverview ? (
        overview.isError ? (
          <ErrorState title="Não foi possível carregar seus clientes agora" onRetry={() => void overview.refetch()} />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
            <StatCard label="Sua lista" icon="users" value={ov?.total} loading={!ov} hint={ov ? `${ov.emailEligible.toLocaleString("pt-BR")} podem receber e-mail · ${ov.whatsappEligible.toLocaleString("pt-BR")} WhatsApp · ${ov.pushEligible.toLocaleString("pt-BR")} notificação` : undefined} />
            <StatCard label="Recorrentes" icon="repeat" value={ov?.recurring} loading={!ov} hint="Compraram duas vezes ou mais" />
            <StatCard label="Sumidos" icon="history" value={ov?.inactive90Days} loading={!ov} hint="Sem comprar há 90 dias ou mais" />
          </div>
        )
      ) : null}

      <Tabs value={tab} onValueChange={(v) => goTo(v as CrmTabKey)} className="-mx-4 px-4 lg:mx-0 lg:px-0">
        <TabsList variant="line" aria-label="Seções do CRM">
          {TABS.map((k) => (
            <TabsTrigger key={k} value={k}>
              {TAB_LABEL[k]}
              {k === "audiences" && segments.data?.length ? <span className="text-caption font-medium text-subtle-foreground tnum">{segments.data.length}</span> : null}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div key={`${tab}-${importing}`} className="route-enter">
        {tab === "contacts" && !importing && <ContactsTab orgId={orgId} filters={filters} onFilters={setFilters} options={options.data} segments={segments.data ?? []} importedTotal={imported.data?.total ?? null} overview={ov} onGoTo={goTo} perms={perms} />}
        {tab === "contacts" && importing && perms.manage && (
          <div className="space-y-4">
            <Button variant="subtle" leftIcon="arrow-left" onClick={() => setImporting(false)} className="-ml-2">
              Voltar pra lista
            </Button>
            <ImportsTab orgId={orgId} onDone={() => applyFilters(IMPORTED)} />
          </div>
        )}
        {tab === "audiences" && <AudiencesTab orgId={orgId} segments={segments.data} loading={segments.isLoading} options={options.data} onOpen={applyFilters} onNew={() => applyFilters({})} canManage={perms.manage} />}
        {tab === "campaigns" && <CampaignsTab orgId={orgId} segments={segments.data ?? []} options={options.data} onGoTo={goTo} canManage={perms.campaigns} />}
        {tab === "templates" && <TemplatesTab orgId={orgId} whatsappConnected={channels.data?.whatsapp.account?.status === "CONNECTED"} canManage={perms.campaigns} />}
        {tab === "channels" && <ChannelsTab orgId={orgId} canManage={perms.channels} />}
      </div>
    </div>
  );
}
