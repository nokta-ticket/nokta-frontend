"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { venueTeamApi, type CreateInvitationPayload, type SetMemberPermissionsPayload, type VenueRoleKey } from "@/services/venue-team";

const teamKeys = {
  members: (orgId: number) => ["team", orgId, "members"] as const,
  member: (orgId: number, memberId: number) => ["team", orgId, "member", memberId] as const,
  invitations: (orgId: number) => ["team", orgId, "invitations"] as const,
  roles: (orgId: number) => ["team", orgId, "roles"] as const,
  permissions: (orgId: number) => ["team", orgId, "permissions"] as const,
};

export function useVenueTeamMembers(orgId: number | null) {
  return useQuery({
    queryKey: teamKeys.members(orgId ?? -1),
    queryFn: () => venueTeamApi.listMembers(orgId as number),
    enabled: orgId !== null,
  });
}

export function useVenueTeamMember(orgId: number | null, memberId: number | null) {
  return useQuery({
    queryKey: teamKeys.member(orgId ?? -1, memberId ?? -1),
    queryFn: () => venueTeamApi.getMember(orgId as number, memberId as number),
    enabled: orgId !== null && memberId !== null,
  });
}

export function useVenueTeamInvitations(orgId: number | null) {
  return useQuery({
    queryKey: teamKeys.invitations(orgId ?? -1),
    queryFn: () => venueTeamApi.listInvitations(orgId as number),
    enabled: orgId !== null,
  });
}

export function useVenueRolesCatalog(orgId: number | null) {
  return useQuery({
    queryKey: teamKeys.roles(orgId ?? -1),
    queryFn: () => venueTeamApi.getRoles(orgId as number),
    enabled: orgId !== null,
    staleTime: Infinity,
  });
}

export function useVenuePermissionsCatalog(orgId: number | null) {
  return useQuery({
    queryKey: teamKeys.permissions(orgId ?? -1),
    queryFn: () => venueTeamApi.getPermissions(orgId as number),
    enabled: orgId !== null,
    staleTime: Infinity,
  });
}

export function useVenueTeamMutations(orgId: number) {
  const qc = useQueryClient();
  const invalidateMembers = () => qc.invalidateQueries({ queryKey: teamKeys.members(orgId) });
  const invalidateMember = (memberId: number) => qc.invalidateQueries({ queryKey: teamKeys.member(orgId, memberId) });
  const invalidateInvitations = () => qc.invalidateQueries({ queryKey: teamKeys.invitations(orgId) });

  const updateStatus = useMutation({
    mutationFn: ({ memberId, status }: { memberId: number; status: "ACTIVE" | "SUSPENDED" | "REMOVED" }) =>
      venueTeamApi.updateMemberStatus(orgId, memberId, status),
    onSuccess: (_data, vars) => {
      invalidateMembers();
      invalidateMember(vars.memberId);
    },
  });

  const updateRole = useMutation({
    mutationFn: ({ memberId, roleKey }: { memberId: number; roleKey: VenueRoleKey }) => venueTeamApi.updateMemberRole(orgId, memberId, roleKey),
    onSuccess: (_data, vars) => {
      invalidateMembers();
      invalidateMember(vars.memberId);
    },
  });

  const setPermissions = useMutation({
    mutationFn: ({ memberId, payload }: { memberId: number; payload: SetMemberPermissionsPayload }) =>
      venueTeamApi.setMemberPermissions(orgId, memberId, payload),
    onSuccess: (_data, vars) => invalidateMember(vars.memberId),
  });

  const assignStations = useMutation({
    mutationFn: ({ memberId, stationIds }: { memberId: number; stationIds: number[] }) =>
      venueTeamApi.assignPreparationStations(orgId, memberId, stationIds),
    onSuccess: (_data, vars) => invalidateMember(vars.memberId),
  });

  const removeMember = useMutation({
    mutationFn: (memberId: number) => venueTeamApi.removeMember(orgId, memberId),
    onSuccess: invalidateMembers,
  });

  const createInvitation = useMutation({
    mutationFn: (payload: CreateInvitationPayload) => venueTeamApi.createInvitation(orgId, payload),
    onSuccess: invalidateInvitations,
  });

  const resendInvitation = useMutation({
    mutationFn: (invitationId: number) => venueTeamApi.resendInvitation(orgId, invitationId),
    onSuccess: invalidateInvitations,
  });

  const revokeInvitation = useMutation({
    mutationFn: (invitationId: number) => venueTeamApi.revokeInvitation(orgId, invitationId),
    onSuccess: invalidateInvitations,
  });

  return { updateStatus, updateRole, setPermissions, assignStations, removeMember, createInvitation, resendInvitation, revokeInvitation };
}
