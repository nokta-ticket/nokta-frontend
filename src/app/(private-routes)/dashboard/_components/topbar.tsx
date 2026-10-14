"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useOrganizations } from "@/context/OrganizationContext";
import { periodLabel, usePeriod, type PeriodKey } from "@/context/PeriodContext";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Icon } from "@/components/ui/icon";
import { BrandLogo } from "@/components/brand/brand-logo";
import { cn } from "@/lib/cn";
import { resolveSectionTitle, routeUsesPeriod } from "../_lib/section-title";
import { MobileNav } from "./dashboard-sidebar";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";

/**
 * Topbar do painel: sólida (nunca translúcida), 64px. Esquerda: título da
 * seção (desktop) ou hambúrguer + logo (celular). Direita: período (só nas
 * telas que leem o PeriodContext), tema e conta. O período grava no
 * PeriodContext (padrão "Hoje") e é consumido via periodToFinanceParams.
 *
 * Sem organização (onboarding, antes do primeiro workspace) o período some —
 * o onboarding cria e seleciona a organização já na 1ª etapa, e sem a
 * checagem de rota ele apareceria no meio do wizard.
 */

type QuickKey = Exclude<PeriodKey, "custom">;

const QUICK_OPTIONS: { value: QuickKey; label: string }[] = [
  { value: "today", label: "Hoje" },
  { value: "7d", label: "7 dias" },
  { value: "30d", label: "30 dias" },
];

/** "YYYY-MM-DD" de hoje no fuso de São Paulo (mesmo fuso do backend). */
function todayInSaoPaulo(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
}

function useCustomRangeDraft() {
  const { period, setPeriod } = usePeriod();
  const today = todayInSaoPaulo();
  const [from, setFrom] = useState(period.range.from ?? today);
  const [to, setTo] = useState(period.range.to ?? today);
  const valid = Boolean(from && to && from <= to && to <= today);
  const reset = () => {
    setFrom(period.range.from ?? today);
    setTo(period.range.to ?? today);
  };
  const apply = () => setPeriod({ key: "custom", range: { from, to } });
  return { today, from, to, setFrom, setTo, valid, reset, apply };
}

function CustomRangeFields({ draft, idPrefix }: { draft: ReturnType<typeof useCustomRangeDraft>; idPrefix: string }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Field label="De" htmlFor={`${idPrefix}-from`}>
        <Input id={`${idPrefix}-from`} type="date" value={draft.from} max={draft.to || draft.today} onChange={(e) => draft.setFrom(e.target.value)} />
      </Field>
      <Field label="Até" htmlFor={`${idPrefix}-to`}>
        <Input id={`${idPrefix}-to`} type="date" value={draft.to} min={draft.from || undefined} max={draft.today} onChange={(e) => draft.setTo(e.target.value)} />
      </Field>
    </div>
  );
}

/** Desktop: segmented control + botão "Personalizado" com popover de datas. */
function PeriodFilter() {
  const { period, setPeriod } = usePeriod();
  const [open, setOpen] = useState(false);
  const draft = useCustomRangeDraft();
  const isCustom = period.key === "custom";

  return (
    <div role="group" aria-label="Período" className="flex items-center gap-1.5">
      <SegmentedControl<QuickKey | "custom"> size="sm" value={period.key} onChange={(key) => setPeriod({ key: key as QuickKey, range: { from: null, to: null } })} options={QUICK_OPTIONS} />
      <Popover
        open={open}
        onOpenChange={(next) => {
          if (next) draft.reset();
          setOpen(next);
        }}
      >
        <PopoverTrigger asChild>
          <button type="button" aria-pressed={isCustom} className={cn("inline-flex h-8 items-center gap-1.5 rounded-pill px-3 text-caption font-medium transition-colors", isCustom ? "bg-brand-soft text-brand ring-1 ring-inset ring-brand-ring" : "bg-surface-2 text-muted-foreground hover:text-foreground")}>
            <Icon name="calendar" size={12} />
            {isCustom ? periodLabel(period) : "Personalizado"}
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" sideOffset={8} className="w-72 rounded-card border-border bg-surface p-4 shadow-3">
          <p className="mb-3 text-sm font-semibold text-foreground">Período personalizado</p>
          <CustomRangeFields draft={draft} idPrefix="period" />
          <Button
            size="sm"
            className="mt-3 w-full"
            disabled={!draft.valid}
            onClick={() => {
              draft.apply();
              setOpen(false);
            }}
          >
            Aplicar
          </Button>
        </PopoverContent>
      </Popover>
    </div>
  );
}

/**
 * Abaixo de lg o seletor segmentado não cabe na barra: vira um botão com o
 * período atual que abre as mesmas quatro opções.
 */
function CompactPeriodFilter() {
  const { period, setPeriod } = usePeriod();
  const [open, setOpen] = useState(false);
  const draft = useCustomRangeDraft();

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (next) draft.reset();
        setOpen(next);
      }}
    >
      <PopoverTrigger asChild>
        <button type="button" aria-label={`Período: ${periodLabel(period)}`} className="press inline-flex h-9 max-w-[140px] items-center gap-1.5 rounded-pill bg-surface-2 pl-3 pr-2.5 text-caption font-medium text-foreground">
          <Icon name="calendar" size={12} className="text-muted-foreground" />
          <span className="truncate">{periodLabel(period)}</span>
          <Icon name="chevron-down" size={10} className="text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" collisionPadding={12} sideOffset={8} className="w-[min(20rem,calc(100vw-1.5rem))] rounded-card border-border bg-surface p-3 shadow-3">
        <div role="group" aria-label="Período" className="grid grid-cols-3 gap-1.5">
          {QUICK_OPTIONS.map((o) => {
            const active = period.key === o.value;
            return (
              <button
                key={o.value}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  setPeriod({ key: o.value, range: { from: null, to: null } });
                  setOpen(false);
                }}
                className={cn("h-11 rounded-xl text-sm font-medium transition-colors", active ? "bg-brand-soft text-brand ring-1 ring-inset ring-brand-ring" : "bg-surface-2 text-muted-foreground hover:text-foreground")}
              >
                {o.label}
              </button>
            );
          })}
        </div>
        <div className="mt-3 space-y-3 border-t border-border pt-3">
          <p className="text-caption font-semibold text-muted-foreground">Outro período</p>
          <CustomRangeFields draft={draft} idPrefix="period-compact" />
          <Button
            size="full"
            disabled={!draft.valid}
            onClick={() => {
              draft.apply();
              setOpen(false);
            }}
          >
            Aplicar
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function Topbar() {
  const { currentOrg, loadingOrgs } = useOrganizations();
  const pathname = usePathname();
  const isOnboarding = pathname.startsWith("/dashboard/onboarding");
  const showPeriod = !isOnboarding && !loadingOrgs && currentOrg !== null && routeUsesPeriod(pathname);
  const title = resolveSectionTitle(pathname);

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-surface px-4 text-foreground lg:px-6">
      {/* < lg: menu + logo. A sidebar fixa só existe a partir de lg. */}
      <div className="flex min-w-0 items-center gap-1 lg:hidden">
        <MobileNav />
        <Link href="/dashboard/inicio" aria-label="Início" className="press flex items-center">
          <BrandLogo variant="nokta" height={20} />
        </Link>
      </div>

      <div className="hidden min-w-0 lg:block">
        <h2 className="truncate text-base font-semibold tracking-tight text-foreground">{title}</h2>
        {currentOrg ? <p className="truncate text-caption text-muted-foreground">{currentOrg.nome}</p> : null}
      </div>

      <div className="ml-auto flex min-w-0 items-center gap-2 sm:gap-3">
        {showPeriod ? (
          <>
            <div className="min-w-0 lg:hidden">
              <CompactPeriodFilter />
            </div>
            <div className="hidden lg:block">
              <PeriodFilter />
            </div>
          </>
        ) : null}
        <ThemeToggle className="hidden lg:inline-flex" />
        <UserMenu />
      </div>
    </header>
  );
}
