"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  promotersApi,
  type CreateSettlementDraftPayload,
  type SettlementStatus,
  type UpsertAssignmentPayload,
} from "@/services/promoters";

const promoterKeys = {
  list: (orgId: number) => ["promoters", orgId, "list"] as const,
  events: (orgId: number) => ["promoters", orgId, "events"] as const,
  assignments: (orgId: number, eventId?: number) => ["promoters", orgId, "assignments", eventId ?? "all"] as const,
  sales: (orgId: number, eventId?: number, orgPromoterId?: number) =>
    ["promoters", orgId, "sales", eventId ?? "all", orgPromoterId ?? "all"] as const,
  analytics: (orgId: number, eventId?: number) => ["promoters", orgId, "analytics", eventId ?? "all"] as const,
  availableEntries: (orgId: number, promoterProfileId: number) => ["promoters", orgId, "available-entries", promoterProfileId] as const,
  settlements: (orgId: number, promoterProfileId?: number, status?: SettlementStatus) =>
    ["promoters", orgId, "settlements", promoterProfileId ?? "all", status ?? "all"] as const,
};

export function usePromoters(orgId: number | null) {
  return useQuery({
    queryKey: promoterKeys.list(orgId ?? -1),
    queryFn: () => promotersApi.list(orgId as number),
    enabled: orgId !== null,
  });
}

export function usePromoterOrganizationEvents(orgId: number | null) {
  return useQuery({
    queryKey: promoterKeys.events(orgId ?? -1),
    queryFn: () => promotersApi.listOrganizationEvents(orgId as number),
    enabled: orgId !== null,
  });
}

export function usePromoterAssignments(orgId: number | null, eventId?: number) {
  return useQuery({
    queryKey: promoterKeys.assignments(orgId ?? -1, eventId),
    queryFn: () => promotersApi.listAssignments(orgId as number, eventId),
    enabled: orgId !== null,
  });
}

export function usePromoterSales(orgId: number | null, eventId?: number, organizationPromoterId?: number) {
  return useQuery({
    queryKey: promoterKeys.sales(orgId ?? -1, eventId, organizationPromoterId),
    queryFn: () => promotersApi.listSales(orgId as number, { eventId, organizationPromoterId }),
    enabled: orgId !== null,
  });
}

export function usePromoterAnalytics(orgId: number | null, eventId?: number) {
  return useQuery({
    queryKey: promoterKeys.analytics(orgId ?? -1, eventId),
    queryFn: () => promotersApi.getAnalytics(orgId as number, eventId),
    enabled: orgId !== null,
  });
}

export function useAvailableCommissionEntries(orgId: number | null, promoterProfileId: number | null) {
  return useQuery({
    queryKey: promoterKeys.availableEntries(orgId ?? -1, promoterProfileId ?? -1),
    queryFn: () => promotersApi.listAvailableEntries(orgId as number, promoterProfileId as number),
    enabled: orgId !== null && promoterProfileId !== null,
  });
}

export function useSettlements(orgId: number | null, promoterProfileId?: number, status?: SettlementStatus) {
  return useQuery({
    queryKey: promoterKeys.settlements(orgId ?? -1, promoterProfileId, status),
    queryFn: () => promotersApi.listSettlements(orgId as number, { promoterProfileId, status }),
    enabled: orgId !== null,
  });
}

export function usePromoterMutations(orgId: number) {
  const qc = useQueryClient();
  const invalidateList = () => qc.invalidateQueries({ queryKey: promoterKeys.list(orgId) });
  const invalidateAssignments = () => qc.invalidateQueries({ queryKey: ["promoters", orgId, "assignments"] });
  const invalidateSettlements = () => qc.invalidateQueries({ queryKey: ["promoters", orgId, "settlements"] });
  const invalidateAvailableEntries = () => qc.invalidateQueries({ queryKey: ["promoters", orgId, "available-entries"] });

  const invite = useMutation({
    mutationFn: (email: string) => promotersApi.invite(orgId, email),
    onSuccess: invalidateList,
  });

  const resendInvite = useMutation({
    mutationFn: (organizationPromoterId: number) => promotersApi.resendInvite(orgId, organizationPromoterId),
    onSuccess: invalidateList,
  });

  const cancelInvite = useMutation({
    mutationFn: (organizationPromoterId: number) => promotersApi.cancelInvite(orgId, organizationPromoterId),
    onSuccess: invalidateList,
  });

  const suspend = useMutation({
    mutationFn: (organizationPromoterId: number) => promotersApi.suspend(orgId, organizationPromoterId),
    onSuccess: invalidateList,
  });

  const reactivate = useMutation({
    mutationFn: (organizationPromoterId: number) => promotersApi.reactivate(orgId, organizationPromoterId),
    onSuccess: invalidateList,
  });

  const remove = useMutation({
    mutationFn: (organizationPromoterId: number) => promotersApi.remove(orgId, organizationPromoterId),
    onSuccess: invalidateList,
  });

  const createAssignment = useMutation({
    mutationFn: (payload: UpsertAssignmentPayload) => promotersApi.createAssignment(orgId, payload),
    onSuccess: invalidateAssignments,
  });

  const updateAssignment = useMutation({
    mutationFn: ({ assignmentId, payload }: { assignmentId: number; payload: UpsertAssignmentPayload }) =>
      promotersApi.updateAssignment(orgId, assignmentId, payload),
    onSuccess: invalidateAssignments,
  });

  const pauseAssignment = useMutation({
    mutationFn: (assignmentId: number) => promotersApi.pauseAssignment(orgId, assignmentId),
    onSuccess: invalidateAssignments,
  });

  const reactivateAssignment = useMutation({
    mutationFn: (assignmentId: number) => promotersApi.reactivateAssignment(orgId, assignmentId),
    onSuccess: invalidateAssignments,
  });

  const regenerateToken = useMutation({
    mutationFn: (assignmentId: number) => promotersApi.regenerateToken(orgId, assignmentId),
    onSuccess: invalidateAssignments,
  });

  const createSettlementDraft = useMutation({
    mutationFn: (payload: CreateSettlementDraftPayload) => promotersApi.createSettlementDraft(orgId, payload),
    onSuccess: () => {
      invalidateSettlements();
      invalidateAvailableEntries();
    },
  });

  const confirmSettlement = useMutation({
    mutationFn: (settlementId: number) => promotersApi.confirmSettlement(orgId, settlementId),
    onSuccess: invalidateSettlements,
  });

  const markSettlementPaid = useMutation({
    mutationFn: ({ settlementId, notes }: { settlementId: number; notes?: string }) => promotersApi.markSettlementPaid(orgId, settlementId, notes),
    onSuccess: invalidateSettlements,
  });

  const cancelSettlement = useMutation({
    mutationFn: (settlementId: number) => promotersApi.cancelSettlement(orgId, settlementId),
    onSuccess: () => {
      invalidateSettlements();
      invalidateAvailableEntries();
    },
  });

  return {
    invite,
    resendInvite,
    cancelInvite,
    suspend,
    reactivate,
    remove,
    createAssignment,
    updateAssignment,
    pauseAssignment,
    reactivateAssignment,
    regenerateToken,
    createSettlementDraft,
    confirmSettlement,
    markSettlementPaid,
    cancelSettlement,
  };
}
