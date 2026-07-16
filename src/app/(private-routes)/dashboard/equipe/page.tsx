"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOrganizations } from "@/context/OrganizationContext";
import { useVenueAccess } from "@/context/VenueAccessContext";
import { PageContainer } from "../_components/page/page-container";
import { PageHeader } from "../_components/page/page-header";
import { EmptyState } from "../_components/states/empty-state";
import { BlockSkeleton } from "../_components/states/loading-state";
import { MembersTab } from "./_components/members-tab";
import { InvitationsTab } from "./_components/invitations-tab";
import { InviteMemberDialog } from "./_components/invite-member-dialog";
import { MemberDetailSheet } from "./_components/member-detail-sheet";

type TabKey = "membros" | "convites";

export default function EquipePage() {
  const { currentOrg, loadingOrgs } = useOrganizations();
  const { can, loading: loadingAccess } = useVenueAccess();
  const [tab, setTab] = useState<TabKey>("membros");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [detailMemberId, setDetailMemberId] = useState<number | null>(null);

  if (loadingOrgs || loadingAccess) {
    return (
      <PageContainer>
        <PageHeader title="Equipe" description="Gerencie quem pode acessar e operar esta organização." />
        <BlockSkeleton className="h-96" />
      </PageContainer>
    );
  }

  if (!currentOrg) {
    return (
      <PageContainer>
        <PageHeader title="Equipe" description="Gerencie quem pode acessar e operar esta organização." />
        <EmptyState title="Nenhuma organização selecionada" description="Selecione uma organização para ver a equipe." />
      </PageContainer>
    );
  }

  if (!can("organization.team.view")) {
    return (
      <PageContainer>
        <PageHeader title="Equipe" description="Gerencie quem pode acessar e operar esta organização." />
        <EmptyState title="Sem acesso" description="Você não tem permissão para ver a equipe desta organização." />
      </PageContainer>
    );
  }

  const canManage = can("organization.team.manage");

  return (
    <PageContainer>
      <PageHeader
        title="Equipe"
        description="Gerencie quem pode acessar e operar esta organização."
        actions={
          canManage ? (
            <Button onClick={() => setInviteOpen(true)}>
              <UserPlus size={16} /> Convidar membro
            </Button>
          ) : undefined
        }
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
        <TabsList>
          <TabsTrigger value="membros">Membros</TabsTrigger>
          <TabsTrigger value="convites">Convites pendentes</TabsTrigger>
        </TabsList>

        <TabsContent value="membros">
          <MembersTab orgId={currentOrg.id} onOpenMember={setDetailMemberId} />
        </TabsContent>
        <TabsContent value="convites">
          <InvitationsTab orgId={currentOrg.id} />
        </TabsContent>
      </Tabs>

      <InviteMemberDialog orgId={currentOrg.id} open={inviteOpen} onOpenChange={setInviteOpen} />
      <MemberDetailSheet orgId={currentOrg.id} memberId={detailMemberId} onOpenChange={(v) => !v && setDetailMemberId(null)} />
    </PageContainer>
  );
}
