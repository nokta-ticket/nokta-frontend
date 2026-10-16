"use client";

import { useEffect, useState } from "react";
import { type IngressoLote, useEvento } from "@/context/EventoContext";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldGroup } from "@/components/ui/field";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Input } from "@/components/ui/input";
import { SelectInput } from "@/components/ui/select-input";
import { SwitchRow } from "@/components/ui/switch-row";
import { TIPO_INGRESSO_OPTIONS } from "../_lib/event-meta";

interface AddLoteDialogProps {
  onAdd: (lote: IngressoLote) => void;
  onEdit: (lote: IngressoLote, index: number) => void;
  open: boolean;
  setOpen: (bool: boolean) => void;
  editingIndex: number | null;
}

const EMPTY: IngressoLote = { nome: "", valor: 0, quantidade: 0, tipo: 1, disponivelParaVenda: true, dataLimite: "", lote: 1 };

/** Diálogo de lote do wizard. Quem abre é o pai (`open`/`setOpen`); `editingIndex` preenche o formulário. */
export function AddLoteDialog({ onAdd, onEdit, setOpen, open, editingIndex }: AddLoteDialogProps) {
  const { lotes } = useEvento();
  const [lote, setLote] = useState<IngressoLote>(EMPTY);

  useEffect(() => {
    if (typeof editingIndex === "number") {
      setOpen(true);
      const find = lotes.find((_, i) => i === editingIndex);
      if (find) setLote(find);
    } else if (open) {
      setLote(EMPTY);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingIndex, open]);

  const isGratuito = lote.tipo === 0;
  const isEditing = typeof editingIndex === "number";

  const handleConfirm = () => {
    if (!lote.nome || !lote.quantidade || (!isGratuito && !lote.valor)) {
      toast.error("Preencha nome, quantidade e preço do lote.");
      return;
    }
    if (isEditing) {
      onEdit(lote, editingIndex as number);
    } else {
      onAdd(lote);
    }
    setLote(EMPTY);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar lote" : "Novo lote de ingressos"}</DialogTitle>
          <DialogDescription>{isEditing ? "Altere as configurações do lote." : "Tipo, preço, quantidade e disponibilidade."}</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <Field label="Nome do lote" htmlFor="lote-nome" required>
            <Input id="lote-nome" value={lote.nome} onChange={(e) => setLote({ ...lote, nome: e.target.value })} placeholder="Ex.: 1º lote, Early bird, VIP…" autoFocus />
          </Field>
          <Field label="Tipo de ingresso" htmlFor="lote-tipo" required>
            <SelectInput id="lote-tipo" value={String(lote.tipo)} onValueChange={(val) => setLote((prev) => ({ ...prev, tipo: Number(val) as IngressoLote["tipo"] }))} options={TIPO_INGRESSO_OPTIONS} />
          </Field>
          {!isGratuito ? (
            <Field label="Preço unitário" htmlFor="lote-valor" required>
              <CurrencyInput id="lote-valor" value={Number(lote.valor) || 0} onValueChange={(valor) => setLote((prev) => ({ ...prev, valor }))} />
            </Field>
          ) : null}
          <FieldGroup columns={2}>
            <Field label="Quantidade" htmlFor="lote-qtd" required>
              <Input id="lote-qtd" type="number" min={1} inputMode="numeric" placeholder="0" value={lote.quantidade || ""} onChange={(e) => setLote((prev) => ({ ...prev, quantidade: Number(e.target.value) }))} />
            </Field>
            <Field label="Data limite" htmlFor="lote-limite" optional>
              <Input id="lote-limite" type="date" value={lote.dataLimite} onChange={(e) => setLote((prev) => ({ ...prev, dataLimite: e.target.value }))} />
            </Field>
          </FieldGroup>
          <SwitchRow label="Disponível para venda" description={lote.disponivelParaVenda ? "Visível pra compra assim que publicar" : "Pausado — não aparece na bilheteria"} checked={lote.disponivelParaVenda} onCheckedChange={(val) => setLote((prev) => ({ ...prev, disponivelParaVenda: val }))} />
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button leftIcon={isEditing ? "save" : "plus"} onClick={handleConfirm}>
            {isEditing ? "Salvar alterações" : "Adicionar lote"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
