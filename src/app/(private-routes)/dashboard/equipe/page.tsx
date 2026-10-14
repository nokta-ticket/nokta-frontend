"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOrganizations } from "@/context/OrganizationContext";
import { useVenueAccess } from "@/context/VenueAccessContext";
import { MembersTab } from "./_components/members-tab";
import { InvitationsTab } from "./_components/invitations-tab";
import { InviteMemberDialog } from "./_components/invite-member-dialog";
import { MemberDetailSheet } from "./_components/member-detail-sheet";
import { useVenueTeamInvitations, useVenueTeamMembers } from "./_hooks/use-venue-team";

type TabKey = "membros" | "convites";

const TITLE = "Equipe";

function EquipeSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeader title={TITLE} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-card" />
        ))}
      </div>
      <Skeleton className="h-10 w-64 rounded-xl" />
      <Skeleton className="h-80 rounded-card" />
    </div>
  );
}

export default function EquipePage() {
  const { currentOrg, loadingOrgs } = useOrganizations();
  const { can, loading: loadingAccess } = useVenueAccess();
  const [tab, setTab] = useState<TabKey>("membros");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [detailMemberId, setDetailMemberId] = useState<number | null>(null);

  const orgId = currentOrg?.id ?? null;
  const canView = can("organization.team.view");
  const members = useVenueTeamMembers(canView ? orgId : null);
  const invitations = useVenueTeamInvitations(canView ? orgId : null);

  if (loadingOrgs || loadingAccess) return <EquipeSkeleton />;

  if (!currentOrg) {
    return (
      <div className="space-y-6">
        <PageHeader title={TITLE} />
        <EmptyState icon="building" title="Nenhuma organização selecionada" description="Selecione uma organização para ver a equipe." />
      </div>
    );
  }

  if (!canView) {
    return (
      <div className="space-y-6">
        <PageHeader title={TITLE} />
        <EmptyState icon="lock" title="Sem acesso" description="Você não tem permissão para ver a equipe desta organização." />
      </div>
    );
  }

  const canManage = can("organization.team.manage");
  const activeCount = members.data?.filter((m) => m.status === "ACTIVE").length;
  const suspendedCount = members.data?.filter((m) => m.status === "SUSPENDED").length;
  const pendingInvites = invitations.data?.filter((i) => i.status === "PENDING").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={TITLE}
        description="Quem pode acessar e operar esta organização."
        actions={
          canManage ? (
            <Button onClick={() => setInviteOpen(true)} leftIcon="user-plus">
              Convidar membro
            </Button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Membros ativos" icon="users" value={activeCount} loading={members.isLoading} />
        <StatCard label="Convites pendentes" icon="mail" value={pendingInvites} loading={invitations.isLoading} hint={pendingInvites ? "Aguardando aceite" : undefined} />
        <StatCard label="Suspensos" icon="ban" value={suspendedCount} loading={members.isLoading} />
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
        <TabsList variant="line">
          <TabsTrigger value="membros">Membros</TabsTrigger>
          <TabsTrigger value="convites">Convites</TabsTrigger>
        </TabsList>

        <TabsContent value="membros">
          <MembersTab orgId={currentOrg.id} canManage={canManage} onOpenMember={setDetailMemberId} />
        </TabsContent>
        <TabsContent value="convites">
          <InvitationsTab orgId={currentOrg.id} canManage={canManage} />
        </TabsContent>
      </Tabs>

      <InviteMemberDialog orgId={currentOrg.id} open={inviteOpen} onOpenChange={setInviteOpen} />
      <MemberDetailSheet orgId={currentOrg.id} memberId={detailMemberId} onOpenChange={(v) => !v && setDetailMemberId(null)} />
    </div>
  );
}
