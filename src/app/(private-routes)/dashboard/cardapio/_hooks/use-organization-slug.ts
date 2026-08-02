"use client";

import { useMutation } from "@tanstack/react-query";
import api from "@/lib/axios";
import { useOrganizations } from "@/context/OrganizationContext";

/**
 * Slug público da organização (cardapio.nokta.live/{slug}) — édita
 * Organization.slug, não um campo do VenueMenu (a URL pública sempre
 * resolve pelo slug da org, ver VenueMenuPublicService). Restrito a OWNER
 * no backend. Depois de salvar, refaz /me/organizations pra refletir o
 * novo slug em toda a UI (cabeçalho do cardápio, MenuSharePanel etc.) sem
 * precisar de F5 — mesmo padrão já usado após criar/renomear organização.
 */
export function useUpdateOrganizationSlug(orgId: number) {
  const { refreshOrganizations } = useOrganizations();
  return useMutation({
    mutationFn: (slug: string) =>
      api.patch<{ id: number; slug: string }>(`/organizations/${orgId}/slug`, { slug }).then((r) => r.data),
    onSuccess: () => refreshOrganizations(),
  });
}
