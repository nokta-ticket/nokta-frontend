import Image from "next/image";
import type { EventDetails } from "@/interfaces/events";
import { Card } from "@/components/ui/card";
import { cityLabel, formatEventDateTime } from "@/lib/format";
import { MEDIA_FALLBACK, resolveThumbnailUrl } from "@/lib/media";

/** O que está sendo comprado: banner pequeno (16:9, nunca cortado em quadrado) + nome + data. */
export function EventHeaderCard({ evento }: { evento: EventDetails }) {
  const cover = resolveThumbnailUrl(evento.thumbnails?.[0], MEDIA_FALLBACK) ?? MEDIA_FALLBACK;
  const place = [evento.local, cityLabel(evento.endereco)].filter(Boolean).join(" — ");
  return (
    <Card className="flex-row items-center gap-3.5 p-3">
      <div className="relative aspect-video w-[132px] shrink-0 overflow-hidden rounded-xl bg-surface-2">
        <Image src={cover} alt="" fill sizes="132px" unoptimized className="object-cover" />
      </div>
      <div className="min-w-0 flex-1 py-0.5">
        <h2 className="line-clamp-2 text-[15px] font-semibold leading-snug text-foreground">{evento.nome}</h2>
        <p className="mt-0.5 text-caption font-semibold text-brand">{formatEventDateTime(evento.data, evento.horario)}</p>
        {place ? <p className="truncate text-caption text-muted-foreground">{place}</p> : null}
      </div>
    </Card>
  );
}
