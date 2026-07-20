import { describe, expect, it } from "vitest";
import { appendExploreIfAllowed, EXPLORE_MENU_ITEM, GLOBAL_MENU, type MenuItem } from "./build-menu";

describe("appendExploreIfAllowed", () => {
  it("inclui Explore a Nokta quando canExplore é true — cobre org só-Tickets, só-Venue e híbrida (não depende de ticketsEnabled/venueEnabled)", () => {
    const result = appendExploreIfAllowed(GLOBAL_MENU, true);
    expect(result).toContainEqual(EXPLORE_MENU_ITEM);
    expect(result.at(-1)).toEqual(EXPLORE_MENU_ITEM);
  });

  it("NÃO inclui Explore a Nokta para funcionário operacional (canExplore false)", () => {
    const result = appendExploreIfAllowed(GLOBAL_MENU, false);
    expect(result).not.toContainEqual(EXPLORE_MENU_ITEM);
    expect(result).toEqual(GLOBAL_MENU);
  });

  it("nunca muta o array GLOBAL_MENU compartilhado", () => {
    const before = [...GLOBAL_MENU];
    appendExploreIfAllowed(GLOBAL_MENU, true);
    appendExploreIfAllowed(GLOBAL_MENU, true);
    expect(GLOBAL_MENU).toEqual(before);
  });

  it("funciona com qualquer lista de itens de menu (não hardcoda GLOBAL_MENU)", () => {
    const custom: MenuItem[] = [{ label: "X", icon: null, href: "/x" }];
    expect(appendExploreIfAllowed(custom, true)).toHaveLength(2);
  });
});
