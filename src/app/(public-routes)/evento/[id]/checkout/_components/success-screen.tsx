"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import type { EventDetails } from "@/interfaces/events";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon, type IconName } from "@/components/ui/icon";
import { cn } from "@/lib/cn";
import { fireBrandConfetti } from "@/lib/confetti";
import { getEventStartAt } from "@/lib/event-sales";
import { cityLabel, formatBRL, formatDateBR, formatEventDateTime } from "@/lib/format";
import { MEDIA_FALLBACK, resolveThumbnailUrl } from "@/lib/media";
import { isGratis, type Ticket } from "./checkout-types";

function QuickAction({ icon, label, onClick }: { icon: IconName; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="press flex min-h-[72px] flex-col items-center justify-center gap-1.5 rounded-card border border-border bg-surface p-3 text-caption font-semibold text-foreground shadow-card transition-colors hover:bg-surface-2">
      <Icon name={icon} size={18} className="text-brand" />
      {label}
    </button>
  );
}

/**
 * Pedido confirmado: confete, ingressos resumidos e o caminho pra "Meus
 * ingressos". Agenda (.ics) e mapa continuam como atalhos.
 */
export function SuccessScreen({ evento, items, total, isFree }: { evento: EventDetails; items: { ticket: Ticket; qty: number }[]; total: number; isFree: boolean }) {
  const cover = resolveThumbnailUrl(evento.thumbnails?.[0], MEDIA_FALLBACK) ?? MEDIA_FALLBACK;
  const place = [evento.local, cityLabel(evento.endereco)].filter(Boolean).join(" — ");

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    fireBrandConfetti();
  }, []);

  const openMap = () => {
    const e = evento.endereco;
    const query = e?.localidade ? `${e.logradouro}, ${e.numero}, ${e.localidade}, ${e.uf}` : evento.nome;
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, "_blank", "noopener");
  };

  const downloadCalendar = () => {
    // Horário de Brasília, aceitando "HH:mm" ou ISO (antes, ISO virava data inválida).
    const start = getEventStartAt(evento);
    if (!start) return;
    const end = new Date(start.getTime() + 3 * 60 * 60 * 1000);
    const pad = (n: number) => String(n).padStart(2, "0");
    const fmt = (d: Date) => `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
    const e = evento.endereco;
    const addr = e?.localidade ? `${e.logradouro}, ${e.numero} - ${e.localidade}/${e.uf}` : "";
    const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "BEGIN:VEVENT", `SUMMARY:${evento.nome}`, `DTSTART:${fmt(start)}`, `DTEND:${fmt(end)}`, `LOCATION:${addr}`, "END:VEVENT", "END:VCALENDAR"].join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    a.download = `${evento.nome.replace(/\s+/g, "_")}.ics`;
    a.click();
  };

  return (
    <div className="mx-auto max-w-lg px-4 pb-16 pt-10 lg:pt-16">
      <div className="slide-up text-center">
        <div className="pulse-ring mx-auto flex size-16 items-center justify-center rounded-full bg-success-bg text-success [--pulse-color:var(--success)]">
          <Icon name="check" size={26} />
        </div>
        <h1 className="mt-5 font-display text-[2.25rem] uppercase leading-none text-foreground">Pedido confirmado!</h1>
        <p className="mt-3 text-body text-muted-foreground">Seus ingressos já estão na sua conta. É só mostrar o QR Code na entrada.</p>
      </div>

      <Card accent className="slide-up mt-8 overflow-hidden [--i:1]">
        <div className="relative aspect-video w-full bg-surface-2">
          <Image src={cover} alt="" fill sizes="(max-width:640px) 100vw, 512px" unoptimized className="object-cover" />
        </div>
        <div className="p-4 sm:p-5">
          <h2 className="text-lg font-semibold leading-snug text-foreground">{evento.nome}</h2>
          <p className="mt-1 text-sm font-semibold text-brand">{formatEventDateTime(evento.data, evento.horario)}</p>
          {place ? <p className="text-caption text-muted-foreground">{place}</p> : null}
        </div>
      </Card>

      <ul className="slide-up mt-4 space-y-2.5 [--i:2]">
        {items.map(({ ticket, qty }) => (
          <li key={ticket.id} className="flex items-center gap-3.5 rounded-card border border-border bg-surface p-4 shadow-card">
            <Icon name={isGratis(ticket.valor) ? "gift" : "ticket"} size={18} className="shrink-0 text-brand" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">
                {qty}× {ticket.nome}
              </p>
              <p className="text-caption text-muted-foreground">
                {[/lote/i.test(ticket.nome) ? null : `${ticket.lote}º lote`, ticket.dataLimite ? `válido até ${formatDateBR(ticket.dataLimite)}` : null].filter(Boolean).join(" · ") || "Ingresso"}
              </p>
            </div>
            <p className={cn("shrink-0 text-sm font-semibold tnum", isGratis(ticket.valor) ? "text-success" : "text-foreground")}>{isGratis(ticket.valor) ? "Grátis" : formatBRL(Number(ticket.valor) * qty)}</p>
          </li>
        ))}
        <li className="flex items-center justify-between px-1 pt-1 text-sm font-semibold">
          <span className="text-muted-foreground">Total pago</span>
          <span className={cn("tnum", isFree ? "text-success" : "text-foreground")}>{isFree ? "Grátis" : formatBRL(total)}</span>
        </li>
      </ul>

      <div className="slide-up mt-5 grid grid-cols-3 gap-2.5 [--i:3]">
        <QuickAction icon="calendar-plus" label="Agenda" onClick={downloadCalendar} />
        <QuickAction icon="map-location" label="Mapa" onClick={openMap} />
        <QuickAction icon="print" label="Imprimir" onClick={() => window.print()} />
      </div>

      <div className="slide-up mt-6 space-y-2 [--i:4]">
        <Button asChild size="full">
          <Link href="/meus-ingressos">
            <Icon name="ticket" size={16} />
            Ver meus ingressos
          </Link>
        </Button>
        <Button asChild variant="ghost" size="full">
          <Link href="/eventos">Explorar mais eventos</Link>
        </Button>
      </div>
    </div>
  );
}
