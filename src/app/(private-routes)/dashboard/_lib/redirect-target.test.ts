import { describe, expect, it } from "vitest";
import { buildRedirectTarget } from "./redirect-target";

describe("buildRedirectTarget", () => {
  it("sem query nenhuma, retorna só o caminho", () => {
    expect(buildRedirectTarget("/dashboard/tickets/eventos", "")).toBe("/dashboard/tickets/eventos");
  });

  it("preserva a query string que o usuário trouxe (deep link)", () => {
    expect(buildRedirectTarget("/dashboard/venue/reservas", "highlight=42")).toBe("/dashboard/venue/reservas?highlight=42");
  });

  it("mescla a query declarada no destino com a do usuário", () => {
    const result = buildRedirectTarget("/dashboard/venue/operacao?tab=mesas", "highlight=42");
    const url = new URL(`http://x${result}`);
    expect(url.pathname).toBe("/dashboard/venue/operacao");
    expect(url.searchParams.get("tab")).toBe("mesas");
    expect(url.searchParams.get("highlight")).toBe("42");
  });

  it("a query declarada no destino sempre vence em conflito — nunca é sobrescrita pela do usuário", () => {
    const result = buildRedirectTarget("/dashboard/venue/operacao?tab=mesas", "tab=outracoisa");
    expect(result).toBe("/dashboard/venue/operacao?tab=mesas");
  });

  it("nunca gera loop óbvio: mesma origem e destino produz string estável e determinística", () => {
    const a = buildRedirectTarget("/dashboard/eventos", "");
    const b = buildRedirectTarget("/dashboard/eventos", "");
    expect(a).toBe(b);
  });
});
