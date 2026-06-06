import { EventoAPI } from "@/interfaces/events";
import React from "react";

import Image from "next/image";
import Link from "next/link";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatarDataCurta } from "@/lib/formatarData";
import { MEDIA_FALLBACK, resolveThumbnailUrl } from "@/lib/media";
import { Calendar, Heart } from "lucide-react";

interface Props {
  event: EventoAPI;
  toggleFavorite?: (id: string, favorite: boolean) => void;
}

export default function EventCard({ event, toggleFavorite }: Props) {
  const horarioFmt = event.horario?.slice(0, 5);
  const cover = resolveThumbnailUrl(event.thumbnails[0], MEDIA_FALLBACK);
  const isFavorite = event.isFavorite ?? event.favorito ?? false;
  return (
    <Card
      key={event.id}
      className="flex w-[400px] flex-col overflow-hidden pt-0 transition-transform duration-300 hover:scale-105 hover:shadow-xl"
    >
      <AspectRatio ratio={16 / 9} className="relative">
        <Image
          src={cover ?? MEDIA_FALLBACK}
          alt={event.nome}
          fill
          sizes="(max-width:768px)100vw,(max-width:1024px)50vw,400px"
          className="object-cover"
          loading="lazy"
          unoptimized
        />

        <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-md bg-white/80 px-2 py-1 text-xs font-semibold text-black backdrop-blur-sm">
          <Calendar className="h-3.5 w-3.5" />
          {formatarDataCurta(event.data)}
          {horarioFmt && <> • {horarioFmt}h</>}
        </div>

        {typeof toggleFavorite === "function" && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(event.id, !isFavorite);
            }}
            aria-label="Favoritar evento"
            className="absolute right-2 top-2 rounded-full bg-white/80 p-1 transition hover:scale-110 backdrop-blur-sm"
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
        <h2 className="text-md font-semibold leading-tight">{event.nome}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {event.endereco?.logradouro}, {event.endereco?.localidade} -{" "}
          {event.endereco?.uf}
        </p>
      </CardContent>

      <CardFooter className="px-4 pb-4">
        <Button
          asChild
          className="w-full border border-violet-500 bg-transparent text-violet-500 transition-colors hover:bg-violet-600 hover:text-white"
        >
          <Link href={`/eventos/${event.slug ?? event.id}`}>Ver Ingressos</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
