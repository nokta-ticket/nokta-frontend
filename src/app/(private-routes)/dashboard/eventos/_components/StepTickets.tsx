"use client";

import { useMemo, useState } from "react";
import { type IngressoLote, useEvento } from "@/context/EventoContext";
import { formatBRL, formatDateBR } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { DataTable, DataTableBody, DataTableCell, DataTableHead, DataTableHeadCell, DataTableRow, DataTableShell, MobileCard, MobileCardList } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { StatusBadge } from "@/components/ui/badge";
import { TIPO_INGRESSO_META } from "../_lib/event-meta";
import { SectionCard } from "../[id]/_components/section-ui";
import { AddLoteDialog } from "./AddLoteDialog";

export default function StepTickets() {
  const [open, setOpen] = useState(false);
  const { setLotes, setData, lotes } = useEvento();
  const [editingLoteIndex, setEditingLoteIndex] = useState<number | null>(null);

  const totalIngressos = useMemo(() => lotes.reduce((acc, lote) => acc + Number(lote.quantidade || 0), 0), [lotes]);

  const normalize = (list: IngressoLote[]) =>
    list.map((l) => ({
      tipo: l.tipo,
      lote: 1,
      quantidade: Number(l.quantidade),
      valor: l.tipo === 0 ? 0 : Number(l.valor),
      dataLimite: l.dataLimite,
      disponivelParaVenda: l.disponivelParaVenda,
      nome: l.nome,
    }));

  const applyLotes = (list: IngressoLote[]) => {
    const formatados = normalize(list);
    setLotes(formatados);
    const primeiro = formatados[0];
    if (primeiro) setData({ tipoIngresso: primeiro.tipo === 0 ? 0 : 1 });
  };

  const addLote = (lote: IngressoLote) => applyLotes([...lotes, lote]);

  function updateLote(ticket: IngressoLote, index: number) {
    setEditingLoteIndex(null);
    setLotes(lotes.map((el, i) => (i === index ? ticket : el)));
  }

  const editLote = (index: number) => {
    setEditingLoteIndex(index);
    setOpen(true);
  };

  const removeLote = (index: number) => applyLotes(lotes.filter((_, i) => i !== index));

  const openDialog = () => {
    setEditingLoteIndex(null);
    setOpen(true);
  };

  const rowActions = (idx: number) => (
    <>
      <Button variant="subtle" size="icon-sm" aria-label="Editar lote" title="Editar" onClick={() => editLote(idx)}>
        <Icon name="edit" size={13} />
      </Button>
      <Button variant="subtle" size="icon-sm" aria-label="Remover lote" title="Remover" className="hover:bg-danger-bg hover:text-danger" onClick={() => removeLote(idx)}>
        <Icon name="trash" size={13} />
      </Button>
    </>
  );

  return (
    <SectionCard
      title="Ingressos e lotes"
      description={lotes.length > 0 ? `${lotes.length} ${lotes.length === 1 ? "lote" : "lotes"} · ${totalIngressos.toLocaleString("pt-BR")} ingressos` : "Crie ao menos um lote pra conseguir publicar."}
      action={
        lotes.length > 0 ? (
          <Button leftIcon="plus" size="sm" onClick={openDialog}>
            Adicionar lote
          </Button>
        ) : undefined
      }
      contentClassName="py-4"
    >
      {lotes.length === 0 ? (
        <EmptyState icon="ticket" title="Nenhum lote ainda" description="Crie ao menos um lote de ingressos pra publicar o evento." action={<Button leftIcon="plus" onClick={openDialog}>Criar primeiro lote</Button>} />
      ) : (
        <DataTableShell
          maxHeight="none"
          table={
            <DataTable>
              <DataTableHead>
                <tr>
                  <DataTableHeadCell>Lote</DataTableHeadCell>
                  <DataTableHeadCell align="right">Preço</DataTableHeadCell>
                  <DataTableHeadCell align="right">Quantidade</DataTableHeadCell>
                  <DataTableHeadCell>Data limite</DataTableHeadCell>
                  <DataTableHeadCell>Status</DataTableHeadCell>
                  <DataTableHeadCell align="right" width={96}>
                    <span className="sr-only">Ações</span>
                  </DataTableHeadCell>
                </tr>
              </DataTableHead>
              <DataTableBody>
                {lotes.map((l, idx) => {
                  const meta = TIPO_INGRESSO_META[l.tipo] ?? { label: "Outro", tone: "neutral" as const };
                  return (
                    <DataTableRow key={idx} index={idx}>
                      <DataTableCell>
                        <p className="font-semibold">{l.nome}</p>
                        <p className="text-caption text-muted-foreground">{meta.label}</p>
                      </DataTableCell>
                      <DataTableCell num>{l.tipo === 0 ? "Gratuito" : formatBRL(Number(l.valor))}</DataTableCell>
                      <DataTableCell num>{Number(l.quantidade).toLocaleString("pt-BR")}</DataTableCell>
                      <DataTableCell className={!l.dataLimite ? "text-subtle-foreground" : undefined}>{l.dataLimite ? formatDateBR(l.dataLimite) : "Sem limite"}</DataTableCell>
                      <DataTableCell>
                        <StatusBadge tone={l.disponivelParaVenda ? "success" : "neutral"}>{l.disponivelParaVenda ? "À venda" : "Pausado"}</StatusBadge>
                      </DataTableCell>
                      <DataTableCell align="right">
                        <div className="flex justify-end gap-0.5">{rowActions(idx)}</div>
                      </DataTableCell>
                    </DataTableRow>
                  );
                })}
              </DataTableBody>
            </DataTable>
          }
          mobile={
            <MobileCardList>
              {lotes.map((l, idx) => {
                const meta = TIPO_INGRESSO_META[l.tipo] ?? { label: "Outro", tone: "neutral" as const };
                return <MobileCard key={idx} index={idx} title={l.nome} subtitle={meta.label} badge={<StatusBadge tone={l.disponivelParaVenda ? "success" : "neutral"}>{l.disponivelParaVenda ? "À venda" : "Pausado"}</StatusBadge>} meta={[{ label: "Preço", value: l.tipo === 0 ? "Gratuito" : formatBRL(Number(l.valor)), num: true }, { label: "Quantidade", value: Number(l.quantidade).toLocaleString("pt-BR"), num: true }, { label: "Data limite", value: l.dataLimite ? formatDateBR(l.dataLimite) : "Sem limite" }]} actions={rowActions(idx)} />;
              })}
            </MobileCardList>
          }
        />
      )}

      <AddLoteDialog
        onAdd={addLote}
        open={open}
        setOpen={(val) => {
          if (!val) setEditingLoteIndex(null);
          setOpen(val);
        }}
        editingIndex={editingLoteIndex}
        onEdit={updateLote}
      />
    </SectionCard>
  );
}
