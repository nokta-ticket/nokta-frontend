"use client";

import { useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useOrganizations } from "@/context/OrganizationContext";
import { periodLabel, usePeriod, type PeriodKey } from "@/context/PeriodContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { resolveMediaUrl } from "@/lib/media";
import { useVenuePublicProfile } from "../cardapio/_hooks/use-venue-public-profile";
import { AssistantSheet } from "./assistant/assistant-panel";

/**
 * Topbar do dashboard: "Pergunte à IA" à esquerda; período, notificações,
 * indique e ganhe e workspace à direita. O menu do usuário (perfil/sair) não
 * fica mais aqui — está na sidebar (UserMenu variant="sidebar"), inclusive na
 * gaveta do mobile.
 *
 * Sem organização (onboarding, antes do primeiro workspace) mostra a saudação
 * no lugar da IA e esconde período/workspace. Onboarding cria e seleciona a
 * organização (currentOrg) já na 1ª etapa — sem a checagem de rota abaixo, o
 * workspace aparecia no meio do wizard, no passo em que o usuário escolhe os
 * módulos da organização recém-criada.
 *
 * "Pergunte à IA" abre o Assistente Nokta (painel lateral). Notificações e
 * indique e ganhe são só visuais (não existem no backend ainda). O período grava no PeriodContext (padrão "Hoje") e é
 * consumido pelas telas via periodToFinanceParams — hoje, a Início.
 */

const PERIOD_OPTIONS: { key: PeriodKey; label: string }[] = [
  { key: "today", label: "Hoje" },
  { key: "7d", label: "7 dias" },
  { key: "30d", label: "30 dias" },
];

// A própria barra é o item flex (w-px/h-6 só valem em elemento de bloco — um
// <span> de linha dentro de outro wrapper perdia a largura e sumia).
function Divider({ className = "block" }: { className?: string }) {
  return <span className={`h-6 w-px shrink-0 bg-[#e3e0ec] ${className}`} aria-hidden="true" />;
}

const PERIOD_BUTTON_CLASS =
  "flex h-[30px] items-center gap-1.5 rounded-[7px] border-0 bg-transparent px-3 text-[12.5px] text-[#6b6878] aria-pressed:bg-[#f1eff6] aria-pressed:font-medium aria-pressed:text-[#1c1a24]";

/** "YYYY-MM-DD" de hoje no fuso de São Paulo (mesmo fuso do backend). */
function todayInSaoPaulo(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
}

function CustomPeriodButton() {
  const { period, setPeriod } = usePeriod();
  const [open, setOpen] = useState(false);
  const today = todayInSaoPaulo();
  const [from, setFrom] = useState(period.range.from ?? today);
  const [to, setTo] = useState(period.range.to ?? today);
  const valid = Boolean(from && to && from <= to && to <= today);

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (next) {
          setFrom(period.range.from ?? today);
          setTo(period.range.to ?? today);
        }
        setOpen(next);
      }}
    >
      <PopoverTrigger asChild>
        <button type="button" aria-pressed={period.key === "custom"} className={PERIOD_BUTTON_CLASS}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="4.5" width="18" height="16" rx="2.5" />
            <path d="M3 9.5h18M8 2.5v4M16 2.5v4" />
          </svg>
          {period.key === "custom" ? periodLabel(period) : "Personalizado"}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 space-y-3 p-4">
        <p className="text-sm font-semibold text-[#1c1a24]">Período personalizado</p>
        <label className="block space-y-1 text-xs text-[#6b6878]">
          De
          <input
            type="date"
            value={from}
            max={to || today}
            onChange={(e) => setFrom(e.target.value)}
            className="h-9 w-full rounded-lg border border-[#ebe8f2] px-2 text-base text-[#1c1a24] outline-none focus:border-[#7c3aed] sm:text-sm"
          />
        </label>
        <label className="block space-y-1 text-xs text-[#6b6878]">
          Até
          <input
            type="date"
            value={to}
            min={from || undefined}
            max={today}
            onChange={(e) => setTo(e.target.value)}
            className="h-9 w-full rounded-lg border border-[#ebe8f2] px-2 text-base text-[#1c1a24] outline-none focus:border-[#7c3aed] sm:text-sm"
          />
        </label>
        <button
          type="button"
          disabled={!valid}
          onClick={() => {
            setPeriod({ key: "custom", range: { from, to } });
            setOpen(false);
          }}
          className="h-9 w-full rounded-lg bg-[#7c3aed] text-sm font-medium text-white hover:bg-[#6d28d9] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Aplicar
        </button>
      </PopoverContent>
    </Popover>
  );
}

function PeriodFilter() {
  const { period, setPeriod } = usePeriod();

  return (
    <div role="group" aria-label="Período" className="flex gap-0.5 rounded-[10px] border border-[#ebe8f2] bg-white p-[3px]">
      {PERIOD_OPTIONS.map((o) => (
        <button
          key={o.key}
          type="button"
          aria-pressed={period.key === o.key}
          onClick={() => setPeriod({ key: o.key, range: { from: null, to: null } })}
          className={PERIOD_BUTTON_CLASS}
        >
          {o.label}
        </button>
      ))}
      <CustomPeriodButton />
    </div>
  );
}

function WorkspaceButton() {
  const { organizations, currentOrg, selectOrg, activeModuleKeys } = useOrganizations();
  // A logo do workspace vive no perfil público do Venue (mesma query/cache do
  // cabeçalho do Cardápio — trocar a logo lá atualiza aqui). Só busca com o
  // módulo Venue ativo: org só de Tickets não tem perfil e tomaria 403.
  const hasVenue = activeModuleKeys.includes("venue");
  const { data: profile } = useVenuePublicProfile(hasVenue && currentOrg ? currentOrg.id : null);

  if (!currentOrg) return null;

  // fallback null: sem logo cadastrada mostra a inicial, não a logo da Nokta.
  const logoUrl = resolveMediaUrl(profile?.logoUrl, null);
  const initial = currentOrg.nome.trim().charAt(0).toUpperCase() || "?";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2.5 rounded-[10px] border-0 bg-transparent py-1 pl-1 pr-1.5 text-sm font-semibold text-[#1c1a24] outline-none hover:bg-[#f1eff6]"
        >
          {logoUrl ? (
            <Image src={logoUrl} alt="" width={32} height={32} unoptimized className="h-8 w-8 rounded-lg object-cover" />
          ) : (
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f3edff] text-sm font-semibold text-[#7c3aed]" aria-hidden="true">
              {initial}
            </span>
          )}
          <span className="hidden max-w-[180px] truncate sm:inline">{currentOrg.nome}</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8a8796" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m7 10 5 5 5-5" />
          </svg>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {organizations.map((o) => (
          <DropdownMenuItem
            key={o.id}
            onSelect={() => selectOrg(o.id)}
            className={o.id === currentOrg.id ? "font-semibold" : undefined}
          >
            <span className="truncate">{o.nome}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Topbar() {
  const { user, isAuthResolved } = useAuth();
  const { currentOrg, loadingOrgs } = useOrganizations();
  const pathname = usePathname();
  const isOnboarding = pathname.startsWith("/dashboard/onboarding");

  const showGreeting = isOnboarding || (isAuthResolved && !loadingOrgs && !currentOrg);
  const [assistantOpen, setAssistantOpen] = useState(false);

  return (
    <header className="flex h-16 items-center justify-between gap-6 border-b border-[#ebe8f2] bg-[#fbfaff] px-4 text-[#1c1a24] lg:px-6">
      {showGreeting ? (
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-sm font-bold text-[#1f1e2e]">Olá, {user?.nome}! 👋</p>
          <p className="mt-0.5 text-xs text-[#898b98]">Bem-vindo à Nokta</p>
        </div>
      ) : (
        // Abre o Assistente Nokta (ver assistant-panel.tsx). É um botão, não um campo:
        // a conversa só existe depois que o usuário conecta a IA dele.
        <button
          type="button"
          onClick={() => setAssistantOpen(true)}
          className="flex h-[38px] w-[440px] min-w-0 max-w-full items-center gap-2 rounded-[10px] border border-[#e2d6fb] bg-white px-3 text-left text-[#7c3aed] shadow-[0_0_0_3px_#f5f0ff] transition-[border-color,transform] duration-150 ease-out hover:border-[#c9b4f5] active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 motion-reduce:active:scale-100"
        >
          <svg className="shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" />
            <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" />
          </svg>
          <span className="min-w-0 flex-1 truncate text-[13px] text-[#8a8796]">Pergunte à IA: quanto vendi hoje? qual prato mais saiu?</span>
        </button>
      )}
      <AssistantSheet open={assistantOpen} onOpenChange={setAssistantOpen} />

      <div className="flex shrink-0 items-center gap-4">
        {!showGreeting && (
          <>
            <div className="hidden xl:block">
              <PeriodFilter />
            </div>
            <Divider className="hidden xl:block" />
          </>
        )}

        <button
          type="button"
          aria-label="Notificações"
          className="flex h-9 w-9 items-center justify-center rounded-lg border-0 bg-transparent text-[#3a3746] hover:bg-[#f1eff6]"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
          </svg>
        </button>

        <Divider className="hidden md:block" />

        <button
          type="button"
          className="hidden h-[34px] items-center gap-[7px] rounded-lg border-0 bg-[#f3edff] px-3 text-[13px] font-medium text-[#7c3aed] hover:text-[#6d28d9] md:flex"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="8" width="18" height="4" rx="1" />
            <path d="M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
            <path d="M7.5 8a2.5 2.5 0 0 1 0-5C10 3 12 8 12 8s2-5 4.5-5a2.5 2.5 0 0 1 0 5" />
          </svg>
          Indique e ganhe
        </button>

        {!showGreeting && (
          <>
            <Divider />
            <WorkspaceButton />
          </>
        )}
      </div>
    </header>
  );
}
