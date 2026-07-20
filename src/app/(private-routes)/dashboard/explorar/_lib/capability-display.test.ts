import { describe, expect, it } from "vitest";
import { canActivateCard, canDeactivateCard, capabilityStatusBadge, sortExploreGroups } from "./capability-display";
import type { ExploreGroup } from "@/services/platform";

describe("capabilityStatusBadge", () => {
  it("nunca expõe o enum técnico — sempre um rótulo comercial", () => {
    expect(capabilityStatusBadge("ACTIVE")).toEqual({ label: "Ativa", tone: "active" });
    expect(capabilityStatusBadge("AVAILABLE")).toEqual({ label: "Disponível", tone: "available" });
    expect(capabilityStatusBadge("LOCKED_FUTURE").label).not.toMatch(/LOCKED|FUTURE/);
  });
});

describe("canActivateCard", () => {
  it("permite ativar quando AVAILABLE e dependências satisfeitas", () => {
    expect(canActivateCard({ status: "AVAILABLE", dependenciesMet: true })).toBe(true);
  });

  it("permite reativar quando DISABLED e dependências satisfeitas (mesmo endpoint do backend)", () => {
    expect(canActivateCard({ status: "DISABLED", dependenciesMet: true })).toBe(true);
  });

  it("bloqueia quando dependências não estão satisfeitas, mesmo AVAILABLE", () => {
    expect(canActivateCard({ status: "AVAILABLE", dependenciesMet: false })).toBe(false);
  });

  it("nunca permite ativar capacidade ACTIVE, COMING_SOON ou LOCKED_FUTURE", () => {
    expect(canActivateCard({ status: "ACTIVE", dependenciesMet: true })).toBe(false);
    expect(canActivateCard({ status: "COMING_SOON", dependenciesMet: true })).toBe(false);
    expect(canActivateCard({ status: "LOCKED_FUTURE", dependenciesMet: true })).toBe(false);
  });
});

describe("canDeactivateCard", () => {
  it("só permite desativar quando ACTIVE", () => {
    expect(canDeactivateCard({ status: "ACTIVE" })).toBe(true);
    expect(canDeactivateCard({ status: "AVAILABLE" })).toBe(false);
    expect(canDeactivateCard({ status: "DISABLED" })).toBe(false);
  });
});

describe("sortExploreGroups", () => {
  it("ordena pelos grupos comerciais na ordem esperada e não muta o array original", () => {
    const groups = [
      { group: "MANAGEMENT", groupLabel: "Gestão", cards: [] },
      { group: "EVENTS", groupLabel: "Eventos", cards: [] },
      { group: "OPERATION", groupLabel: "Operação", cards: [] },
    ] as ExploreGroup[];

    const sorted = sortExploreGroups(groups);

    expect(sorted.map((g) => g.group)).toEqual(["EVENTS", "OPERATION", "MANAGEMENT"]);
    expect(groups.map((g) => g.group)).toEqual(["MANAGEMENT", "EVENTS", "OPERATION"]);
  });
});
