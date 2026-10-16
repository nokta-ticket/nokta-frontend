"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { enablePush, pushPermission } from "@/lib/push";

/**
 * Mantém este aparelho inscrito nas notificações da conta logada quando a
 * pessoa já deu a permissão antes (troca de conta, inscrição que expirou,
 * chave do servidor que mudou). Nunca pede permissão: isso só acontece por
 * um toque, em PushOptIn.
 */
export function PushSync() {
  const { isAuthenticated, userId } = useAuth();
  const syncedFor = useRef<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !userId || syncedFor.current === userId) return;
    if (pushPermission() !== "granted") return;
    syncedFor.current = userId;
    enablePush({ ask: false }).catch(() => {
      syncedFor.current = null;
    });
  }, [isAuthenticated, userId]);

  return null;
}
