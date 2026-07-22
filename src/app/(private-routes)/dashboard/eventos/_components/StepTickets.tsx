"use client";

import { useState, useMemo } from "react";
import { AddLoteDialog } from "./AddLoteDialog";
import { IngressoLote, useEvento } from "@/context/EventoContext";
import { Button } from "@/components/ui/button";
import { BatchCard } from "@/app/(public-routes)/eventos/_components/BatchCard";
import { Ticket, ArrowLeft, ArrowRight, TicketX, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  nextTab: () => void;
  prevTab: () => void;
}

function CardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-200/80 bg-white overflow-hidden shadow-[0_4px_24px_-6px_rgb(0_0_0/0.10),_0_2px_8px_-3px_rgb(0_0_0/0.06)]">
      <div className="h-[3px] bg-gradient-to-r from-primary via-primary/80 to-primary/30" />
      {children}
    </div>
  );
}

export default function StepTickets({ nextTab, prevTab }: Props) {
  const [open, setOpen] = useState(false);
  const [lotesState, setLotesState] = useState<IngressoLote[]>([]);
  const { setLotes, setData, lotes } = useEvento();
  const [editingLoteIndex, setEditingLoteIndex] = useState<number | null>(null);

  const totalIngressos = useMemo(
    () => lotes.reduce((acc, lote) => acc + Number(lote.quantidade || 0), 0),
    [lotes]
  );

  const addLote = (lote: IngressoLote) => {
    const novosLotes = [...lotes, lote];
    const lotesFormatados = novosLotes.map((l) => ({
      tipo: l.tipo, lote: 1,
      quantidade: Number(l.quantidade),
      valor: l.tipo === 0 ? 0 : Number(l.valor),
      dataLimite: l.dataLimite,
      disponivelParaVenda: l.disponivelParaVenda,
      nome: l.nome,
    }));
    setLotes(lotesFormatados);
    const primeiro = lotesFormatados[0];
    if (primeiro) setData({ tipoIngresso: primeiro.tipo === 0 ? 0 : 1 });
  };

  function updateLote(ticket: IngressoLote, index: number) {
    const tickets = lotes.map((el, i) => (i === index ? ticket : el));
    setEditingLoteIndex(null);
    setLotes(tickets);
  }

  const editLote = (index: number) => {
    setEditingLoteIndex(index);
    setOpen(true);
  };

  const removeLote = (index: number) => {
    const atualizados = lotesState.filter((_, i) => i !== index);
    setLotesState(atualizados);
    const lotesFormatados = atualizados.map((l) => ({
      tipo: l.tipo, lote: 1,
      quantidade: Number(l.quantidade),
      valor: l.tipo === 0 ? 0 : Number(l.valor),
      dataLimite: l.dataLimite,
      disponivelParaVenda: l.disponivelParaVenda,
      nome: l.nome,
    }));
    setLotes(lotesFormatados);
    const primeiro = lotesFormatados[0];
    if (primeiro) setData({ tipoIngresso: primeiro.tipo === 0 ? 0 : 1 });
  };

  const openDialog = () => {
    setEditingLoteIndex(null);
    setOpen(true);
  };

  return (
    <CardShell>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-primary/[0.04] to-transparent flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-sm">
            <Ticket className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <h2 className="text-[14px] font-semibold text-gray-900">Ingressos e Lotes</h2>
            <p className="text-[11px] text-gray-500 mt-0.5">Configure os lotes de ingressos do evento</p>
          </div>
        </div>

        {/* Total badge */}
        {lotes.length > 0 && (
          <div className="flex items-center gap-2 rounded-xl bg-primary/[0.08] border border-primary/20 px-3 py-1.5">
            <Ticket className="w-3.5 h-3.5 text-primary" />
            <span className="text-[13px] font-bold text-primary">{totalIngressos}</span>
            <span className="text-[11px] text-primary/60 hidden sm:inline">ingressos</span>
          </div>
        )}
      </div>

      <div className="p-6">
        {lotes.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/40">
            <div className="relative mb-5">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
                <TicketX className="w-7 h-7 text-gray-400" />
              </div>
              <div className="absolute -right-1 -bottom-1 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                <Plus className="w-3.5 h-3.5 text-primary" />
              </div>
            </div>
            <p className="text-[14px] font-semibold text-gray-800 mb-1">Nenhum lote adicionado</p>
            <p className="text-[12px] text-gray-500 mb-6 max-w-[280px] leading-relaxed">
              Crie ao menos um lote de ingressos para que o evento possa ser publicado na plataforma.
            </p>
            <Button
              onClick={openDialog}
              className={cn(
                "h-11 px-6 gap-2 rounded-xl text-[13px] font-semibold",
                "bg-primary text-white shadow-sm",
                "hover:bg-primary/90 hover:shadow-[0_6px_20px_-4px_oklch(0.606_0.25_292.717/0.5)]",
                "active:scale-[0.97] transition-all duration-200"
              )}
            >
              <Plus className="w-4 h-4" />
              Criar primeiro lote
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {lotes.map((l, idx) => (
              <BatchCard
                key={idx}
                batch={l}
                onDelete={() => removeLote(idx)}
                onEdit={() => editLote(idx)}
              />
            ))}
            <div className="pt-1">
              <AddLoteDialog
                onAdd={addLote}
                open={open}
                setOpen={(val) => { if (!val) setEditingLoteIndex(null); setOpen(val); }}
                editingIndex={editingLoteIndex}
                onEdit={updateLote}
              />
            </div>
          </div>
        )}
      </div>

      {/* AddLoteDialog invisível para o empty state abrir programaticamente */}
      {lotes.length === 0 && (
        <div className="hidden">
          <AddLoteDialog
            onAdd={addLote}
            open={open}
            setOpen={(val) => { if (!val) setEditingLoteIndex(null); setOpen(val); }}
            editingIndex={editingLoteIndex}
            onEdit={updateLote}
          />
        </div>
      )}

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/40 flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={prevTab}
          className={cn(
            "h-11 px-5 gap-2 rounded-xl text-[13px] font-medium text-gray-500",
            "hover:text-gray-900 hover:bg-gray-100/70",
            "active:scale-[0.97] transition-all duration-150"
          )}
        >
          <ArrowLeft className="w-4 h-4" /> Etapa anterior
        </Button>
        <Button
          onClick={nextTab}
          className={cn(
            "h-11 px-7 gap-2 rounded-xl text-[13px] font-semibold",
            "bg-primary text-white shadow-sm",
            "hover:bg-primary/90 hover:shadow-[0_6px_20px_-4px_oklch(0.606_0.25_292.717/0.5)]",
            "active:scale-[0.97] transition-all duration-200"
          )}
        >
          Próxima etapa <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </CardShell>
  );
}
