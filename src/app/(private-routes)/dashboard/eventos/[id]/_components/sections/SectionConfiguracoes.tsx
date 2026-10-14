"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api, { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Icon } from "@/components/ui/icon";
import { EVENT_STATUS } from "../../../_lib/event-meta";
import { SectionCard } from "../section-ui";
import type { SectionProps } from "../types";

export default function SectionConfiguracoes({ event, onRefresh }: SectionProps) {
  const router = useRouter();
  const [confirm, setConfirm] = useState<"cancel" | "delete" | null>(null);

  const isDraft = event.status === EVENT_STATUS.DRAFT;
  const isPublished = event.status === EVENT_STATUS.PUBLISHED;
  const isTerminal = event.status === EVENT_STATUS.CANCELLED || event.status === EVENT_STATUS.FINISHED;

  const handleCancel = async () => {
    try {
      await api.patch(`/produtor/eventos/${event.id}/cancelar`);
      toast.success("Evento cancelado.");
      onRefresh();
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível cancelar o evento."));
      throw err;
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/produtor/eventos/${event.id}`);
      toast.success("Evento excluído.");
      router.push("/dashboard/eventos");
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível excluir o evento."));
      throw err;
    }
  };

  return (
    <div className="max-w-3xl">
      <SectionCard
        title={
          <span className="flex items-center gap-2">
            <Icon name="warning" size={15} className="text-danger" />
            Zona de perigo
          </span>
        }
        description="Ações que não voltam atrás. Leia antes de confirmar."
        contentClassName="gap-0 divide-y divide-border py-0"
      >
        {isDraft || isPublished ? (
          <div className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">Cancelar evento</p>
              <p className="mt-0.5 max-w-md text-caption text-muted-foreground">O evento fica marcado como cancelado e some da bilheteria. Quem já comprou precisa ser reembolsado por você.</p>
            </div>
            <Button variant="destructive-soft" leftIcon="ban" onClick={() => setConfirm("cancel")} className="shrink-0">
              Cancelar evento
            </Button>
          </div>
        ) : null}

        {isDraft ? (
          <div className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">Excluir rascunho</p>
              <p className="mt-0.5 max-w-md text-caption text-muted-foreground">Remove de vez o evento e as imagens dele. Só dá pra excluir rascunho sem pedido vinculado.</p>
            </div>
            <Button variant="destructive-soft" leftIcon="trash" onClick={() => setConfirm("delete")} className="shrink-0">
              Excluir
            </Button>
          </div>
        ) : null}

        {isTerminal ? <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma ação disponível pra evento cancelado ou finalizado.</p> : null}
      </SectionCard>

      <ConfirmDialog open={confirm === "cancel"} onOpenChange={(o) => (!o ? setConfirm(null) : null)} danger icon="ban" title={`Cancelar "${event.nome}"?`} description="O evento some da bilheteria e ninguém mais compra ingresso. Não dá pra reativar depois." confirmLabel="Cancelar evento" cancelLabel="Voltar" onConfirm={handleCancel} />
      <ConfirmDialog open={confirm === "delete"} onOpenChange={(o) => (!o ? setConfirm(null) : null)} danger icon="trash" title={`Excluir "${event.nome}" de vez?`} description="Evento, imagens e todos os dados ligados a ele são removidos definitivamente." confirmLabel="Sim, excluir" onConfirm={handleDelete} />
    </div>
  );
}
