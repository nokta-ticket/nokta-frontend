"use client";

import { forwardRef } from "react";
import QRCode from "react-qr-code";
import { formatBRL, formatDateBR, formatTime } from "@/lib/format";
import { TIPO_LABELS, ticketStatusMeta, type TicketDetail } from "../../_lib/tickets";

/**
 * Versão imprimível do ingresso, capturada pelo html-to-image (PNG/PDF/
 * compartilhar). Fica fora da tela (`fixed`, opacidade 0) e é revelada só
 * durante a captura. Tudo com fundo sólido e QR em painel branco — sem
 * imagem do evento (host externo sem CORS quebraria a captura).
 */
export const TicketExportCard = forwardRef<
  HTMLDivElement,
  {
    item: TicketDetail;
    code: string;
    holderName?: string | null;
    holderCpf?: string | null;
  }
>(function TicketExportCard({ item, code, holderName, holderCpf }, ref) {
  const ev = item.event;
  const tk = item.ticket;
  const status = ticketStatusMeta(item.status);
  const time = formatTime(ev?.horario);
  const isFree = tk.valor === 0;

  return (
    <div ref={ref} aria-hidden style={{ position: "fixed", top: 0, left: 0, opacity: 0, pointerEvents: "none", zIndex: -1, width: 400 }} className="overflow-hidden rounded-[20px] bg-background font-sans text-foreground shadow-3">
      <div className="h-1.5 w-full bg-brand" />

      <div className="px-6 pb-5 pt-6">
        <p className="text-micro font-bold uppercase tracking-[0.2em] text-brand">Nokta Tickets</p>
        <p className="mt-2 font-display text-[1.75rem] uppercase leading-[0.95] text-foreground">{ev?.nome ?? "Evento"}</p>
        <p className="mt-2 text-sm font-semibold text-brand">
          {formatDateBR(ev?.data)}
          {time ? ` · ${time}` : ""}
        </p>
        {ev?.endereco ? (
          <p className="mt-0.5 text-caption text-muted-foreground">
            {ev.local ? `${ev.local} · ` : ""}
            {ev.endereco.localidade}/{ev.endereco.uf}
          </p>
        ) : null}
      </div>

      <div className="ticket-notch relative h-7 bg-background">
        <div className="ticket-perforation absolute inset-x-7 top-1/2" />
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-3 px-6 pb-5">
        <div>
          <p className="text-micro uppercase tracking-wider text-subtle-foreground">Ingresso</p>
          <p className="text-sm font-semibold text-foreground">{tk.nome}</p>
        </div>
        <div>
          <p className="text-micro uppercase tracking-wider text-subtle-foreground">Lote · Tipo</p>
          <p className="text-sm font-semibold text-foreground">
            {tk.lote}º · {TIPO_LABELS[tk.tipo] ?? "Ingresso"}
          </p>
        </div>
        <div>
          <p className="text-micro uppercase tracking-wider text-subtle-foreground">Titular</p>
          <p className="text-sm font-semibold text-foreground">{holderName || "—"}</p>
        </div>
        <div>
          <p className="text-micro uppercase tracking-wider text-subtle-foreground">CPF</p>
          <p className="tnum text-sm font-semibold text-foreground">{holderCpf ? holderCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4") : "—"}</p>
        </div>
        <div>
          <p className="text-micro uppercase tracking-wider text-subtle-foreground">Valor</p>
          <p className="tnum text-sm font-semibold text-foreground">{isFree ? "Grátis" : formatBRL(tk.valor)}</p>
        </div>
        <div>
          <p className="text-micro uppercase tracking-wider text-subtle-foreground">Status</p>
          <p className="text-sm font-semibold text-foreground">{status.label}</p>
        </div>
      </div>

      <div className="px-6 pb-6">
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-white p-4">
          <QRCode value={code} size={160} />
          <p className="font-mono text-caption font-bold tracking-[0.15em] text-black">{code}</p>
        </div>
        <p className="mt-3 text-center text-caption text-muted-foreground">Apresente na entrada · Ingresso pessoal</p>
      </div>

      <div className="flex items-center justify-between bg-surface px-6 py-3">
        <span className="text-micro font-bold uppercase tracking-[0.15em] text-brand">Nokta Tickets</span>
        <span className="text-micro text-subtle-foreground">noktatickets.com.br</span>
      </div>
    </div>
  );
});
