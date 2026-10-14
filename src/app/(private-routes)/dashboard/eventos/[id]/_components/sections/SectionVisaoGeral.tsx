"use client";

import { cn } from "@/lib/cn";
import { formatEventDate, formatTime } from "@/lib/format";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DetailGrid, DetailItem } from "@/components/ui/detail-list";
import { Icon, type IconName } from "@/components/ui/icon";
import { ProgressBar } from "@/components/ui/progress-bar";
import { StatusBadge } from "@/components/ui/badge";
import { EVENT_STATUS, eventStatusMeta } from "../../../_lib/event-meta";
import type { SectionKey } from "../section-registry";
import type { SectionProps } from "../types";

export default function SectionVisaoGeral({ event, onGoTo }: SectionProps) {
  const meta = eventStatusMeta(event.status);
  const saleTickets = (event.ingressos ?? []).filter((t) => !t.vip);
  const totalCapacity = saleTickets.reduce((acc, t) => acc + t.quantidade, 0);
  const lots = new Set(saleTickets.map((t) => t.lote ?? 1)).size;
  const hasImages = (event.thumbnails?.length ?? 0) > 0;
  const hasTickets = saleTickets.length > 0;
  const hasDate = Boolean(event.data);
  const hasAddress = Boolean(event.endereco?.logradouro);
  const isPublished = event.status === EVENT_STATUS.PUBLISHED;

  const checklist: { label: string; done: boolean; tab: SectionKey }[] = [
    { label: "Data e horário definidos", done: hasDate, tab: "informacoes" },
    { label: "Endereço preenchido", done: hasAddress, tab: "informacoes" },
    { label: "Ingressos criados", done: hasTickets, tab: "ingressos" },
    { label: "Imagem de capa adicionada", done: hasImages, tab: "imagens" },
    { label: isPublished ? "Publicado e vendendo" : "Publicado na bilheteria", done: isPublished, tab: "publicacao" },
  ];
  const doneCount = checklist.filter((i) => i.done).length;

  const shortcuts: { key: SectionKey; label: string; icon: IconName; desc: string }[] = [
    { key: "informacoes", label: "Informações", icon: "info", desc: event.nome ? event.nome : "Sem nome definido" },
    { key: "ingressos", label: "Ingressos", icon: "ticket", desc: hasTickets ? `${lots} ${lots === 1 ? "lote" : "lotes"} · ${totalCapacity.toLocaleString("pt-BR")} ingressos` : "Nenhum lote criado" },
    { key: "imagens", label: "Imagens", icon: "image", desc: `${event.thumbnails?.length ?? 0} de 3 imagens` },
    { key: "publicacao", label: "Publicação", icon: "globe", desc: meta.description },
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-[2fr_1fr] lg:gap-5">
      <div className="space-y-4">
        <Card className="fade-up">
          <CardHeader>
            <div>
              <CardTitle>Configuração do evento</CardTitle>
              <CardDescription>
                {doneCount === checklist.length ? "Tudo pronto. Boa festa!" : `${doneCount} de ${checklist.length} etapas concluídas`}
              </CardDescription>
            </div>
            <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
          </CardHeader>
          <CardContent className="pt-4">
            <ProgressBar value={doneCount} max={checklist.length} tone={doneCount === checklist.length ? "success" : "brand"} size="md" label="Progresso da configuração" />
            <ul className="mt-5 divide-y divide-border">
              {checklist.map((item) => (
                <li key={item.label}>
                  <button type="button" onClick={() => onGoTo?.(item.tab)} className="group flex w-full items-center gap-3 py-3 text-left">
                    <span className={cn("flex size-6 shrink-0 items-center justify-center rounded-full", item.done ? "bg-success text-white" : "border-2 border-border-strong bg-surface")}>{item.done ? <Icon name="check" size={10} /> : null}</span>
                    <span className={cn("flex-1 text-sm", item.done ? "text-muted-foreground" : "font-medium text-foreground")}>{item.label}</span>
                    {!item.done ? (
                      <span className="flex items-center gap-1 text-caption font-medium text-brand opacity-0 transition-opacity group-hover:opacity-100">
                        Resolver <Icon name="arrow-right" size={10} />
                      </span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <div className="grid gap-3 sm:grid-cols-2">
          {shortcuts.map((s, i) => (
            <button key={s.key} type="button" onClick={() => onGoTo?.(s.key)} className="fade-up card-hover press flex items-center gap-3 rounded-card border border-border bg-surface p-4 text-left shadow-card" style={{ ["--i" as string]: i + 1 } as never}>
              <Icon name={s.icon} size={16} className="shrink-0 text-brand" />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-foreground">{s.label}</span>
                <span className="block truncate text-caption text-muted-foreground">{s.desc}</span>
              </span>
              <Icon name="chevron-right" size={12} className="shrink-0 text-subtle-foreground" />
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <Card className="fade-up" style={{ ["--i" as string]: 2 } as never}>
          <CardHeader>
            <CardTitle>Resumo</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <DetailGrid columns={2}>
              <DetailItem label="Data" icon="calendar" value={event.data ? formatEventDate(event.data) : null} />
              <DetailItem label="Horário" icon="clock" value={formatTime(event.horario)} />
              <DetailItem label="Ingressos" icon="ticket" value={hasTickets ? totalCapacity.toLocaleString("pt-BR") : null} />
              <DetailItem label="Lotes" icon="layers" value={lots > 0 ? String(lots) : null} />
            </DetailGrid>
          </CardContent>
        </Card>

        <Card className="fade-up" style={{ ["--i" as string]: 3 } as never}>
          <CardHeader>
            <CardTitle>Local</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {hasAddress ? (
              <div className="flex items-start gap-3">
                <Icon name="map-pin" size={14} className="mt-1 shrink-0 text-brand" />
                <div className="min-w-0 text-sm">
                  {event.local ? <p className="font-semibold text-foreground">{event.local}</p> : null}
                  <p className="text-foreground">
                    {event.endereco.logradouro}
                    {event.endereco.numero ? `, ${event.endereco.numero}` : ""}
                  </p>
                  <p className="text-muted-foreground">
                    {[event.endereco.bairro, event.endereco.localidade].filter(Boolean).join(" · ")}
                    {event.endereco.uf ? ` / ${event.endereco.uf}` : ""}
                  </p>
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => onGoTo?.("informacoes")} className="flex items-center gap-2 text-sm text-brand hover:underline">
                <Icon name="map-pin" size={13} />
                Adicionar endereço
              </button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
