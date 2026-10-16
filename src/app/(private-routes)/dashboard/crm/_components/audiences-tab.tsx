"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { crmApi, crmKeys, type CrmFilterOptions, type CrmFilters, type CrmSegment } from "@/services/crm";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable, DataTableBody, DataTableCell, DataTableHead, DataTableHeadCell, DataTableRow, DataTableShell, MobileCard, MobileCardList } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { Skeleton } from "@/components/ui/skeleton";
import { ChannelIcon, describeFilters, num } from "./crm-ui";

/** Públicos salvos: regras que se recalculam sozinhas. */
export function AudiencesTab({ orgId, segments, loading, options, onOpen, onNew, canManage }: { orgId: number; segments?: CrmSegment[]; loading: boolean; options?: CrmFilterOptions; onOpen: (filters: CrmFilters) => void; onNew: () => void; canManage: boolean }) {
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState<CrmSegment | null>(null);
  const remove = useMutation({
    mutationFn: (id: number) => crmApi.removeSegment(orgId, id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: crmKeys.segments(orgId) });
      toast.success("Público apagado. Os contatos continuam na sua lista.");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Não foi possível apagar o público.")),
  });

  if (loading && !segments) return <Skeleton className="h-64 rounded-card" />;

  if (!segments || segments.length === 0) {
    return (
      <EmptyState
        icon="users"
        title="Um público é um recorte da sua lista que você guarda pra usar de novo"
        description="Filtre os contatos por evento, presença ou tempo sem comprar e toque em “Salvar como público”. Ele se atualiza sozinho: quem passar a se encaixar entra, quem pedir para sair deixa de contar."
        action={
          canManage ? (
            <Button leftIcon="plus" onClick={onNew}>
              Montar um público
            </Button>
          ) : undefined
        }
      />
    );
  }

  const rules = (s: CrmSegment) => describeFilters(s.filters, options).join(" · ") || "Toda a lista";
  const actions = (s: CrmSegment) => (
    <>
      <Button variant="subtle" size="sm" rightIcon="arrow-right" onClick={() => onOpen(s.filters)}>
        Ver contatos
      </Button>
      {canManage ? (
        <Button variant="subtle" size="icon-sm" aria-label={`Apagar público ${s.name}`} title="Apagar" className="hover:bg-danger-bg hover:text-danger" onClick={() => setConfirming(s)}>
          <Icon name="trash" size={13} />
        </Button>
      ) : null}
    </>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-[80ch] text-sm leading-relaxed text-muted-foreground">Cada público guarda as regras, não as pessoas. Os números são de agora.</p>
        {canManage ? (
          <Button leftIcon="plus" onClick={onNew} className="shrink-0">
            Novo público
          </Button>
        ) : null}
      </div>

      <DataTableShell
        table={
          <DataTable>
            <DataTableHead>
              <tr>
                <DataTableHeadCell>Público</DataTableHeadCell>
                <DataTableHeadCell>Regras</DataTableHeadCell>
                <DataTableHeadCell align="right">Pessoas</DataTableHeadCell>
                <DataTableHeadCell align="right">
                  <span className="inline-flex items-center gap-1.5">
                    <ChannelIcon channel="EMAIL" size={11} /> E-mail
                  </span>
                </DataTableHeadCell>
                <DataTableHeadCell align="right">
                  <span className="inline-flex items-center gap-1.5">
                    <ChannelIcon channel="WHATSAPP" size={11} /> WhatsApp
                  </span>
                </DataTableHeadCell>
                <DataTableHeadCell align="right">
                  <span className="inline-flex items-center gap-1.5">
                    <ChannelIcon channel="PUSH" size={11} /> Notificação
                  </span>
                </DataTableHeadCell>
                <DataTableHeadCell align="right" width={200}>
                  <span className="sr-only">Ações</span>
                </DataTableHeadCell>
              </tr>
            </DataTableHead>
            <DataTableBody>
              {segments.map((s, i) => (
                <DataTableRow key={s.id} index={i} onClick={() => onOpen(s.filters)}>
                  <DataTableCell>
                    <span className="block font-semibold">{s.name}</span>
                    {s.description ? <span className="block text-caption text-muted-foreground">{s.description}</span> : null}
                  </DataTableCell>
                  <DataTableCell className="max-w-[320px] text-muted-foreground">{rules(s)}</DataTableCell>
                  <DataTableCell num className="text-base font-semibold">
                    {num(s.counts.total)}
                  </DataTableCell>
                  <DataTableCell num>{num(s.counts.emailEligible)}</DataTableCell>
                  <DataTableCell num>{num(s.counts.whatsappEligible)}</DataTableCell>
                  <DataTableCell num>{num(s.counts.pushEligible)}</DataTableCell>
                  <DataTableCell align="right" stopPropagation>
                    <div className="flex items-center justify-end gap-1">{actions(s)}</div>
                  </DataTableCell>
                </DataTableRow>
              ))}
            </DataTableBody>
          </DataTable>
        }
        mobile={
          <MobileCardList>
            {segments.map((s, i) => (
              <MobileCard key={s.id} index={i} onClick={() => onOpen(s.filters)} title={s.name} subtitle={rules(s)} meta={[{ label: "Pessoas", value: num(s.counts.total), num: true }, { label: "E-mail · WhatsApp · Notificação", value: `${num(s.counts.emailEligible)} · ${num(s.counts.whatsappEligible)} · ${num(s.counts.pushEligible)}`, num: true }]} actions={actions(s)} />
            ))}
          </MobileCardList>
        }
      />

      <ConfirmDialog open={confirming !== null} onOpenChange={(o) => (!o ? setConfirming(null) : null)} danger icon="trash" title={`Apagar o público “${confirming?.name}”?`} description="Só as regras somem. Os contatos continuam na sua lista." confirmLabel="Apagar" onConfirm={() => (confirming ? remove.mutateAsync(confirming.id) : undefined)} />
    </div>
  );
}
