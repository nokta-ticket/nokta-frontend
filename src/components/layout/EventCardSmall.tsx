"use client";

import Link from "next/link";
import Image from "next/image";
import { EventoAPI } from "@/interfaces/events";
import { MEDIA_FALLBACK, resolveThumbnailUrl } from "@/lib/media";
import { formatarDataCurta } from "@/lib/formatarData";

interface Props {
  event: EventoAPI;
}

export default function EventCardSmall({ event }: Props) {
  const cover = resolveThumbnailUrl(event.thumbnails[0], MEDIA_FALLBACK);
  const href = `/eventos/${event.slug ?? event.id}`;

  return (
    <Link href={href} className="flex-none w-[160px] cursor-pointer">
      <div className="relative w-[160px] h-[160px] rounded-xl overflow-hidden bg-gradient-to-br from-[#2a1f4a] to-[#0f0f1a] mb-2.5">
        <Image
          src={cover ?? MEDIA_FALLBACK}
          alt={event.nome}
          fill
          sizes="160px"
          className="object-cover"
          loading="lazy"
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40 pointer-events-none" />
      </div>

      <p className="text-[13px] font-bold uppercase leading-snug text-foreground line-clamp-2 mb-1">
        {event.nome}
      </p>
      <p className="text-[12px] text-muted-foreground truncate mb-1">
        {event.endereco.localidade} — {event.endereco.uf}
      </p>
      <p className="text-[12px] font-semibold text-violet-600">
        {formatarDataCurta(event.data)}
      </p>
    </Link>
  );
}
