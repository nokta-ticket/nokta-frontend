"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";

/**
 * Só em desenvolvimento (o layout nem renderiza isto em produção): `?__theme=light|dark`
 * aplica o tema ao montar, pra captura headless conseguir fotografar os
 * dois temas sem clicar no toggle. Precisa de <Suspense> (useSearchParams).
 */
export function DevThemeParam() {
  const { setTheme } = useTheme();
  const searchParams = useSearchParams();
  const theme = searchParams.get("__theme");

  useEffect(() => {
    if (theme === "light" || theme === "dark") setTheme(theme);
  }, [theme, setTheme]);

  return null;
}
