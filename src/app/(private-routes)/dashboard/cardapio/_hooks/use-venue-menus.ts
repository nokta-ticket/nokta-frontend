"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  venueMenuApi,
  type CreateVenueMenuPayload,
  type UpdateVenueMenuPayload,
  type VenueMenu,
} from "@/services/venue-menu";
import { venueKeys } from "./query-keys";

export function useVenueMenus(orgId: number | null) {
  return useQuery({
    queryKey: venueKeys.menus(orgId ?? -1),
    queryFn: () => venueMenuApi.listMenus(orgId as number),
    enabled: orgId !== null,
  });
}

export function useVenueMenu(orgId: number | null, menuId: number | null) {
  return useQuery({
    queryKey: venueKeys.menu(orgId ?? -1, menuId ?? -1),
    queryFn: () => venueMenuApi.getMenu(orgId as number, menuId as number),
    enabled: orgId !== null && menuId !== null,
  });
}

/**
 * Preview real do cardápio — mesmo componente/dados da página pública,
 * mas sem exigir publicação. Invalidada por qualquer mutation que mude o
 * que aparece nele (produtos, categorias, adicionais, publish) — ver
 * use-venue-products.ts/use-venue-categories.ts.
 */
export function useVenueMenuPreview(orgId: number | null, menuId: number | null) {
  return useQuery({
    queryKey: venueKeys.menuPreview(orgId ?? -1, menuId ?? -1),
    queryFn: () => venueMenuApi.getMenuPreview(orgId as number, menuId as number),
    enabled: orgId !== null && menuId !== null,
  });
}

/**
 * Chamado uma vez por acesso à tela de Cardápio (não só quando a
 * organização não tem nenhum cardápio) — idempotente no backend, garante
 * cardápio principal + categoria "Geral" + estações padrão, criando só o
 * que faltar. Invalida menus/estações pra refletir o que foi criado.
 */
export function useEnsureDefaultMenu(orgId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => venueMenuApi.ensureDefaultMenu(orgId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: venueKeys.menus(orgId) });
      qc.invalidateQueries({ queryKey: venueKeys.stations(orgId) });
    },
  });
}

export function useVenueMenuMutations(orgId: number) {
  const qc = useQueryClient();
  const invalidateMenus = () => qc.invalidateQueries({ queryKey: venueKeys.menus(orgId) });

  const create = useMutation({
    mutationFn: (payload: CreateVenueMenuPayload) => venueMenuApi.createMenu(orgId, payload),
    onSuccess: invalidateMenus,
  });

  const update = useMutation({
    mutationFn: ({ menuId, payload }: { menuId: number; payload: UpdateVenueMenuPayload }) =>
      venueMenuApi.updateMenu(orgId, menuId, payload),
    // Optimistic update: sem isso, o campo (nome/descrição) só reflete a
    // mudança depois que invalidateQueries refaz o GET /menus pela rede —
    // nesse intervalo o valor exibido volta pro antigo (prop vinda do
    // cache stale) e "pisca" de volta pro novo quando a resposta chega.
    onMutate: async ({ menuId, payload }) => {
      await qc.cancelQueries({ queryKey: venueKeys.menus(orgId) });
      const previousMenus = qc.getQueryData<VenueMenu[]>(venueKeys.menus(orgId));
      if (previousMenus) {
        qc.setQueryData<VenueMenu[]>(
          venueKeys.menus(orgId),
          previousMenus.map((m) => (m.id === menuId ? { ...m, ...payload } : m)),
        );
      }
      return { previousMenus };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousMenus) {
        qc.setQueryData(venueKeys.menus(orgId), context.previousMenus);
      }
    },
    onSuccess: (_data, vars) => {
      invalidateMenus();
      qc.invalidateQueries({ queryKey: venueKeys.menu(orgId, vars.menuId) });
      qc.invalidateQueries({ queryKey: venueKeys.menuPreview(orgId, vars.menuId) });
    },
  });

  const setMain = useMutation({
    mutationFn: (menuId: number) => venueMenuApi.setMainMenu(orgId, menuId),
    onSuccess: invalidateMenus,
  });

  const publish = useMutation({
    mutationFn: (menuId: number) => venueMenuApi.publishMenu(orgId, menuId),
    onSuccess: (_data, menuId) => {
      invalidateMenus();
      qc.invalidateQueries({ queryKey: venueKeys.menuPreview(orgId, menuId) });
    },
  });

  const archive = useMutation({
    mutationFn: (menuId: number) => venueMenuApi.archiveMenu(orgId, menuId),
    onSuccess: invalidateMenus,
  });

  return { create, update, setMain, publish, archive };
}
