"use client";

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useEffect, useState } from "react";
import { IngressoLote, useEvento } from "@/context/EventoContext";
import { Plus, CheckCircle2, Ticket } from "lucide-react";
import { cn } from "@/lib/utils";

interface AddLoteDialogProps {
  onAdd: (lote: IngressoLote) => void;
  onEdit: (lote: IngressoLote, index: number) => void;
  open: boolean;
  setOpen: (bool: boolean) => void;
  editingIndex: number | null;
}

const inputCls = cn(
  "h-12 px-4 text-[14px] rounded-xl border-gray-200 bg-white",
  "hover:border-gray-300 transition-all duration-150",
  "focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary",
  "placeholder:text-gray-400"
);

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-[12px] font-semibold text-gray-700 mb-1.5 tracking-wide uppercase">
      {children}{required && <span className="text-destructive ml-0.5">*</span>}
    </label>
  );
}

export function AddLoteDialog({ onAdd, onEdit, setOpen, open, editingIndex }: AddLoteDialogProps) {
  const { lotes } = useEvento();

  const [lote, setLote] = useState<IngressoLote>({
    nome: "", valor: 0, quantidade: 0, tipo: 1,
    disponivelParaVenda: true, dataLimite: "", lote: 1,
  });

  useEffect(() => {
    if (typeof editingIndex === "number") {
      setOpen(true);
      const find = lotes.find((_, i) => i === editingIndex);
      if (find) setLote(find);
    }
  }, [editingIndex]);

  const isGratuito = lote.tipo === 0;
  const isEditing = typeof editingIndex === "number";

  const handleConfirm = () => {
    if (!lote.nome || !lote.quantidade || (!isGratuito && !lote.valor)) {
      alert("Preencha todos os campos obrigatórios");
      return;
    }
    if (isEditing) {
      onEdit(lote, editingIndex as number);
    } else {
      onAdd(lote);
    }
    setLote({ nome: "", valor: 0, quantidade: 0, tipo: 1, disponivelParaVenda: true, dataLimite: "", lote: 1 });
  };

  return (
    <Dialog open={open} onOpenChange={(val) => setOpen(val)}>
      <DialogTrigger asChild>
        <Button
          onClick={() => setOpen(true)}
          variant="outline"
          className={cn(
            "w-full h-11 gap-2 rounded-xl border-dashed text-[13px] font-medium",
            "border-primary/40 text-primary bg-transparent",
            "hover:bg-primary/5 hover:border-primary hover:shadow-sm",
            "active:scale-[0.98] transition-all duration-150"
          )}
        >
          <Plus className="w-4 h-4" />
          Adicionar lote de ingressos
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[480px] p-0 gap-0 overflow-hidden rounded-2xl border-gray-200/80 shadow-[0_8px_40px_-8px_rgb(0_0_0/0.16),_0_4px_16px_-4px_rgb(0_0_0/0.08)]">
        {/* Accent strip */}
        <div className="h-[3px] bg-gradient-to-r from-primary via-primary/80 to-primary/30" />

        {/* Modal header */}
        <DialogHeader className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-primary/[0.04] to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-sm">
              <Ticket className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-[14px] font-semibold text-gray-900">
                {isEditing ? "Editar Lote" : "Novo Lote de Ingressos"}
              </DialogTitle>
              <p className="text-[11px] text-gray-500 mt-0.5">
                {isEditing ? "Altere as configurações do lote" : "Configure tipo, preço e disponibilidade"}
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Modal body */}
        <div className="px-6 py-5 space-y-4">
          {/* Nome */}
          <div>
            <FieldLabel required>Nome do Lote</FieldLabel>
            <Input
              value={lote.nome}
              onChange={(e) => setLote({ ...lote, nome: e.target.value })}
              placeholder="Ex: 1º Lote, Early Bird, VIP..."
              className={inputCls}
            />
          </div>

          {/* Tipo */}
          <div>
            <FieldLabel required>Tipo de Ingresso</FieldLabel>
            <Select
              value={String(lote.tipo)}
              onValueChange={(val) =>
                setLote((prev) => ({ ...prev, tipo: Number(val) as IngressoLote["tipo"] }))
              }
            >
              <SelectTrigger className={cn(inputCls, "w-full")}>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-gray-200 shadow-lg">
                <SelectItem value="0">Gratuito</SelectItem>
                <SelectItem value="1">Pago</SelectItem>
                <SelectItem value="2">Inteira</SelectItem>
                <SelectItem value="3">Meia Entrada</SelectItem>
                <SelectItem value="4">VIP</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Preço — somente se não for gratuito */}
          {!isGratuito && (
            <div>
              <FieldLabel required>Preço unitário</FieldLabel>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[13px] text-gray-400 font-medium pointer-events-none">
                  R$
                </span>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={lote.valor}
                  onChange={(e) => setLote((prev) => ({ ...prev, valor: Number(e.target.value) }))}
                  className={cn(inputCls, "pl-10")}
                />
              </div>
            </div>
          )}

          {/* Quantidade + Data */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel required>Quantidade</FieldLabel>
              <Input
                type="number"
                min={1}
                value={lote.quantidade}
                onChange={(e) => setLote((prev) => ({ ...prev, quantidade: Number(e.target.value) }))}
                className={inputCls}
              />
            </div>
            <div>
              <FieldLabel>Data limite</FieldLabel>
              <Input
                type="date"
                value={lote.dataLimite}
                onChange={(e) => setLote((prev) => ({ ...prev, dataLimite: e.target.value }))}
                className={inputCls}
              />
            </div>
          </div>

          {/* Disponível para venda */}
          <div className={cn(
            "flex items-center justify-between rounded-xl border px-4 py-3 transition-all duration-200",
            lote.disponivelParaVenda
              ? "border-primary/25 bg-primary/5"
              : "border-gray-200 bg-gray-50/60"
          )}>
            <div>
              <p className="text-[13px] font-semibold text-gray-800">Disponível para venda</p>
              <p className="text-[11px] text-gray-500 mt-0.5">
                {lote.disponivelParaVenda
                  ? "Ingressos visíveis para compra agora"
                  : "Lote pausado — não aparece para compradores"}
              </p>
            </div>
            <Switch
              checked={lote.disponivelParaVenda}
              onCheckedChange={(val) => setLote((prev) => ({ ...prev, disponivelParaVenda: val }))}
            />
          </div>
        </div>

        {/* Modal footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/40">
          <Button
            onClick={handleConfirm}
            className={cn(
              "w-full h-11 gap-2 rounded-xl text-[13px] font-semibold",
              "bg-primary text-white shadow-sm",
              "hover:bg-primary/90 hover:shadow-[0_6px_20px_-4px_oklch(0.606_0.25_292.717/0.5)]",
              "active:scale-[0.98] transition-all duration-150"
            )}
          >
            <CheckCircle2 className="w-4 h-4" />
            {isEditing ? "Salvar alterações" : "Confirmar lote"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
