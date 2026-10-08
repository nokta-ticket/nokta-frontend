import { EventoAPI } from "@/interfaces/events";
import React from "react";

import Image from "next/image";
import Link from "next/link";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { formatarDataCurta, formatarHorario } from "@/lib/formatarData";
import { MEDIA_FALLBACK, resolveThumbnailUrl } from "@/lib/media";
import { Calendar, Heart } from "lucide-react";

interface Props {
  event: EventoAPI;
  toggleFavorite?: (id: string, favorite: boolean) => void;
}

// Mesmo critério de "Última chamada" do mobile (event-grid.tsx).
const ULTIMA_CHAMADA_PERCENT = 80;

export default function EventCard({ event, toggleFavorite }: Props) {
  const horarioFmt = formatarHorario(event.horario);
  const cover = resolveThumbnailUrl(event.thumbnails[0], MEDIA_FALLBACK);
  const isFavorite = event.isFavorite ?? event.favorito ?? false;
  const href = `/evento/${event.slug ?? event.id}`;
  const acabando =
    event.ultimoLote === true || (event.percentualVendido ?? 0) >= ULTIMA_CHAMADA_PERCENT;

  return (
    <Card
      key={event.id}
      // No desktop o card inteiro é clicável (link "esticado" no título) e
      // ocupa a coluna da grade; no celular mantém o limite de 400px de antes.
      className="group relative flex w-full max-w-[400px] flex-col overflow-hidden pt-0 lg:max-w-none lg:transition-[transform,box-shadow] lg:duration-200 lg:ease-[cubic-bezier(0.23,1,0.32,1)] lg:hover:-translate-y-1 lg:hover:shadow-[0_18px_40px_-18px_rgba(91,33,182,0.35)] lg:focus-within:ring-2 lg:focus-within:ring-violet-600 lg:focus-within:ring-offset-2"
    >
      <AspectRatio ratio={16 / 9} className="relative overflow-hidden">
        <Image
          src={cover ?? MEDIA_FALLBACK}
          alt=""
          fill
          sizes="(max-width:768px)100vw,(max-width:1800px)33vw,520px"
          className="object-cover lg:transition-transform lg:duration-300 lg:ease-out lg:group-hover:scale-[1.03]"
          loading="lazy"
          unoptimized
        />

        {acabando && (
          <span className="absolute left-0 top-0 z-[1] hidden rounded-br-lg bg-orange-600 px-2 py-1 text-[11px] font-bold leading-tight text-white lg:block">
            Tá acabando
          </span>
        )}

        <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-md bg-white/90 px-2 py-1 text-xs font-semibold text-black backdrop-blur-sm">
          <Calendar className="h-3.5 w-3.5" />
          {formatarDataCurta(event.data)}
          {horarioFmt && <> · {horarioFmt}</>}
        </div>

        {typeof toggleFavorite === "function" && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              toggleFavorite(event.id, !isFavorite);
            }}
            aria-label="Favoritar evento"
            className="absolute right-2 top-2 z-[2] rounded-full bg-white/80 p-1 transition hover:scale-110 backdrop-blur-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
          >
            <Heart
              className="h-5 w-5"
              fill={isFavorite ? "#ef4444" : "none"}
              stroke={isFavorite ? "#ef4444" : "currentColor"}
            />
          </button>
        )}
      </AspectRatio>

      <CardContent className="px-4 pt-3">
        <h3 className="line-clamp-2 text-base font-semibold leading-tight lg:text-lg">
          <Link
            href={href}
            className="outline-none lg:after:absolute lg:after:inset-0 lg:after:content-['']"
          >
            {event.nome}
          </Link>
        </h3>
        <p className="mt-1 truncate text-sm text-muted-foreground">
          {event.endereco?.logradouro}, {event.endereco?.localidade} -{" "}
          {event.endereco?.uf}
        </p>
      </CardContent>

      <CardFooter className="mt-auto px-4 pb-4">
        <Link
          href={href}
          className="relative z-[2] inline-flex h-9 w-full items-center justify-center rounded-md border border-violet-700 text-sm font-medium text-violet-700 transition-colors duration-150 hover:bg-violet-700 hover:text-white active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 lg:group-hover:bg-violet-700 lg:group-hover:text-white"
        >
          Ver ingressos
        </Link>
      </CardFooter>
    </Card>
  );
}
