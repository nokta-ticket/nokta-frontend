"use client";

import { useEffect, useState } from "react";

function secondsUntil(expiresAt: Date | null): number | null {
  return expiresAt ? Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000)) : null;
}

/**
 * Contagem regressiva a partir de um prazo ABSOLUTO do backend (`expiresAt`
 * da reserva ou do Pix) — recalculada do relógio a cada segundo, então não
 * desvia se a aba ficar em segundo plano. `expired` só vale quando há prazo.
 */
export function useDeadlineCountdown(expiresAt: Date | null) {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(() => secondsUntil(expiresAt));

  useEffect(() => {
    setSecondsLeft(secondsUntil(expiresAt));
    if (!expiresAt) return;
    const t = setInterval(() => setSecondsLeft(secondsUntil(expiresAt)), 1000);
    return () => clearInterval(t);
  }, [expiresAt]);

  const display = secondsLeft === null ? "--:--" : `${String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:${String(secondsLeft % 60).padStart(2, "0")}`;
  return { secondsLeft, display, expired: secondsLeft !== null && secondsLeft <= 0 };
}
