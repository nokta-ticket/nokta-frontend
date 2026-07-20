"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { platformApi, type SaveBusinessProfilePayload } from "@/services/platform";

const platformKeys = {
  businessProfile: (orgId: number) => ["platform", orgId, "business-profile"] as const,
  capabilities: (orgId: number) => ["platform", orgId, "capabilities"] as const,
  explore: (orgId: number) => ["platform", orgId, "explore"] as const,
  recommendations: (orgId: number) => ["platform", orgId, "recommendations"] as const,
  navigation: (orgId: number) => ["platform", orgId, "navigation"] as const,
  home: (orgId: number) => ["platform", orgId, "home"] as const,
  meContexts: () => ["platform", "me-contexts"] as const,
};

export function useBusinessProfile(orgId: number | null) {
  return useQuery({
    queryKey: platformKeys.businessProfile(orgId ?? -1),
    queryFn: () => platformApi.getBusinessProfile(orgId as number),
    enabled: orgId !== null,
  });
}

/**
 * Salvar o perfil pode mudar as recomendações (ver RecommendationService no
 * backend) — invalida perfil + recomendações + Explore juntos. Não invalida
 * capacidades/navegação: salvar o perfil nunca ativa/desativa nada sozinho.
 */
export function useSaveBusinessProfile(orgId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: SaveBusinessProfilePayload) => platformApi.saveBusinessProfile(orgId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: platformKeys.businessProfile(orgId) });
      qc.invalidateQueries({ queryKey: platformKeys.recommendations(orgId) });
      qc.invalidateQueries({ queryKey: platformKeys.explore(orgId) });
    },
  });
}

export function useCapabilities(orgId: number | null) {
  return useQuery({
    queryKey: platformKeys.capabilities(orgId ?? -1),
    queryFn: () => platformApi.getCapabilities(orgId as number),
    enabled: orgId !== null,
  });
}

/** Ativar/desativar muda capacidades, Explore, recomendações e navegação — invalida os quatro. */
function invalidateAfterCapabilityChange(qc: ReturnType<typeof useQueryClient>, orgId: number) {
  qc.invalidateQueries({ queryKey: platformKeys.capabilities(orgId) });
  qc.invalidateQueries({ queryKey: platformKeys.explore(orgId) });
  qc.invalidateQueries({ queryKey: platformKeys.recommendations(orgId) });
  qc.invalidateQueries({ queryKey: platformKeys.navigation(orgId) });
  qc.invalidateQueries({ queryKey: platformKeys.home(orgId) });
}

export function useActivateCapability(orgId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (key: string) => platformApi.activateCapability(orgId, key),
    onSuccess: () => invalidateAfterCapabilityChange(qc, orgId),
  });
}

export function useDeactivateCapability(orgId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (key: string) => platformApi.deactivateCapability(orgId, key),
    onSuccess: () => invalidateAfterCapabilityChange(qc, orgId),
  });
}

export function useExplore(orgId: number | null) {
  return useQuery({
    queryKey: platformKeys.explore(orgId ?? -1),
    queryFn: () => platformApi.getExplore(orgId as number),
    enabled: orgId !== null,
  });
}

export function useRecommendations(orgId: number | null) {
  return useQuery({
    queryKey: platformKeys.recommendations(orgId ?? -1),
    queryFn: () => platformApi.getRecommendations(orgId as number),
    enabled: orgId !== null,
  });
}

export function useDismissRecommendation(orgId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (key: string) => platformApi.dismissRecommendation(orgId, key),
    onSuccess: () => qc.invalidateQueries({ queryKey: platformKeys.recommendations(orgId) }),
  });
}

export function usePlatformNavigation(orgId: number | null) {
  return useQuery({
    queryKey: platformKeys.navigation(orgId ?? -1),
    queryFn: () => platformApi.getNavigation(orgId as number),
    enabled: orgId !== null,
  });
}

export function usePlatformHome(orgId: number | null) {
  return useQuery({
    queryKey: platformKeys.home(orgId ?? -1),
    queryFn: () => platformApi.getHome(orgId as number),
    enabled: orgId !== null,
  });
}

export function useMeContexts() {
  return useQuery({
    queryKey: platformKeys.meContexts(),
    queryFn: () => platformApi.getMeContexts(),
  });
}
