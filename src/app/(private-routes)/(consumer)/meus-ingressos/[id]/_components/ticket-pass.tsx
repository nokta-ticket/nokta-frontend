"use client";

import { useEffect } from "react";
import Image from "next/image";
import QRCode from "react-qr-code";
import { useKeenSlider } from "keen-slider/react";
import { cn } from "@/lib/cn";
import { formatBRL } from "@/lib/format";
import { resolveMediaUrl } from "@/lib/media";
import { Icon } from "@/components/ui/icon";
import { StatusBadge } from "@/components/ui/badge";
import { TIPO_LABELS, ticketDateLabel, ticketStatusMeta, type TicketDetail } from "../../_lib/tickets";

export interface SiblingTicket {
  id: number;
  code: string;
  status: number;
  nome: string;
  tipo: number;
  lote: number;
}

function QrPanel({ code, dimmed }: { code: string; dimmed?: boolean }) {
  return (
    <div className={cn("mx-auto w-full max-w-[260px] rounded-2xl bg-white p-4 transition-opacity", dimmed && "opacity-30")}>
      <QRCode value={code} size={256} viewBox="0 0 256 256" style={{ width: "100%", height: "auto" }} />
    </div>
  );
}

/**
 * O ingresso em si: banner com nome do evento, dados do lote, picote com
 * recorte lateral (`ticket-notch` + `ticket-perforation`) e o QR em painel
 * branco (o leitor precisa de contraste). Com vários ingressos do mesmo
 * evento, o QR vira carrossel (keen-slider) com pontinhos.
 */
export function TicketPass({
  event,
  ticket,
  status,
  siblings,
  activeIdx,
  onActiveIdxChange,
  holderName,
  onCopyCode,
  className,
}: {
  event: TicketDetail["event"];
  ticket: TicketDetail["ticket"];
  status: number;
  siblings: SiblingTicket[];
  activeIdx: number;
  onActiveIdxChange: (idx: number) => void;
  holderName?: string | null;
  onCopyCode: (code: string) => void;
  className?: string;
}) {
  const cover = resolveMediaUrl(event?.thumbnails?.[0]?.path, null);
  const current = siblings[activeIdx] ?? siblings[0];
  const currentStatus = current?.status ?? status;
  const isUsed = currentStatus === 2;
  const meta = ticketStatusMeta(currentStatus);
  const date = ticketDateLabel(event);
  const place = event?.local || (event?.endereco ? `${event.endereco.logradouro}, ${event.endereco.numero} · ${event.endereco.localidade}/${event.endereco.uf}` : null);
  const multi = siblings.length > 1;

  const [sliderRef, instanceRef] = useKeenSlider<HTMLDivElement>({
    slides: { perView: 1, spacing: 12 },
    slideChanged: (s) => onActiveIdxChange(s.track.details.rel),
  });

  useEffect(() => {
    instanceRef.current?.update();
  }, [siblings.length, instanceRef]);

  return (
    <article className={cn("relative overflow-hidden rounded-[24px] bg-surface shadow-card-hover", isUsed && "grayscale", className)}>
      {/* banner */}
      <div className="relative aspect-video overflow-hidden bg-surface-2">
        {cover ? (
          <Image src={cover} alt="" fill priority sizes="(max-width:1024px) 100vw, 420px" className="object-cover" unoptimized />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-subtle-foreground">
            <Icon name="ticket" size={40} />
          </div>
        )}
        <div className="poster-fade absolute inset-0" />
        <div className="absolute left-4 top-4">
          <StatusBadge tone={meta.tone} className="bg-black/45 ring-white/15 backdrop-blur-md">
            {meta.label}
          </StatusBadge>
        </div>
        <div className="absolute inset-x-0 bottom-0 p-5">
          <h1 className="line-clamp-2 font-display text-[1.9rem] uppercase leading-[0.95] text-white drop-shadow">{event?.nome ?? "Evento"}</h1>
        </div>
      </div>

      {/* dados */}
      <div className="px-5 pb-4 pt-4">
        {date ? <p className="text-[15px] font-semibold text-brand">{date}</p> : null}
        {place ? (
          <p className="mt-1 flex items-start gap-1.5 text-sm text-muted-foreground">
            <Icon name="map-pin" size={12} className="mt-1 shrink-0" />
            <span className="line-clamp-2">{place}</span>
          </p>
        ) : null}
        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
          <div className="min-w-0">
            <dt className="text-micro uppercase tracking-wider text-subtle-foreground">Ingresso</dt>
            <dd className="truncate text-sm font-semibold text-foreground">{current?.nome ?? ticket.nome}</dd>
          </div>
          <div className="min-w-0">
            <dt className="text-micro uppercase tracking-wider text-subtle-foreground">Lote · Tipo</dt>
            <dd className="truncate text-sm font-semibold text-foreground">
              {current?.lote ?? ticket.lote}º · {TIPO_LABELS[current?.tipo ?? ticket.tipo] ?? "Ingresso"}
            </dd>
          </div>
          {holderName ? (
            <div className="min-w-0">
              <dt className="text-micro uppercase tracking-wider text-subtle-foreground">Titular</dt>
              <dd className="truncate text-sm font-semibold text-foreground">{holderName}</dd>
            </div>
          ) : null}
          <div className="min-w-0">
            <dt className="text-micro uppercase tracking-wider text-subtle-foreground">Valor</dt>
            <dd className="tnum truncate text-sm font-semibold text-foreground">{ticket.valor === 0 ? "Grátis" : formatBRL(ticket.valor)}</dd>
          </div>
        </dl>
      </div>

      {/* picote */}
      <div className="ticket-notch relative h-7 bg-surface" aria-hidden>
        <div className="ticket-perforation absolute inset-x-7 top-1/2" />
      </div>

      {/* QR */}
      <div className="px-5 pb-6 pt-2">
        {multi ? (
          <>
            <div ref={sliderRef} className="keen-slider">
              {siblings.map((s) => (
                <div key={s.id} className="keen-slider__slide">
                  <QrPanel code={s.code} dimmed={s.status === 2} />
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-center gap-1.5" role="tablist" aria-label="Ingressos deste evento">
              {siblings.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  role="tab"
                  aria-selected={i === activeIdx}
                  aria-label={`Ingresso ${i + 1} de ${siblings.length}`}
                  onClick={() => instanceRef.current?.moveToIdx(i)}
                  className={cn("h-1.5 rounded-full transition-all duration-300 ease-out-soft", i === activeIdx ? "w-5 bg-brand" : "w-1.5 bg-border-strong hover:bg-muted-foreground")}
                />
              ))}
            </div>
            <p className="tnum mt-2 text-center text-micro font-semibold uppercase tracking-wider text-subtle-foreground">
              {activeIdx + 1} / {siblings.length}
            </p>
          </>
        ) : (
          <QrPanel code={current?.code ?? ""} dimmed={isUsed} />
        )}

        {isUsed ? (
          <p className="mt-4 flex items-center justify-center gap-1.5 text-caption text-muted-foreground">
            <Icon name="check-circle" size={12} /> Este ingresso já foi validado na entrada.
          </p>
        ) : (
          <p className="mt-4 text-center text-caption text-muted-foreground">Apresente este QR na entrada.</p>
        )}

        <button type="button" onClick={() => onCopyCode(current?.code ?? "")} className="mx-auto mt-3 flex items-center gap-2 rounded-pill bg-surface-2 px-3.5 py-2 font-mono text-caption tracking-wider text-muted-foreground transition-colors hover:bg-surface-3 hover:text-foreground">
          <Icon name="copy" size={11} />
          {current?.code}
        </button>
      </div>
    </article>
  );
}
