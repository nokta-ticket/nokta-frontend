import { describe, expect, it } from "vitest";
import { NO_SHOW_TOLERANCE_MS, reservationPresence, summarizePresence } from "./reservation-presence";

const START = "2026-09-30T20:00:00.000Z";
const startMs = new Date(START).getTime();

describe("reservationPresence", () => {
  it("chegou: sentado ou concluída", () => {
    expect(reservationPresence({ status: "SEATED", startAt: START }, startMs)).toBe("ARRIVED");
    expect(reservationPresence({ status: "COMPLETED", startAt: START }, startMs)).toBe("ARRIVED");
  });

  it("confirmada não é presença: conta como aguardando", () => {
    expect(reservationPresence({ status: "CONFIRMED", startAt: START }, startMs)).toBe("WAITING");
    expect(reservationPresence({ status: "PENDING", startAt: START }, startMs)).toBe("WAITING");
  });

  it("vira não compareceu só depois da tolerância de 15 min", () => {
    expect(reservationPresence({ status: "CONFIRMED", startAt: START }, startMs + NO_SHOW_TOLERANCE_MS - 1)).toBe("WAITING");
    expect(reservationPresence({ status: "CONFIRMED", startAt: START }, startMs + NO_SHOW_TOLERANCE_MS)).toBe("NO_SHOW");
    expect(reservationPresence({ status: "PENDING", startAt: START }, startMs + NO_SHOW_TOLERANCE_MS)).toBe("NO_SHOW");
  });

  it("cancelada e no-show marcados manualmente", () => {
    expect(reservationPresence({ status: "CANCELED", startAt: START }, startMs)).toBe("CANCELED");
    expect(reservationPresence({ status: "NO_SHOW", startAt: START }, startMs)).toBe("NO_SHOW");
  });
});

describe("summarizePresence", () => {
  it("conta cada estado e lista só o que pede ação, por horário", () => {
    const at = (h: number) => new Date(startMs + h * 60 * 60 * 1000).toISOString();
    const now = startMs + 30 * 60 * 1000; // 20:30
    const s = summarizePresence(
      [
        { id: 3, status: "CONFIRMED", startAt: at(1) }, // 21:00 aguardando
        { id: 1, status: "SEATED", startAt: at(-1) },
        { id: 2, status: "PENDING", startAt: at(0) }, // 20:00, passou da tolerância
        { id: 4, status: "CANCELED", startAt: at(2) },
      ],
      now,
    );
    expect(s).toMatchObject({ total: 4, arrived: 1, waiting: 1, noShow: 1, canceled: 1 });
    expect(s.actionable.map((r) => r.id)).toEqual([2, 3]);
  });
});
