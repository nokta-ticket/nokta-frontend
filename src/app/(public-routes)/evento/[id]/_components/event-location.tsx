"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import type { Address } from "@/interfaces/address";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Icon, type IconName } from "@/components/ui/icon";
import { Skeleton } from "@/components/ui/skeleton";
import { addressCity, addressLine } from "./event-pricing";

const MAP_HEIGHT = 200;

const EventMap = dynamic(() => import("@/components/EventMap").then((m) => m.EventMap), {
  ssr: false,
  loading: () => <Skeleton className="w-full rounded-none" style={{ height: MAP_HEIGHT }} />,
});

const ROUTE_APPS: { label: string; icon: IconName; href: (dest: string) => string }[] = [
  { label: "Google Maps", icon: "map-location", href: (d) => `https://www.google.com/maps/dir/?api=1&destination=${d}` },
  { label: "Waze", icon: "waze", href: (d) => `https://waze.com/ul?q=${d}` },
  { label: "Uber", icon: "uber", href: (d) => `https://m.uber.com/ul/?action=setPickup&dropoff[formatted_address]=${d}` },
  { label: "99", icon: "car", href: () => "https://99app.com" },
];

/**
 * Local do evento: mapa (clique abre "como chegar"), endereço e botão de
 * rota. O wrapper `isolate` segura os z-index internos do Leaflet (até
 * 1000) pra eles não brigarem com a barra fixa de compra.
 */
export function EventLocation({ local, addr }: { local?: string | null; addr: Address }) {
  const [routeOpen, setRouteOpen] = useState(false);
  const destination = encodeURIComponent([addr.logradouro, addr.numero, addr.localidade, addr.uf].filter(Boolean).join(", "));
  const line1 = addressLine(addr);
  const line2 = addressCity(addr);

  return (
    <>
      <Card className="overflow-hidden">
        <div className="relative isolate cursor-pointer" onClick={() => setRouteOpen(true)}>
          <EventMap height={MAP_HEIGHT} address={`${addr.logradouro}, ${addr.numero}, ${addr.bairro ?? ""}, ${addr.localidade}, ${addr.uf}`} />
          {/* captura o clique no mapa sem cobrir os botões de zoom */}
          <div className="absolute inset-0 z-[998]" style={{ right: 48 }} aria-hidden />
        </div>
        <div className="flex items-center justify-between gap-3 px-4 py-3.5">
          <div className="min-w-0">
            {local ? <p className="truncate text-[15px] font-semibold text-foreground">{local}</p> : null}
            <p className="truncate text-sm text-muted-foreground">{line1}</p>
            {line2 ? <p className="truncate text-caption text-subtle-foreground">{line2}</p> : null}
          </div>
          <Button variant="secondary" size="sm" shape="pill" leftIcon="location-arrow" onClick={() => setRouteOpen(true)} className="shrink-0">
            Como chegar
          </Button>
        </div>
      </Card>

      <Dialog open={routeOpen} onOpenChange={setRouteOpen}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>Como você vai chegar?</DialogTitle>
            <DialogDescription>
              {line1}
              {line2 ? ` · ${line2}` : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="gap-2 pt-1">
            {ROUTE_APPS.map((app) => (
              <a key={app.label} href={app.href(destination)} target="_blank" rel="noreferrer" className="press flex h-12 items-center gap-3 rounded-xl border border-border bg-surface-2 px-4 text-sm font-semibold text-foreground transition-colors hover:bg-surface-3">
                <Icon name={app.icon} size={16} fw className="text-muted-foreground" />
                <span className="flex-1">{app.label}</span>
                <Icon name="external" size={12} className="text-subtle-foreground" />
              </a>
            ))}
          </DialogBody>
        </DialogContent>
      </Dialog>
    </>
  );
}
