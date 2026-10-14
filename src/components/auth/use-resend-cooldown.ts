"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Contagem pra reenviar código. Começa em 60s; cada reenvio seguinte
 * espera `n × 300s` (mesma regra do backend). `reset()` volta ao início —
 * chame quando o modal abrir de novo.
 */
export function useResendCooldown(initialSeconds = 60) {
  const [sendCount, setSendCount] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const tick = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    tick();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [tick]);

  const startCooldown = useCallback(
    (nextCount: number) => {
      setSendCount(nextCount);
      setSecondsLeft(nextCount * 300);
      tick();
    },
    [tick],
  );

  const reset = useCallback(() => {
    setSendCount(0);
    setSecondsLeft(initialSeconds);
    tick();
  }, [initialSeconds, tick]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}m ${String(sec).padStart(2, "0")}s` : `${s}s`;
  };

  return { sendCount, secondsLeft, canResend: secondsLeft === 0, startCooldown, reset, formatTime };
}
