"use client";

import { useEffect, useState } from "react";
import { getPlatformUrl, isSurfaceEnforced } from "@/lib/surfaces";

/**
 * Link pra uma rota da plataforma (app.nokta.live). Em host sem separação
 * de superfícies (localhost, preview da Vercel) devolve o caminho relativo,
 * pra navegação não sair do ambiente. No servidor rende a URL absoluta
 * (mesmo valor inicial no cliente → sem erro de hidratação); depois do
 * mount troca pra relativa quando couber.
 */
export function usePlatformHref(path: string): string {
  const [href, setHref] = useState(() => getPlatformUrl(path));
  useEffect(() => {
    setHref(isSurfaceEnforced(window.location.hostname) ? getPlatformUrl(path) : path);
  }, [path]);
  return href;
}

export const PRODUCER_SIGNUP_PATH = "/register?ctx=produtor";
export const PRODUCER_DASHBOARD_PATH = "/dashboard/inicio";
