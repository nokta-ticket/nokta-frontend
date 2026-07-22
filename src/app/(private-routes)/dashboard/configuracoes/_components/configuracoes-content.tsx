"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOrganizations } from "@/context/OrganizationContext";
import { useVenueAccess } from "@/context/VenueAccessContext";
import { PageContainer } from "../../_components/page/page-container";
import { PageHeader } from "../../_components/page/page-header";
import { EmptyState } from "../../_components/states/empty-state";
import { BlockSkeleton } from "../../_components/states/loading-state";
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

const TABS = ["organizacao", "perfil", "juridico-financeiro", "venue", "unidades", "operacao", "reservas", "horarios", "seguranca"] as const;
type TabKey = (typeof TABS)[number];

const TAB_LABEL: Record<TabKey, string> = {
  organizacao: "Organização",
  perfil: "Perfil operacional",
  "juridico-financeiro": "Dados jurídicos e financeiros",
  venue: "Venue",
  unidades: "Unidades",
  operacao: "Operação",
  reservas: "Reservas",
  horarios: "Horários",
  seguranca: "Segurança e acesso",
};

export function ConfiguracoesContent() {
  const { currentOrg, activeModuleKeys, loadingOrgs, loadingModules } = useOrganizations();
  const { can, loading: loadingAccess } = useVenueAccess();
  const [tab, setTab] = useUrlTab<TabKey>(TABS, "organizacao");

  if (loadingOrgs || loadingAccess || loadingModules) {
    return (
      <PageContainer>
        <PageHeader title="Configurações" description="Dados e preferências da organização." />
        <BlockSkeleton className="h-96" />
      </PageContainer>
    );
  }

  if (!currentOrg) {
    return (
      <PageContainer>
        <PageHeader title="Configurações" description="Dados e preferências da organização." />
        <EmptyState title="Nenhuma organização selecionada" description="Selecione uma organização para continuar." />
      </PageContainer>
    );
  }

  // Tickets ainda não tem RBAC granular própria (ver PlatformAccessResolverService no
  // backend): sem o módulo Venue ativo, `can()` sempre nega (não há venueAccess). Sem
  // esse fallback, organizações só-Tickets nunca acessariam Configurações — inclusive a
  // nova aba "Perfil operacional", que precisa funcionar para elas. As abas específicas
  // do Venue continuam protegidas por `canManage` (abaixo), que não muda.
  const hasVenueModule = activeModuleKeys.includes("venue");
  const canView = hasVenueModule ? can("organization.settings.view") : true;
  if (!canView) {
    return (
      <PageContainer>
        <PageHeader title="Configurações" description="Dados e preferências da organização." />
        <EmptyState
          title="Sem acesso às configurações"
          description="O responsável pela organização ainda não liberou o acesso às configurações para o seu papel."
        />
      </PageContainer>
    );
  }

  const canManage = can("organization.settings.manage");

  return (
    <PageContainer>
      <PageHeader
        title="Configurações"
        description={canManage ? "Dados e preferências da organização." : "Dados e preferências da organização (somente leitura)."}
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <TabsList className="w-max min-w-full sm:w-fit">
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
        <TabsContent value="seguranca">
          <SegurancaTab />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
