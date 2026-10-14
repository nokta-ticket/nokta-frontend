"use client";

import { useQuery } from "@tanstack/react-query";
import { venueMenuApi } from "@/services/venue-menu";

/**
 * Catálogo usado pelo lançamento de pedido (cardápios publicados, categorias,
 * itens e detalhe do produto com adicionais). Chaves próprias ("op-catalog")
 * pra não depender dos hooks internos da tela de Cardápio.
 */
export function useOrderMenus(orgId: number | null) {
  return useQuery({
    queryKey: ["op-catalog", orgId ?? -1, "menus"],
    queryFn: () => venueMenuApi.listMenus(orgId as number),
    enabled: orgId !== null,
    staleTime: 60_000,
  });
}

export function useOrderCategories(orgId: number | null, menuId: number | null) {
  return useQuery({
    queryKey: ["op-catalog", orgId ?? -1, "categories", menuId ?? -1],
    queryFn: () => venueMenuApi.listCategories(orgId as number, menuId as number),
    enabled: orgId !== null && menuId !== null,
    staleTime: 60_000,
  });
}

export function useOrderMenuItems(orgId: number | null, menuId: number | null) {
  return useQuery({
    queryKey: ["op-catalog", orgId ?? -1, "items", menuId ?? -1],
    queryFn: () => venueMenuApi.listMenuItems(orgId as number, menuId as number),
    enabled: orgId !== null && menuId !== null,
    staleTime: 30_000,
  });
}

export function useOrderProduct(orgId: number | null, productId: number | null) {
  return useQuery({
    queryKey: ["op-catalog", orgId ?? -1, "product", productId ?? -1],
    queryFn: () => venueMenuApi.getProduct(orgId as number, productId as number),
    enabled: orgId !== null && productId !== null,
    staleTime: 60_000,
  });
}

export function useOrderStations(orgId: number | null) {
  return useQuery({
    queryKey: ["op-catalog", orgId ?? -1, "stations"],
    queryFn: () => venueMenuApi.listStations(orgId as number),
    enabled: orgId !== null,
    staleTime: 60_000,
  });
}
