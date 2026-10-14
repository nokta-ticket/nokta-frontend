"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api, { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { formatEventDateTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Icon } from "@/components/ui/icon";
import { PageHeader } from "@/components/ui/page-header";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { StatusBadge } from "@/components/ui/badge";
import { EVENT_STATUS, eventStatusMeta } from "../../_lib/event-meta";
import type { SectionKey } from "./section-registry";
import type { EventoData } from "./types";

/**
 * Cabeçalho do editor: voltar, nome, status, data · local e as ações que
 * mudam o estado do evento (ver página, publicar/despublicar, cancelar,
 * excluir). Os endpoints são os mesmos das seções Publicação/Configurações.
 */
export function EventoEditorHeader({ event, onRefresh, onGoTo }: { event: EventoData; onRefresh: () => void; onGoTo?: (key: SectionKey) => void }) {
  const router = useRouter();
  const meta = eventStatusMeta(event.status);
  const [busy, setBusy] = useState<"publish" | "unpublish" | null>(null);
  const [confirm, setConfirm] = useState<"cancel" | "delete" | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const isDraft = event.status === EVENT_STATUS.DRAFT;
  const isPublished = event.status === EVENT_STATUS.PUBLISHED;
  const isTerminal = event.status === EVENT_STATUS.CANCELLED || event.status === EVENT_STATUS.FINISHED;
  const hasImages = (event.thumbnails?.length ?? 0) > 0;
  const hasTickets = (event.ingressos?.length ?? 0) > 0;
  const canPublish = hasImages && hasTickets;
  const capacity = event.ingressos?.filter((t) => !t.vip).reduce((acc, t) => acc + t.quantidade, 0) ?? 0;
  const place = event.local || event.endereco?.localidade || null;

  const publish = async () => {
    setBusy("publish");
    try {
      await api.patch(`/produtor/eventos/${event.id}/publicar`);
      toast.success("Evento publicado! Já dá pra comprar ingresso.");
      onRefresh();
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível publicar o evento."));
    } finally {
      setBusy(null);
    }
  };

  const unpublish = async () => {
    setBusy("unpublish");
    try {
      await api.patch(`/produtor/eventos/${event.id}/despublicar`);
      toast.success("Evento despublicado. Voltou pra rascunho.");
      onRefresh();
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível despublicar o evento."));
    } finally {
      setBusy(null);
    }
  };

  const cancel = async () => {
    try {
      await api.patch(`/produtor/eventos/${event.id}/cancelar`);
      toast.success("Evento cancelado.");
      onRefresh();
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível cancelar o evento."));
      throw err;
    }
  };

  const remove = async () => {
    try {
      await api.delete(`/produtor/eventos/${event.id}`);
      toast.success("Evento excluído.");
      router.push("/dashboard/eventos");
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível excluir o evento."));
      throw err;
    }
  };

  const publishTitle = !canPublish ? (!hasTickets && !hasImages ? "Adicione ingressos e uma imagem antes de publicar" : !hasTickets ? "Adicione ao menos um lote de ingressos" : "Adicione ao menos uma imagem") : undefined;

  return (
    <>
      <PageHeader
        back="/dashboard/eventos"
        title={event.nome || "Evento sem nome"}
        badge={<StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>}
        meta={
          <>
            <span className="inline-flex items-center gap-1.5">
              <Icon name="calendar" size={11} />
              {event.data ? formatEventDateTime(event.data, event.horario) : "Data não definida"}
            </span>
            {place ? (
              <span className="inline-flex items-center gap-1.5">
                <Icon name="map-pin" size={11} />
                {place}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1.5 tnum">
              <Icon name="ticket" size={11} />
              {capacity.toLocaleString("pt-BR")} {capacity === 1 ? "ingresso" : "ingressos"}
            </span>
          </>
        }
        actions={
          <>
            <Button asChild variant="outline">
              <Link href={`/evento/${event.slug ?? event.id}`} target="_blank" rel="noreferrer">
                <Icon name="external" size={14} />
                <span className="hidden sm:inline">Ver página pública</span>
                <span className="sm:hidden">Ver página</span>
              </Link>
            </Button>
            {isDraft ? (
              <span title={publishTitle}>
                <Button leftIcon="globe" onClick={publish} loading={busy === "publish"} disabled={!canPublish || busy !== null}>
                  Publicar
                </Button>
              </span>
            ) : null}
            {isPublished ? (
              <Button variant="secondary" leftIcon="eye-slash" onClick={unpublish} loading={busy === "unpublish"} disabled={busy !== null}>
                Despublicar
              </Button>
            ) : null}
            {!isTerminal ? (
              <Popover open={menuOpen} onOpenChange={setMenuOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon" aria-label="Mais ações">
                    <Icon name="ellipsis" size={14} />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" sideOffset={6} className="scale-in w-56 rounded-card border-border bg-surface p-1.5 shadow-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onGoTo?.("configuracoes");
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-surface-2"
                  >
                    <Icon name="settings" size={13} className="text-muted-foreground" />
                    Configurações
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      setConfirm("cancel");
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-danger-bg hover:text-danger"
                  >
                    <Icon name="ban" size={13} />
                    Cancelar evento
                  </button>
                  {isDraft ? (
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        setConfirm("delete");
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-danger-bg hover:text-danger"
                    >
                      <Icon name="trash" size={13} />
                      Excluir rascunho
                    </button>
                  ) : null}
                </PopoverContent>
              </Popover>
            ) : null}
          </>
        }
      />

      <ConfirmDialog open={confirm === "cancel"} onOpenChange={(o) => (!o ? setConfirm(null) : null)} danger icon="ban" title={`Cancelar "${event.nome}"?`} description="O evento some da bilheteria e ninguém mais compra ingresso. Não dá pra reativar depois." confirmLabel="Cancelar evento" cancelLabel="Voltar" onConfirm={cancel} />
      <ConfirmDialog open={confirm === "delete"} onOpenChange={(o) => (!o ? setConfirm(null) : null)} danger icon="trash" title={`Excluir "${event.nome}"?`} description="Evento, imagens e tudo que está ligado a ele são removidos de vez. Essa ação não pode ser desfeita." confirmLabel="Excluir de vez" onConfirm={remove} />
    </>
  );
}
