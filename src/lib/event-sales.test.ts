import { describe, expect, it } from "vitest";
import { getEventStartAt, isSalesClosed } from "./event-sales";

// Evento às 22:00 de Brasília em 2026-10-24 → 01:00 UTC do dia 25.
const evento = { data: "2026-10-24T00:00:00.000Z", horario: "1970-01-01T22:00:00.000Z" };

describe("event-sales", () => {
  it("lê data e horário como horário de Brasília", () => {
    expect(getEventStartAt(evento)?.toISOString()).toBe("2026-10-25T01:00:00.000Z");
    expect(getEventStartAt({ data: "2026-10-24", horario: "22:00" })?.toISOString()).toBe("2026-10-25T01:00:00.000Z");
  });

  it("vendas abertas até 1 segundo antes de faltarem 2 horas", () => {
    expect(isSalesClosed(evento, new Date("2026-10-24T22:59:59.000Z"))).toBe(false);
  });

  it("vendas encerradas exatamente 2 horas antes e depois disso", () => {
    expect(isSalesClosed(evento, new Date("2026-10-24T23:00:00.000Z"))).toBe(true);
    expect(isSalesClosed(evento, new Date("2026-10-25T02:00:00.000Z"))).toBe(true);
  });

  it("sem data ou horário legível, nunca bloqueia", () => {
    expect(isSalesClosed({ data: null, horario: "22:00" })).toBe(false);
    expect(isSalesClosed({ data: "2026-10-24", horario: "" })).toBe(false);
  });
});
