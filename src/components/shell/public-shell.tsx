"use client";

import { usePathname, useSelectedLayoutSegment } from "next/navigation";
import type { ReactNode } from "react";
import { ForceTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/cn";
import FixedBottomBarSpacer from "@/components/layout/fixed-bottom-bar-spacer";
import { BottomNav } from "./bottom-nav";
import { PublicFooter } from "./public-footer";
import { PublicHeader } from "./public-header";

type Chrome = { header: "full" | "minimal" | "none"; bottomNav: boolean; footer: boolean };

// Rotas que desenham o próprio shell (login, dashboard, cardápio público,
// LP institucional…): nada do shell de bilheteria por cima.
const CHROMELESS = [/^\/login/, /^\/register/, /^\/recuperar-senha/, /^\/auth\//, /^\/convites/, /^\/descadastro/, /^\/admin/, /^\/dashboard/, /^\/cardapio/, /^\/avaliacao/, /^\/institucional/];
// Rotas de auth interceptadas pelo slot `@modal` (abrem como card por cima
// da página atual): a URL vira /login, mas quem está na tela é a página de
// origem — ela mantém o shell dela.
const AUTH_MODAL = [/^\/login/, /^\/register/, /^\/recuperar-senha$/];
// Fluxos focados: só um cabeçalho mínimo com "voltar".
const MINIMAL = [/^\/evento\/[^/]+\/checkout/, /^\/revenda\/anunciar/];
// Páginas com barra de ação própria no rodapé (compra, ingresso): sem nav inferior.
const NO_BOTTOM_NAV = [/^\/evento\//, /^\/vip\//, /^\/revenda\/\d+/, /^\/meus-ingressos\/[^/]+/];

function resolveChrome(pathname: string, authModalOpen: boolean): Chrome {
  if (authModalOpen && AUTH_MODAL.some((r) => r.test(pathname))) return { header: "full", bottomNav: true, footer: true };
  if (CHROMELESS.some((r) => r.test(pathname))) return { header: "none", bottomNav: false, footer: false };
  if (MINIMAL.some((r) => r.test(pathname))) return { header: "minimal", bottomNav: false, footer: false };
  return { header: "full", bottomNav: !NO_BOTTOM_NAV.some((r) => r.test(pathname)), footer: true };
}

/**
 * Shell da superfície pública de ingressos (noktatickets.com.br): sempre
 * tema escuro, cabeçalho, nav inferior no celular e rodapé. Quem decide o
 * que aparece é a rota (ver listas acima) — nenhuma página precisa
 * "cobrir" o shell com overlay fixo.
 */
export function PublicShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  // Segmento ativo do slot `@modal` do layout público: null (ou o default)
  // quando nenhuma rota de auth está interceptada.
  const modalSegment = useSelectedLayoutSegment("modal");
  const authModalOpen = modalSegment !== null && modalSegment !== "__DEFAULT__";
  const chrome = resolveChrome(pathname, authModalOpen);

  return (
    <>
      <ForceTheme theme="dark" />
      <div className="flex min-h-dvh flex-col bg-background text-foreground">
        {chrome.header !== "none" ? <PublicHeader chrome={chrome.header} /> : null}
        {/* No desktop o header "full" é uma ilha fixa flutuando sobre a
            página — o conteúdo reserva o espaço dela; a home desconta isso
            no banner (ver HeroBanner) pra arte ficar por baixo. */}
        <main className={cn("flex flex-1 flex-col", chrome.header === "full" && "lg:pt-24")}>{children}</main>
        {chrome.footer ? <PublicFooter /> : null}
        <FixedBottomBarSpacer />
      </div>
      {chrome.bottomNav ? <BottomNav /> : null}
    </>
  );
}
