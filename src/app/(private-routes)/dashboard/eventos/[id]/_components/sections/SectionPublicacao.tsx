"use client";

import { useState } from "react";
import Link from "next/link";
import api, { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Icon } from "@/components/ui/icon";
import { EVENT_STATUS, eventStatusMeta } from "../../../_lib/event-meta";
import type { SectionKey } from "../section-registry";
import { SectionCard } from "../section-ui";
import type { SectionProps } from "../types";

export default function SectionPublicacao({ event, onRefresh, onGoTo }: SectionProps) {
  const [loading, setLoading] = useState(false);
  const meta = eventStatusMeta(event.status);

  const isDraft = event.status === EVENT_STATUS.DRAFT;
  const isPublished = event.status === EVENT_STATUS.PUBLISHED;
  const isTerminal = event.status === EVENT_STATUS.CANCELLED || event.status === EVENT_STATUS.FINISHED;

  const hasImages = (event.thumbnails?.length ?? 0) > 0;
  const hasTickets = (event.ingressos?.length ?? 0) > 0;
  const canPublish = hasImages && hasTickets;

  const publish = async () => {
    setLoading(true);
    try {
      await api.patch(`/produtor/eventos/${event.id}/publicar`);
      toast.success("Evento publicado! Já dá pra comprar ingresso.");
      onRefresh();
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível publicar o evento."));
    } finally {
      setLoading(false);
    }
  };

  const unpublish = async () => {
    setLoading(true);
    try {
      await api.patch(`/produtor/eventos/${event.id}/despublicar`);
      toast.success("Evento despublicado. Voltou pra rascunho.");
      onRefresh();
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível despublicar o evento."));
    } finally {
      setLoading(false);
    }
  };

  const checklist: { label: string; done: boolean; tab: SectionKey }[] = [
    { label: "Ao menos uma imagem de capa", done: hasImages, tab: "imagens" },
    { label: "Ao menos um lote de ingressos", done: hasTickets, tab: "ingressos" },
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-[2fr_1fr] lg:gap-5">
      <SectionCard title="Publicação" description="Controle quem vê o evento na bilheteria.">
        <Callout tone={meta.tone} icon={meta.icon} title={meta.label}>
          {meta.description}
        </Callout>

        {isDraft ? (
          <div>
            <h3 className="text-sm font-semibold text-foreground">Pra publicar, falta:</h3>
            <ul className="mt-2 divide-y divide-border">
              {checklist.map((item) => (
                <li key={item.label} className="flex items-center gap-3 py-2.5">
                  <span className={cn("flex size-6 shrink-0 items-center justify-center rounded-full", item.done ? "bg-success text-white" : "bg-warning-bg text-warning")}>
                    <Icon name={item.done ? "check" : "warning"} size={10} />
                  </span>
                  <span className={cn("flex-1 text-sm", item.done ? "text-muted-foreground line-through decoration-border-strong" : "text-foreground")}>{item.label}</span>
                  {!item.done ? (
                    <Button variant="link" size="sm" onClick={() => onGoTo?.(item.tab)}>
                      Resolver
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {!isTerminal ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {isDraft ? (
              <Button size="lg" leftIcon="globe" onClick={publish} loading={loading} disabled={!canPublish} className="sm:w-auto">
                Publicar evento
              </Button>
            ) : null}
            {isPublished ? (
              <Button size="lg" variant="outline" leftIcon="eye-slash" onClick={unpublish} loading={loading} className="sm:w-auto">
                Despublicar
              </Button>
            ) : null}
            {isPublished ? <p className="text-caption text-muted-foreground">Despublicar volta o evento pra rascunho. Só funciona se ainda não houver pedido pago.</p> : null}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Evento {meta.label.toLowerCase()}: não há mais ações de publicação.</p>
        )}
      </SectionCard>

      <SectionCard title="Página pública" description="Onde o público compra.">
        <div className="surface-inset rounded-xl p-4">
          <p className="truncate font-mono text-caption text-muted-foreground">/evento/{event.slug ?? event.id}</p>
          <Button asChild variant="outline" size="sm" className="mt-3">
            <Link href={`/evento/${event.slug ?? event.id}`} target="_blank" rel="noreferrer">
              <Icon name="external" size={12} />
              Abrir página
            </Link>
          </Button>
        </div>
        <p className="text-caption text-muted-foreground">{isPublished ? "Compartilhe esse link nos stories e no WhatsApp." : "Em rascunho a página só abre pra você."}</p>
      </SectionCard>
    </div>
  );
}
