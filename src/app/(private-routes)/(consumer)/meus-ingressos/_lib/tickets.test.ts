import { describe, expect, it } from "vitest";
import { isUpcoming } from "./tickets";

// Caso real de 2026-10-17: evento hoje às 17:55 de Brasília (20:55 UTC). O
// ingresso ia para "Passados" já às 14:55 (horário lido como UTC).
const event = { data: "2026-10-17T00:00:00.000Z", horario: "1970-01-01T17:55:00.000Z" } as never;
const ticket = (status = 1) => ({ status, event });

describe("isUpcoming (Meus ingressos)", () => {
  it("antes do início fica em Próximos", () => {
    expect(isUpcoming(ticket(), new Date("2026-10-17T19:03:00.000Z"))).toBe(true); // 16:03 BRT
  });

  it("durante o evento continua em Próximos (é a hora de entrar)", () => {
    expect(isUpcoming(ticket(), new Date("2026-10-17T21:30:00.000Z"))).toBe(true); // 18:30 BRT
  });

  it("vai para Passados 12 horas depois do início", () => {
    expect(isUpcoming(ticket(), new Date("2026-10-18T08:54:00.000Z"))).toBe(true); // 05:54 BRT
    expect(isUpcoming(ticket(), new Date("2026-10-18T08:55:00.000Z"))).toBe(false); // 05:55 BRT
  });

  it("ingresso já usado vai para Passados", () => {
    expect(isUpcoming(ticket(2), new Date("2026-10-17T19:03:00.000Z"))).toBe(false);
  });

  it("aceita horário no formato HH:mm", () => {
    const e = { data: "2026-10-17", horario: "17:55" } as never;
    expect(isUpcoming({ status: 1, event: e }, new Date("2026-10-17T21:30:00.000Z"))).toBe(true);
  });
});
