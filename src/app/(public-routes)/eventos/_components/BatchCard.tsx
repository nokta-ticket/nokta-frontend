import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Calendar, Ticket } from "lucide-react";
import { cn } from "@/lib/utils";
import { IngressoLote } from "@/context/EventoContext";

interface BatchCardProps {
  batch: IngressoLote;
  onEdit: () => void;
  onDelete: () => void;
}

const TIPO_LABEL: Record<number, string> = {
  0: "Gratuito",
  1: "Pago",
  2: "Inteira",
  3: "Meia Entrada",
  4: "VIP",
};

export const BatchCard = ({ batch, onEdit, onDelete }: BatchCardProps) => {
  const soldPercentage = batch.sold != null
    ? Math.min(100, (batch.sold / batch.quantidade) * 100)
    : null;

  const isGratuito = batch.tipo === 0;

  return (
    <div className={cn(
      "rounded-xl border bg-white px-5 py-4 transition-all duration-200",
      "hover:shadow-[0_4px_16px_-4px_rgb(0_0_0/0.10)] hover:-translate-y-[1px]",
      "border-l-[3px] border-l-primary border-t-gray-200/80 border-r-gray-200/80 border-b-gray-200/80"
    )}>
      <div className="flex items-start justify-between gap-3">
        {/* Info principal */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <h3 className="text-[14px] font-bold text-gray-900 truncate">{batch.nome}</h3>
            <Badge
              variant="secondary"
              className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border-0 font-semibold"
            >
              {TIPO_LABEL[batch.tipo] ?? "—"}
            </Badge>
            <Badge
              variant="secondary"
              className={cn(
                "text-[10px] px-2 py-0.5 rounded-full border-0 font-semibold",
                batch.disponivelParaVenda
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-gray-100 text-gray-500"
              )}
            >
              {batch.disponivelParaVenda ? "À venda" : "Pausado"}
            </Badge>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            {/* Preço */}
            <span className="text-[20px] font-bold text-gray-900">
              {isGratuito ? "Gratuito" : `R$ ${Number(batch.valor).toFixed(2)}`}
            </span>

            {/* Data limite */}
            {batch.dataLimite && (
              <span className="flex items-center gap-1 text-[12px] text-gray-400">
                <Calendar className="w-3.5 h-3.5" />
                até {new Date(batch.dataLimite + "T00:00:00").toLocaleDateString("pt-BR")}
              </span>
            )}

            {/* Quantidade */}
            <span className="flex items-center gap-1 text-[12px] text-gray-400">
              <Ticket className="w-3.5 h-3.5" />
              {batch.quantidade} ingressos
            </span>
          </div>

          {/* Barra de progresso (apenas quando sold disponível) */}
          {soldPercentage !== null && (
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-gray-400">
                  {batch.sold} vendidos de {batch.quantidade}
                </span>
                <span className="text-[11px] font-semibold text-primary">
                  {soldPercentage.toFixed(0)}%
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div
                  className="h-1.5 rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${soldPercentage}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Ações */}
        <div className="flex gap-1.5 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={onEdit}
            className="w-8 h-8 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/10 transition-all"
          >
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            className="w-8 h-8 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
};
