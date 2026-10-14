"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import type { EventoAPI } from "@/interfaces/events";
import { StatusBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { DataTable, DataTableBody, DataTableCell, DataTableEmpty, DataTableHead, DataTableHeadCell, DataTableRow, DataTableShell, MobileCard, MobileCardList } from "@/components/ui/data-table";
import { cityLabel, formatEventDate, formatEventDateShort, formatTime } from "@/lib/format";
import { MEDIA_FALLBACK, resolveThumbnailUrl } from "@/lib/media";

function Thumb({ event, className }: { event: EventoAPI; className?: string }) {
  const src = resolveThumbnailUrl(event.thumbnails?.[0], MEDIA_FALLBACK) ?? MEDIA_FALLBACK;
  return (
    <span className={className ?? "relative block aspect-video w-24 shrink-0 overflow-hidden rounded-lg bg-surface-2 ring-1 ring-border"}>
      <Image src={src} alt="" fill sizes="120px" className="object-cover" unoptimized />
    </span>
  );
}

function addressLine(event: EventoAPI): string {
  const city = cityLabel(event.endereco);
  return [event.local, city].filter(Boolean).join(" — ");
}

/**
 * Listagem de eventos do admin (Eventos e Eventos em destaque): banner
 * pequeno + nome/local, data, status, destaque e a ação da página.
 */
export function EventTable({ rows, emptyTitle, emptyDescription, footer, action, onRowClick }: { rows: EventoAPI[]; emptyTitle: string; emptyDescription?: string; footer?: ReactNode; action: (event: EventoAPI) => ReactNode; onRowClick?: (event: EventoAPI) => void }) {
  return (
    <DataTableShell
      table={
        <DataTable>
          <DataTableHead>
            <tr>
              <DataTableHeadCell>Evento</DataTableHeadCell>
              <DataTableHeadCell>Data</DataTableHeadCell>
              <DataTableHeadCell>Status</DataTableHeadCell>
              <DataTableHeadCell>Destaque</DataTableHeadCell>
              <DataTableHeadCell align="right">
                <span className="sr-only">Ações</span>
              </DataTableHeadCell>
            </tr>
          </DataTableHead>
          <DataTableBody>
            {rows.length === 0 ? (
              <DataTableEmpty colSpan={5} icon="calendar" title={emptyTitle} description={emptyDescription} />
            ) : (
              rows.map((ev, i) => {
                const time = formatTime(ev.horario);
                return (
                  <DataTableRow key={ev.id} index={i} onClick={onRowClick ? () => onRowClick(ev) : undefined}>
                    <DataTableCell>
                      <div className="flex items-center gap-3">
                        <Thumb event={ev} />
                        <div className="min-w-0">
                          <p className="truncate font-medium">{ev.nome}</p>
                          <p className="truncate text-caption text-muted-foreground">{addressLine(ev)}</p>
                        </div>
                      </div>
                    </DataTableCell>
                    <DataTableCell className="whitespace-nowrap text-muted-foreground">
                      {formatEventDate(ev.data)}
                      {time ? ` · ${time}` : ""}
                    </DataTableCell>
                    <DataTableCell>
                      <StatusBadge tone={ev.ativo ? "success" : "neutral"}>{ev.ativo ? "Ativo" : "Inativo"}</StatusBadge>
                    </DataTableCell>
                    <DataTableCell>{ev.destaque ? <StatusBadge tone="brand">Em destaque</StatusBadge> : <span className="text-subtle-foreground">—</span>}</DataTableCell>
                    <DataTableCell align="right" stopPropagation>
                      <div className="flex justify-end gap-1">{action(ev)}</div>
                    </DataTableCell>
                  </DataTableRow>
                );
              })
            )}
          </DataTableBody>
        </DataTable>
      }
      mobile={
        rows.length === 0 ? (
          <EmptyState compact icon="calendar" title={emptyTitle} description={emptyDescription} />
        ) : (
          <MobileCardList>
            {rows.map((ev, i) => {
              const time = formatTime(ev.horario);
              return (
                <MobileCard
                  key={ev.id}
                  index={i}
                  onClick={onRowClick ? () => onRowClick(ev) : undefined}
                  leading={<Thumb event={ev} className="relative block aspect-video w-20 shrink-0 overflow-hidden rounded-lg bg-surface-2 ring-1 ring-border" />}
                  title={ev.nome}
                  subtitle={addressLine(ev)}
                  badge={ev.destaque ? <StatusBadge tone="brand" dot={false}>Destaque</StatusBadge> : undefined}
                  meta={[
                    { label: "Data", value: `${formatEventDateShort(ev.data)}${time ? ` · ${time}` : ""}`, num: true },
                    { label: "Status", value: ev.ativo ? "Ativo" : "Inativo" },
                  ]}
                  actions={action(ev)}
                />
              );
            })}
          </MobileCardList>
        )
      }
      footer={footer}
    />
  );
}
