"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

type Forced = "dark" | "light" | undefined;

const ForcedThemeContext = createContext<{ force: (theme: Forced) => void }>({ force: () => {} });

/**
 * Tema do app. Escuro por padrão (marca). O painel pode alternar
 * claro/escuro (persistido pelo next-themes); as superfícies públicas
 * (ingressos, LP, login) rendem `<ForceTheme theme="dark" />` e ficam
 * sempre escuras sem mexer na preferência salva do painel.
 */
export function AppThemeProvider({ children }: { children: ReactNode }) {
  const [forced, setForced] = useState<Forced>(undefined);
  const force = useCallback((theme: Forced) => setForced(theme), []);
  const value = useMemo(() => ({ force }), [force]);

  return (
    <ForcedThemeContext.Provider value={value}>
      <NextThemesProvider attribute="class" defaultTheme="dark" enableSystem={false} forcedTheme={forced} disableTransitionOnChange>
        {children}
      </NextThemesProvider>
    </ForcedThemeContext.Provider>
  );
}

export function ForceTheme({ theme }: { theme: "dark" | "light" }) {
  const { force } = useContext(ForcedThemeContext);
  useEffect(() => {
    force(theme);
    return () => force(undefined);
  }, [force, theme]);
  return null;
}
