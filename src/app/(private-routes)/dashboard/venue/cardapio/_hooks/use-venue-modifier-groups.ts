"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  venueMenuApi,
  type CreateVenueModifierGroupPayload,
  type CreateVenueModifierOptionPayload,
  type ReorderPayload,
  type UpdateVenueModifierGroupPayload,
  type UpdateVenueModifierOptionPayload,
} from "@/services/venue-menu";
import { venueKeys } from "./query-keys";

export function useVenueModifierGroups(orgId: number | null) {
  return useQuery({
    queryKey: venueKeys.modifierGroups(orgId ?? -1),
    queryFn: () => venueMenuApi.listModifierGroups(orgId as number),
    enabled: orgId !== null,
  });
}

export function useVenueModifierGroup(orgId: number | null, groupId: number | null) {
  return useQuery({
    queryKey: venueKeys.modifierGroup(orgId ?? -1, groupId ?? -1),
    queryFn: () => venueMenuApi.getModifierGroup(orgId as number, groupId as number),
    enabled: orgId !== null && groupId !== null,
  });
}

export function useVenueModifierGroupMutations(orgId: number) {
  const qc = useQueryClient();
  const invalidateGroups = () => qc.invalidateQueries({ queryKey: venueKeys.modifierGroups(orgId) });
  const invalidateGroup = (groupId: number) =>
    qc.invalidateQueries({ queryKey: venueKeys.modifierGroup(orgId, groupId) });

  const create = useMutation({
    mutationFn: (payload: CreateVenueModifierGroupPayload) =>
      venueMenuApi.createModifierGroup(orgId, payload),
    onSuccess: invalidateGroups,
  });

  const update = useMutation({
    mutationFn: ({
      groupId,
      payload,
    }: {
      groupId: number;
      payload: UpdateVenueModifierGroupPayload;
    }) => venueMenuApi.updateModifierGroup(orgId, groupId, payload),
    onSuccess: (_data, vars) => {
      invalidateGroups();
      invalidateGroup(vars.groupId);
    },
  });

  const setActive = useMutation({
    mutationFn: ({ groupId, active }: { groupId: number; active: boolean }) =>
      venueMenuApi.setModifierGroupActive(orgId, groupId, active),
    onSuccess: (_data, vars) => {
      invalidateGroups();
      invalidateGroup(vars.groupId);
    },
  });

  const reorder = useMutation({
    mutationFn: (payload: ReorderPayload) => venueMenuApi.reorderModifierGroups(orgId, payload),
    onSuccess: invalidateGroups,
  });

  return { create, update, setActive, reorder };
}

export function useVenueModifierOptionMutations(orgId: number, groupId: number) {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: venueKeys.modifierGroup(orgId, groupId) });
    qc.invalidateQueries({ queryKey: venueKeys.modifierOptions(orgId, groupId) });
  };

  const create = useMutation({
    mutationFn: (payload: CreateVenueModifierOptionPayload) =>
      venueMenuApi.createModifierOption(orgId, groupId, payload),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({
      optionId,
      payload,
    }: {
      optionId: number;
      payload: UpdateVenueModifierOptionPayload;
    }) => venueMenuApi.updateModifierOption(orgId, optionId, payload),
    onSuccess: invalidate,
  });

  const archive = useMutation({
    mutationFn: (optionId: number) => venueMenuApi.archiveModifierOption(orgId, optionId),
    onSuccess: invalidate,
  });

  const setActive = useMutation({
    mutationFn: ({ optionId, active }: { optionId: number; active: boolean }) =>
      venueMenuApi.setModifierOptionActive(orgId, optionId, active),
    onSuccess: invalidate,
  });

  const reorder = useMutation({
    mutationFn: (payload: ReorderPayload) => venueMenuApi.reorderModifierOptions(orgId, groupId, payload),
    onSuccess: invalidate,
  });

  return { create, update, archive, setActive, reorder };
}
