"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  venueMenuApi,
  type CreateVenueMenuPayload,
  type UpdateVenueMenuPayload,
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
    onSuccess: (_data, vars) => {
      invalidateMenus();
      qc.invalidateQueries({ queryKey: venueKeys.menu(orgId, vars.menuId) });
    },
  });

  const setMain = useMutation({
    mutationFn: (menuId: number) => venueMenuApi.setMainMenu(orgId, menuId),
    onSuccess: invalidateMenus,
  });

  const publish = useMutation({
    mutationFn: (menuId: number) => venueMenuApi.publishMenu(orgId, menuId),
    onSuccess: invalidateMenus,
  });

  const archive = useMutation({
    mutationFn: (menuId: number) => venueMenuApi.archiveMenu(orgId, menuId),
    onSuccess: invalidateMenus,
  });

  return { create, update, setMain, publish, archive };
}
