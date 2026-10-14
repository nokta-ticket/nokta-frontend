"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Icon, type IconName } from "@/components/ui/icon";
import { StatusBadge } from "@/components/ui/badge";
import { HeaderAction, VenuePublicFooter, VenuePublicHeader } from "@/components/venue-menu/venue-public-header";
import { cn } from "@/lib/cn";
import type { VenueHomePageData } from "@/services/venue-home-public";

/** Ícone por comodidade (catálogo fixo do backend); chave desconhecida cai em "check-circle". */
const AMENITY_ICON: Record<string, IconName> = {
  VALET: "car",
  PARKING: "car",
  PAYMENT_METHODS: "credit-card",
  WIFI: "globe",
  OUTDOOR_AREA: "sun",
  ACCESSIBILITY: "people-group",
  PET_FRIENDLY: "heart",
  LIVE_MUSIC: "music",
  AIR_CONDITIONING: "bolt",
};

/**
 * Home pública do estabelecimento (nokta.live/{orgSlug}) — a porta de
 * entrada pelo Instagram: aberto agora, horários, cardápio, como chegar e
 * comodidades. Mesmo cabeçalho do cardápio e da avaliação.
 */
export function VenueHomeView({ data, orgSlug }: { data: VenueHomePageData; orgSlug: string }) {
  const [schedOpen, setSchedOpen] = useState(false);
  const { profile } = data;
  const addressQuery = profile.address ? encodeURIComponent(profile.address) : null;
  const todayDow = new Date().getDay();

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto w-full max-w-3xl">
        <VenuePublicHeader
          name={data.organizationName}
          logoUrl={profile.logoUrl}
          bannerUrl={profile.bannerUrl}
          actions={
            <>
              <HeaderAction href={profile.instagramUrl || "https://instagram.com"} label="Instagram" icon="instagram" external />
              <HeaderAction href={profile.whatsappNumber ? `https://wa.me/${profile.whatsappNumber.replace(/\D/g, "")}` : "https://wa.me"} label="WhatsApp" icon="whatsapp" external />
              <HeaderAction href={`/avaliacao/${orgSlug}`} label="Avaliar" icon="star" />
              <div className="ml-auto">
                {data.isOpenNow === null ? (
                  <StatusBadge tone="neutral">Horário não informado</StatusBadge>
                ) : (
                  <StatusBadge tone={data.isOpenNow ? "success" : "danger"} pulse={data.isOpenNow}>
                    {data.isOpenNow ? "Aberto agora" : "Fechado agora"}
                  </StatusBadge>
                )}
              </div>
            </>
          }
        />

        <div className="space-y-4 px-4 pt-6 md:px-6">
          <Button asChild variant="contrast" size="full" shape="pill" className="h-14 text-base">
            <a href={`/cardapio/${orgSlug}`}>
              <Icon name="utensils" size={16} />
              Ver o cardápio
            </a>
          </Button>

          <Card className="gap-0">
            {data.weekHours.length > 0 ? (
              <button type="button" onClick={() => setSchedOpen((v) => !v)} aria-expanded={schedOpen} className="press flex w-full items-center gap-3 px-4 py-4 text-left">
                <Icon name="clock" size={16} className="shrink-0 text-brand" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-foreground">Horários</span>
                  <span className="block truncate text-caption text-muted-foreground">{data.todayHoursLabel ? `Hoje · ${data.todayHoursLabel}` : "Hoje sem horário definido"}</span>
                </span>
                <Icon name="chevron-down" size={12} className={cn("shrink-0 text-subtle-foreground transition-transform duration-300 ease-out-soft", schedOpen && "rotate-180")} />
              </button>
            ) : (
              <div className="flex items-center gap-3 px-4 py-4">
                <Icon name="clock" size={16} className="shrink-0 text-subtle-foreground" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-foreground">Horários</span>
                  <span className="block text-caption text-muted-foreground">{data.todayHoursLabel ? `Hoje · ${data.todayHoursLabel}` : "Ainda não informados"}</span>
                </span>
              </div>
            )}
            {schedOpen && data.weekHours.length > 0 ? (
              <ul className="scale-in border-t border-border px-4 py-2">
                {data.weekHours.map((day) => {
                  const today = day.dayOfWeek === todayDow;
                  return (
                    <li key={day.dayOfWeek} className={cn("flex items-center justify-between py-2 text-sm", today ? "font-semibold text-foreground" : "text-muted-foreground")}>
                      <span className="flex items-center gap-2">
                        {day.label}
                        {today ? <span className="text-micro uppercase tracking-[0.08em] text-brand">hoje</span> : null}
                      </span>
                      <span className={cn("tnum", day.hours ? "" : "text-subtle-foreground")}>{day.hours ?? "Fechado"}</span>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </Card>

          {profile.address ? (
            <Card className="gap-0">
              <CardContent className="space-y-4 p-4">
                <div className="flex gap-4">
                  <div className="min-w-0 flex-1">
                    <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <Icon name="map-pin" size={14} className="text-brand" />
                      Como chegar
                    </h2>
                    <p className="mt-2 whitespace-pre-line text-body text-muted-foreground">{profile.address}</p>
                  </div>
                  {/* Embed do Google Maps (modo público, sem chave) — toque abre a rota. */}
                  <a href={`https://www.google.com/maps/dir/?api=1&destination=${addressQuery}`} target="_blank" rel="noopener noreferrer" aria-label="Abrir no Google Maps" className="relative block h-32 w-36 shrink-0 overflow-hidden rounded-xl border border-border bg-surface-2">
                    <iframe title="Mapa de localização" src={`https://www.google.com/maps?q=${addressQuery}&output=embed`} className="pointer-events-none absolute inset-0 h-full w-full" style={{ border: 0 }} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
                  </a>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Button asChild variant="secondary" size="lg" className="h-12">
                    <a href={`https://waze.com/ul?q=${addressQuery}`} target="_blank" rel="noopener noreferrer" aria-label="Abrir no Waze">
                      <Icon name="waze" size={18} />
                      Waze
                    </a>
                  </Button>
                  <Button asChild variant="secondary" size="lg" className="h-12">
                    <a href={`https://m.uber.com/ul/?action=setPickup&dropoff[formatted_address]=${addressQuery}`} target="_blank" rel="noopener noreferrer" aria-label="Pedir Uber">
                      <Icon name="uber" size={18} />
                      Uber
                    </a>
                  </Button>
                  {/* Sem deep-link oficial de endereço na 99 — o Onelink abre o app ou a loja certa. */}
                  <Button asChild variant="secondary" size="lg" className="h-12">
                    <a href="https://99app-pax.onelink.me/qDRG/dcwrjtqm" target="_blank" rel="noopener noreferrer" aria-label="Pedir 99">
                      <Icon name="car" size={16} />
                      99
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}

          <Card className="gap-0">
            <CardContent className="p-4">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Icon name="info" size={14} className="text-brand" />
                Informações úteis
              </h2>
              {data.amenities.length > 0 ? (
                <ul className="mt-2 divide-y divide-border md:grid md:grid-cols-2 md:gap-x-6 md:divide-y-0">
                  {data.amenities.map((item) => (
                    <li key={item.key} className="flex items-start gap-3 py-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-2 text-muted-foreground">
                        <Icon name={AMENITY_ICON[item.key] ?? "check-circle"} size={13} />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-foreground">{item.label}</span>
                        <span className="block text-caption text-muted-foreground">{item.value || "Disponível"}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-caption text-muted-foreground">Nenhuma informação cadastrada ainda.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <VenuePublicFooter instagramUrl={profile.instagramUrl} />
      </div>
    </div>
  );
}
