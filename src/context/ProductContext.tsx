"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { useOrganizations } from "./OrganizationContext";

export type ProductContextKey = "tickets" | "venue";

const PRODUCT_KEYS: ProductContextKey[] = ["tickets", "venue"];
const STORAGE_KEY = "nokta:dashboard:context";

interface ProductContextType {
  /** Contextos que a org ativou (interseção dos módulos com tickets/venue). */
  available: ProductContextKey[];
  /** Contexto de produto ativo. */
  active: ProductContextKey;
  /** Troca de contexto e navega para o Início dele. */
  setActive: (c: ProductContextKey) => void;
  /** true quando há 2+ contextos (mostra o switcher). */
  showSwitcher: boolean;
}

const ProductCtx = createContext<ProductContextType | undefined>(undefined);

function contextFromPath(pathname: string): ProductContextKey | null {
  if (pathname.startsWith("/dashboard/tickets")) return "tickets";
  if (pathname.startsWith("/dashboard/venue")) return "venue";
  return null;
}

export function ProductProvider({ children }: { children: ReactNode }) {
  const { activeModuleKeys } = useOrganizations();
  const pathname = usePathname();
  const router = useRouter();

  const available = useMemo(
    () => PRODUCT_KEYS.filter((k) => activeModuleKeys.includes(k)),
    [activeModuleKeys],
  );

  const fromUrl = contextFromPath(pathname);

  const [persisted, setPersisted] = useState<ProductContextKey>("tickets");

  // Hidrata o último contexto do localStorage.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === "tickets" || raw === "venue") setPersisted(raw);
    } catch {
      /* ignore */
    }
  }, []);

  // Quando a URL define o contexto, persiste.
  useEffect(() => {
    if (fromUrl) {
      setPersisted(fromUrl);
      try {
        localStorage.setItem(STORAGE_KEY, fromUrl);
      } catch {
        /* ignore */
      }
    }
  }, [fromUrl]);

  // active = URL > persistido, sempre dentro dos disponíveis.
  let active: ProductContextKey = fromUrl ?? persisted;
  if (available.length > 0 && !available.includes(active)) {
    active = available[0];
  }

  // Segurança: se a URL aponta um contexto que a org não tem, redireciona.
  useEffect(() => {
    if (fromUrl && available.length > 0 && !available.includes(fromUrl)) {
      router.replace(`/dashboard/${available[0]}/inicio`);
    }
  }, [fromUrl, available, router]);

  const setActive = (c: ProductContextKey) => {
    setPersisted(c);
    try {
      localStorage.setItem(STORAGE_KEY, c);
    } catch {
      /* ignore */
    }
    router.push(`/dashboard/${c}/inicio`);
  };

  return (
    <ProductCtx.Provider
      value={{ available, active, setActive, showSwitcher: available.length > 1 }}
    >
      {children}
    </ProductCtx.Provider>
  );
}

export const useProductContext = () => {
  const ctx = useContext(ProductCtx);
  if (!ctx)
    throw new Error("useProductContext must be used within a ProductProvider");
  return ctx;
};
