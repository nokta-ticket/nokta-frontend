"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { Icon } from "@/components/ui/icon";
import { MEDIA_FALLBACK, resolveMediaUrl } from "@/lib/media";

/**
 * PROVISÓRIO (noite do FERVO, 17/10/2026): evento que já começou sai das
 * listas públicas da API, então o FERVO sumiu da home às 18h — com a lista
 * VIP ainda aberta. Este card põe o FERVO de volta no topo da home, levando
 * direto pra lista VIP. Some sozinho à 01:00 de 18/10 (Brasília), ou antes
 * disso se a API disser que a lista não está mais aberta. Apagar depois.
 */
const SLUG = "fervo-house-fervo-music-bar";
const EXPIRA = Date.parse("2026-10-18T04:00:00Z");

type ListaVipResponse = {
  evento: { nome: string; thumbnail: string | null };
  listas: { status: string; ate: string | null }[];
};

export function FervoVipSpotlight() {
  const [data, setData] = useState<ListaVipResponse | null>(null);

  useEffect(() => {
    if (Date.now() >= EXPIRA) return;
    let active = true;
    api
      .get<ListaVipResponse>(`/lista-vip/${SLUG}`)
      .then((res) => {
        if (active) setData(res.data);
      })
      // Falhou: a home segue como está, sem o card.
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  if (!data || Date.now() >= EXPIRA) return null;
  const lista = data.listas.find((l) => l.status === "ABERTA" && (!l.ate || Date.parse(l.ate) > Date.now()));
  if (!lista) return null;

  const cover = resolveMediaUrl(data.evento.thumbnail, null) ?? MEDIA_FALLBACK;
  const ate = lista.ate ? new Date(lista.ate).toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" }) : null;

  return (
    <section aria-label="Lista VIP aberta agora" className="mx-auto mt-4 max-w-7xl px-4 lg:mt-8 lg:px-6">
      <Link
        href={`/vip/${SLUG}`}
        className="press group flex items-center gap-3.5 rounded-card bg-surface p-2.5 shadow-card ring-1 ring-brand/40 transition-colors hover:bg-surface-2 sm:gap-5 sm:p-3.5"
      >
        <div className="relative aspect-video w-[120px] shrink-0 overflow-hidden rounded-xl sm:w-[220px]">
          <Image src={cover} alt="" fill sizes="(max-width: 640px) 120px, 220px" className="object-cover" priority unoptimized />
        </div>
        <div className="min-w-0 flex-1">
          <p className="inline-flex items-center gap-1.5 text-caption font-bold uppercase tracking-wider text-brand">
            <span className="size-1.5 animate-pulse rounded-full bg-brand" />
            Acontecendo agora · Lista VIP aberta
          </p>
          <h2 className="mt-1 truncate text-base font-bold text-foreground sm:text-xl">{data.evento.nome}</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{ate ? `Retire seu VIP até ${ate}` : "Retire seu VIP"}</p>
        </div>
        <span className="btn-lift hidden h-11 shrink-0 items-center gap-2 rounded-pill bg-white px-5 text-sm font-bold text-[#16060f] sm:inline-flex">
          Retirar VIP
          <Icon name="arrow-right" size={14} />
        </span>
        <Icon name="arrow-right" size={16} className="mr-1 shrink-0 text-muted-foreground sm:hidden" />
      </Link>
    </section>
  );
}
