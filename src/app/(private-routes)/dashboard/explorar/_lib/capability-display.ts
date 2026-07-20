import type { CapabilityGroup, CapabilityStatus, ExploreGroup } from "@/services/platform";

/** Ordem de exibição dos grupos no Explore — CORE nunca aparece (é sempre ativo, não "descoberto"). */
export const EXPLORE_GROUP_ORDER: CapabilityGroup[] = ["EVENTS", "RELATIONSHIP", "OPERATION", "PRODUCTS", "MANAGEMENT"];

export function sortExploreGroups(groups: ExploreGroup[]): ExploreGroup[] {
  return [...groups].sort((a, b) => EXPLORE_GROUP_ORDER.indexOf(a.group) - EXPLORE_GROUP_ORDER.indexOf(b.group));
}

export type CapabilityBadgeTone = "active" | "available" | "locked";

export interface CapabilityBadge {
  label: string;
  tone: CapabilityBadgeTone;
}

/** Rótulo comercial do status — nunca expõe o enum técnico na interface. */
export function capabilityStatusBadge(status: CapabilityStatus): CapabilityBadge {
  switch (status) {
    case "ACTIVE":
      return { label: "Ativa", tone: "active" };
    case "AVAILABLE":
      return { label: "Disponível", tone: "available" };
    case "DISABLED":
      return { label: "Desativada", tone: "available" };
    case "COMING_SOON":
      return { label: "Em breve", tone: "locked" };
    case "LOCKED_FUTURE":
      return { label: "Indisponível por enquanto", tone: "locked" };
    default:
      return { label: status, tone: "available" };
  }
}

/**
 * AVAILABLE (nunca ativada) e DISABLED (desativada antes) podem ser
 * ativadas pelo mesmo endpoint — o backend não distingue as duas (ver
 * CapabilityService.activate). COMING_SOON/LOCKED_FUTURE nunca podem.
 */
export function canActivateCard(card: { status: CapabilityStatus; dependenciesMet: boolean }): boolean {
  return (card.status === "AVAILABLE" || card.status === "DISABLED") && card.dependenciesMet;
}

export function canDeactivateCard(card: { status: CapabilityStatus }): boolean {
  return card.status === "ACTIVE";
}
