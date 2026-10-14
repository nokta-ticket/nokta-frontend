"use client";

import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOrganizations } from "@/context/OrganizationContext";
import { useVenueAccess } from "@/context/VenueAccessContext";
import { useUrlTab } from "../../_hooks/use-url-tab";
import { OrganizacaoTab } from "./organizacao-tab";
import { PerfilOperacionalTab } from "./perfil-operacional-tab";
import { VenueTab } from "./venue-tab";
import { UnidadesTab } from "./unidades-tab";
import { OperacaoTab } from "./operacao-tab";
import { ReservasTab } from "./reservas-tab";
import { HorariosTab } from "./horarios-tab";
import { SegurancaTab } from "./seguranca-tab";
import { DadosJuridicosFinanceirosTab } from "./dados-juridicos-financeiros-tab";
import { IaConexoesTab } from "./ia-conexoes-tab";

const TABS = ["organizacao", "perfil", "juridico-financeiro", "venue", "unidades", "operacao", "reservas", "horarios", "ia", "seguranca"] as const;
type TabKey = (typeof TABS)[number];

const TAB_LABEL: Record<TabKey, string> = {
  organizacao: "Organização",
  perfil: "Perfil operacional",
  "juridico-financeiro": "Jurídico e financeiro",
  venue: "Venue",
  unidades: "Unidades",
  operacao: "Operação",
  reservas: "Reservas",
  horarios: "Horários",
  ia: "IA e conexões",
  seguranca: "Segurança",
};

const TITLE = "Configurações";

export function ConfiguracoesSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeader title={TITLE} />
      <Skeleton className="h-10 w-full max-w-2xl rounded-xl" />
      <Skeleton className="h-80 rounded-card" />
    </div>
  );
}

export function ConfiguracoesContent() {
  const { currentOrg, activeModuleKeys, loadingOrgs, loadingModules } = useOrganizations();
  const { can, loading: loadingAccess } = useVenueAccess();
  const [tab, setTab] = useUrlTab<TabKey>(TABS, "organizacao");

  if (loadingOrgs || loadingAccess || loadingModules) return <ConfiguracoesSkeleton />;

  if (!currentOrg) {
    return (
      <div className="space-y-6">
        <PageHeader title={TITLE} />
        <EmptyState icon="building" title="Nenhuma organização selecionada" description="Selecione uma organização para continuar." />
      </div>
    );
  }

  // Tickets ainda não tem RBAC granular própria (ver PlatformAccessResolverService no
  // backend): sem o módulo Venue ativo, `can()` sempre nega (não há venueAccess). Sem
  // esse fallback, organizações só-Tickets nunca acessariam Configurações — inclusive a
  // aba "Perfil operacional", que precisa funcionar para elas. As abas específicas
  // do Venue continuam protegidas por `canManage` (abaixo), que não muda.
  const hasVenueModule = activeModuleKeys.includes("venue");
  const canView = hasVenueModule ? can("organization.settings.view") : true;
  if (!canView) {
    return (
      <div className="space-y-6">
        <PageHeader title={TITLE} />
        <EmptyState icon="lock" title="Sem acesso às configurações" description="O responsável pela organização ainda não liberou o acesso às configurações para o seu papel." />
      </div>
    );
  }

  const canManage = can("organization.settings.manage");

  return (
    <div className="space-y-6">
      <PageHeader title={TITLE} description="Dados e preferências da organização." badge={!canManage ? <StatusBadge tone="neutral">Somente leitura</StatusBadge> : undefined} />

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)} className="gap-6">
        <div className="-mx-4 px-4 lg:mx-0 lg:px-0">
          <TabsList variant="line" aria-label="Seções das configurações">
            {TABS.map((key) => (
              <TabsTrigger key={key} value={key}>
                {TAB_LABEL[key]}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="organizacao">
          <OrganizacaoTab orgId={currentOrg.id} />
        </TabsContent>
        <TabsContent value="perfil">
          <PerfilOperacionalTab orgId={currentOrg.id} />
        </TabsContent>
        <TabsContent value="juridico-financeiro">
          <DadosJuridicosFinanceirosTab orgId={currentOrg.id} canManage={can("organization.legal_profile.manage")} />
        </TabsContent>
        <TabsContent value="venue">
          <VenueTab orgId={currentOrg.id} canManage={canManage} />
        </TabsContent>
        <TabsContent value="unidades">
          <UnidadesTab orgId={currentOrg.id} canManage={canManage} />
        </TabsContent>
        <TabsContent value="operacao">
          <OperacaoTab orgId={currentOrg.id} canManage={canManage} />
        </TabsContent>
        <TabsContent value="reservas">
          <ReservasTab orgId={currentOrg.id} />
        </TabsContent>
        <TabsContent value="horarios">
          <HorariosTab orgId={currentOrg.id} canManage={canManage} />
        </TabsContent>
        <TabsContent value="ia">
          <IaConexoesTab orgId={currentOrg.id} />
        </TabsContent>
        <TabsContent value="seguranca">
          <SegurancaTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
