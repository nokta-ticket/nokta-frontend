"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/icon";
import { EmptyState } from "@/components/ui/empty-state";

/**
 * Listagem canônica do painel.
 *
 *   <DataTableToolbar>…busca, filtros, refresh…</DataTableToolbar>
 *   <DataTableShell
 *     table={<DataTable>…</DataTable>}          // desktop (md+)
 *     mobile={<MobileCardList>…</MobileCardList>} // celular (<md) — OBRIGATÓRIO
 *     footer={<DataTablePagination …/>}           // fora do scroll, sempre visível
 *   />
 *
 * O corpo da tabela rola DENTRO do card (não a página). Tabela rolando de
 * lado no celular foi rejeitada: no celular são cards.
 */
export function DataTableToolbar({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex flex-wrap items-center gap-2", className)}>{children}</div>;
}

export function DataTableShell({ table, mobile, footer, className, maxHeight = "calc(100dvh - 17rem)" }: { table: ReactNode; mobile: ReactNode; footer?: ReactNode; className?: string; maxHeight?: string }) {
  return (
    <div className={cn("flex flex-col", className)}>
      <div className="hidden overflow-hidden rounded-card border border-border bg-surface shadow-card md:flex md:flex-col" style={{ maxHeight }}>
        <div className="min-h-0 flex-1 overflow-auto overscroll-contain">{table}</div>
        {footer ? <div className="border-t border-border bg-surface px-4 py-3">{footer}</div> : null}
      </div>
      <div className="md:hidden">
        {mobile}
        {footer ? <div className="pt-4">{footer}</div> : null}
      </div>
    </div>
  );
}

export function DataTable({ children, className }: { children: ReactNode; className?: string }) {
  return <table className={cn("w-full border-separate border-spacing-0 text-sm", className)}>{children}</table>;
}

export function DataTableHead({ children }: { children: ReactNode }) {
  return <thead className="thead-hairline sticky top-0 z-10 bg-surface/95 backdrop-blur-sm">{children}</thead>;
}

export function DataTableHeadCell({ children, align = "left", className, width }: { children?: ReactNode; align?: "left" | "right" | "center"; className?: string; width?: number | string }) {
  return (
    <th scope="col" style={width ? { width } : undefined} className={cn("whitespace-nowrap px-4 py-3 text-caption font-semibold uppercase tracking-[0.08em] text-subtle-foreground", align === "right" && "text-right", align === "center" && "text-center", className)}>
      {children}
    </th>
  );
}

export function DataTableBody({ children }: { children: ReactNode }) {
  return <tbody>{children}</tbody>;
}

export function DataTableRow({ children, onClick, href, selected, index = 0, className }: { children: ReactNode; onClick?: () => void; href?: string; selected?: boolean; index?: number; className?: string }) {
  const clickable = Boolean(onClick || href);
  return (
    <tr
      onClick={onClick}
      data-href={href}
      className={cn("row-in group border-b border-border/70 transition-colors", clickable && "cursor-pointer hover:bg-surface-3/60", selected && "bg-brand-soft", className)}
      style={{ ["--i" as string]: index } as never}
    >
      {children}
    </tr>
  );
}

export function DataTableCell({ children, align = "left", num, className, stopPropagation }: { children?: ReactNode; align?: "left" | "right" | "center"; num?: boolean; className?: string; stopPropagation?: boolean }) {
  return (
    <td onClick={stopPropagation ? (e) => e.stopPropagation() : undefined} className={cn("border-b border-border/70 px-4 py-3 align-middle text-foreground", num && "td-num", align === "right" && "text-right", align === "center" && "text-center", className)}>
      {children}
    </td>
  );
}

export function DataTableEmpty({ colSpan, ...state }: { colSpan: number } & Parameters<typeof EmptyState>[0]) {
  return (
    <tr>
      <td colSpan={colSpan} className="p-6">
        <EmptyState compact {...state} className="border-0" />
      </td>
    </tr>
  );
}

/** Paginação escrita com substantivo: "1–20 de 128 pedidos". */
export function DataTablePagination({ page, lastPage, total, perPage, noun, onPageChange, className }: { page: number; lastPage: number; total?: number; perPage?: number; noun: string; onPageChange: (page: number) => void; className?: string }) {
  const from = total && perPage ? (page - 1) * perPage + 1 : null;
  const to = total && perPage ? Math.min(page * perPage, total) : null;
  return (
    <div className={cn("flex items-center justify-between gap-3", className)}>
      <p className="text-caption text-muted-foreground tnum">
        {from != null && to != null && total != null ? (
          <>
            {from}–{to} de {total.toLocaleString("pt-BR")} {noun}
          </>
        ) : (
          <>
            Página {page} de {lastPage}
          </>
        )}
      </p>
      <div className="flex items-center gap-1">
        <button type="button" aria-label="Página anterior" disabled={page <= 1} onClick={() => onPageChange(page - 1)} className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground disabled:opacity-40">
          <Icon name="chevron-left" size={12} />
        </button>
        <span className="min-w-8 text-center text-caption font-medium tnum">{page}</span>
        <button type="button" aria-label="Próxima página" disabled={page >= lastPage} onClick={() => onPageChange(page + 1)} className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground disabled:opacity-40">
          <Icon name="chevron-right" size={12} />
        </button>
      </div>
    </div>
  );
}

/* ---------- celular ---------- */

export function MobileCardList({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("space-y-2.5", className)}>{children}</div>;
}

/**
 * Card de linha pro celular. `meta` são pares rótulo/valor em 2 colunas;
 * `actions` ficam no rodapé (não escondidas em menu).
 */
export function MobileCard({ title, subtitle, badge, meta, actions, onClick, href, index = 0, className, leading }: { title: ReactNode; subtitle?: ReactNode; badge?: ReactNode; meta?: { label: string; value: ReactNode; num?: boolean }[]; actions?: ReactNode; onClick?: () => void; href?: string; index?: number; className?: string; leading?: ReactNode }) {
  const body = (
    <>
      <div className="flex items-start gap-3">
        {leading}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="min-w-0 truncate text-[15px] font-semibold text-foreground">{title}</p>
            {badge}
          </div>
          {subtitle ? <p className="mt-0.5 truncate text-caption text-muted-foreground">{subtitle}</p> : null}
        </div>
      </div>
      {meta && meta.length > 0 ? (
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
          {meta.map((m) => (
            <div key={m.label} className="min-w-0">
              <dt className="text-micro uppercase tracking-wider text-subtle-foreground">{m.label}</dt>
              <dd className={cn("truncate text-sm text-foreground", m.num && "tnum")}>{m.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {actions ? (
        <div className="mt-3 flex items-center justify-end gap-1 border-t border-border pt-3" onClick={(e) => e.stopPropagation()}>
          {actions}
        </div>
      ) : null}
    </>
  );
  const cls = cn("row-in block w-full rounded-card border border-border bg-surface p-4 text-left shadow-card", (onClick || href) && "press", className);
  const style = { ["--i" as string]: index } as never;
  if (href) {
    return (
      <Link href={href} className={cls} style={style}>
        {body}
      </Link>
    );
  }
  if (onClick) {
    return (
      <div role="button" tabIndex={0} onClick={onClick} onKeyDown={(e) => (e.key === "Enter" ? onClick() : null)} className={cls} style={style}>
        {body}
      </div>
    );
  }
  return (
    <div className={cls} style={style}>
      {body}
    </div>
  );
}
