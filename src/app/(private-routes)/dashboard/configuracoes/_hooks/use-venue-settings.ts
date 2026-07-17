"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  venueSettingsApi,
  type UpdateVenueOperationSettingsPayload,
  type VenueBusinessHourInterval,
} from "@/services/venue-settings";
import { venueSetupApi, type SaveVenueSetupProfilePayload } from "@/services/venue-setup";

const settingsKeys = {
  organization: (orgId: number) => ["settings", orgId, "organization"] as const,
  operation: (orgId: number) => ["settings", orgId, "operation"] as const,
  businessHours: (orgId: number, locationId: number) => ["settings", orgId, "business-hours", locationId] as const,
  setupStatus: (orgId: number) => ["settings", orgId, "setup-status"] as const,
};

export function useVenueOrganizationDetails(orgId: number | null) {
  return useQuery({
    queryKey: settingsKeys.organization(orgId ?? -1),
    queryFn: () => venueSettingsApi.getOrganization(orgId as number),
    enabled: orgId !== null,
  });
}

export function useVenueOperationSettings(orgId: number | null) {
  return useQuery({
    queryKey: settingsKeys.operation(orgId ?? -1),
    queryFn: () => venueSettingsApi.getOperationSettings(orgId as number),
    enabled: orgId !== null,
  });
}

export function useUpdateVenueOperationSettings(orgId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateVenueOperationSettingsPayload) => venueSettingsApi.updateOperationSettings(orgId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: settingsKeys.operation(orgId) }),
  });
}

export function useVenueBusinessHours(orgId: number | null, locationId: number | null) {
  return useQuery({
    queryKey: settingsKeys.businessHours(orgId ?? -1, locationId ?? -1),
    queryFn: () => venueSettingsApi.getBusinessHours(orgId as number, locationId as number),
    enabled: orgId !== null && locationId !== null,
  });
}

export function useSetVenueBusinessHours(orgId: number, locationId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (intervals: VenueBusinessHourInterval[]) => venueSettingsApi.setBusinessHours(orgId, locationId, intervals),
    onSuccess: () => qc.invalidateQueries({ queryKey: settingsKeys.businessHours(orgId, locationId) }),
  });
}

export function useVenueSetupStatus(orgId: number | null) {
  return useQuery({
    queryKey: settingsKeys.setupStatus(orgId ?? -1),
    queryFn: () => venueSetupApi.getStatus(orgId as number),
    enabled: orgId !== null,
  });
}

export function useSaveVenueSetupProfile(orgId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: SaveVenueSetupProfilePayload) => venueSetupApi.saveProfile(orgId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: settingsKeys.setupStatus(orgId) }),
  });
}

export function useVenueSetupLifecycle(orgId: number) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: settingsKeys.setupStatus(orgId) });
  const dismiss = useMutation({ mutationFn: () => venueSetupApi.dismiss(orgId), onSuccess: invalidate });
  const complete = useMutation({ mutationFn: () => venueSetupApi.complete(orgId), onSuccess: invalidate });
  const markWelcomeSeen = useMutation({ mutationFn: () => venueSetupApi.markWelcomeSeen(orgId), onSuccess: invalidate });
  return { dismiss, complete, markWelcomeSeen };
}
