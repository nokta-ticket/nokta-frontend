"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOrganizations } from "@/context/OrganizationContext";
import { useTicketsAccess } from "@/context/TicketsAccessContext";
import { PageContainer } from "../_components/page/page-container";
import { PageHeader } from "../_components/page/page-header";
import { EmptyState } from "../_components/states/empty-state";
import { BlockSkeleton } from "../_components/states/loading-state";
import { PromotersTab } from "./_components/promoters-tab";
import { InvitePromoterDialog } from "./_components/invite-promoter-dialog";
import { AssignmentsTab } from "./_components/assignments-tab";
import { SalesAnalyticsTab } from "./_components/sales-analytics-tab";
import { SettlementsTab } from "./_components/settlements-tab";

type TabKey = "promoters" | "atribuicoes" | "vendas" | "acertos";

export default function PromotoresPage() {
  const { currentOrg, loadingOrgs } = useOrganizations();
  const { can, loading: loadingAccess } = useTicketsAccess();
  const [tab, setTab] = useState<TabKey>("promoters");
  const [inviteOpen, setInviteOpen] = useState(false);

  if (loadingOrgs || loadingAccess) {
    return (
      <PageContainer>
        <PageHeader title="Promoters" description="Gerencie promoters, links, códigos, comissões e acertos." />
        <BlockSkeleton className="h-96" />
      </PageContainer>
    );
  }

  if (!currentOrg) {
    return (
      <PageContainer>
        <PageHeader title="Promoters" description="Gerencie promoters, links, códigos, comissões e acertos." />
        <EmptyState title="Nenhuma organização selecionada" description="Selecione uma organização para ver os promoters." />
      </PageContainer>
    );
  }

  if (!can("tickets.promoters.view")) {
    return (
      <PageContainer>
        <PageHeader title="Promoters" description="Gerencie promoters, links, códigos, comissões e acertos." />
        <EmptyState title="Sem acesso" description="Você não tem permissão para ver os promoters desta organização." />
      </PageContainer>
    );
  }

  const canManage = can("tickets.promoters.manage");

  return (
    <PageContainer>
      <PageHeader
        title="Promoters"
        description="Gerencie promoters, links, códigos, comissões e acertos."
        actions={
          canManage ? (
            <Button onClick={() => setInviteOpen(true)}>
              <UserPlus size={16} /> Convidar promoter
            </Button>
          ) : undefined
        }
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
        <TabsList>
          <TabsTrigger value="promoters">Promoters</TabsTrigger>
          <TabsTrigger value="atribuicoes">Atribuições por evento</TabsTrigger>
          <TabsTrigger value="vendas">Vendas e analytics</TabsTrigger>
          <TabsTrigger value="acertos">Acertos</TabsTrigger>
        </TabsList>

        <TabsContent value="promoters">
          <PromotersTab orgId={currentOrg.id} canManage={canManage} />
        </TabsContent>
        <TabsContent value="atribuicoes">
          <AssignmentsTab orgId={currentOrg.id} canManage={can("tickets.promoters.assignments.manage")} />
        </TabsContent>
        <TabsContent value="vendas">
          <SalesAnalyticsTab orgId={currentOrg.id} canExport={can("tickets.promoters.export")} />
        </TabsContent>
        <TabsContent value="acertos">
          <SettlementsTab orgId={currentOrg.id} canManageSettlements={can("tickets.promoters.settlements.manage")} />
        </TabsContent>
      </Tabs>

      <InvitePromoterDialog orgId={currentOrg.id} open={inviteOpen} onOpenChange={setInviteOpen} />
    </PageContainer>
  );
}
