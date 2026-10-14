import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { formatBRL, formatEventDate, formatTime } from "@/lib/format";
import { resaleCover, resaleDiscountPercent, resalePrice, resaleTicketLabel, type ResaleItem } from "../_lib/resale";

/**
 * Linha de anúncio (estilo "Buscar"): miniatura 16:9, evento, data em rosa,
 * lote — e o preço do comprador em destaque com o original riscado.
 */
export function ResaleRow({ resale, className, style }: { resale: ResaleItem; className?: string; style?: React.CSSProperties }) {
  const price = resalePrice(resale);
  const discount = resaleDiscountPercent(resale);
  const time = formatTime(resale.evento?.horario);
  return (
    <Link href={`/revenda/${resale.id}`} className={cn("press group flex items-center gap-3.5 rounded-card bg-surface p-2.5 shadow-card transition-colors hover:bg-surface-2", className)} style={style}>
      <div className="relative aspect-video w-[108px] shrink-0 overflow-hidden rounded-xl bg-surface-2">
        <Image src={resaleCover(resale)} alt="" fill sizes="108px" unoptimized className="object-cover transition-transform duration-500 ease-out-soft group-hover:scale-[1.04]" />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="line-clamp-1 text-[15px] font-semibold leading-snug text-foreground">{resale.evento?.nome ?? "Evento"}</h3>
        <p className="mt-0.5 text-caption font-semibold text-brand">
          {formatEventDate(resale.evento?.data)}
          {time ? ` · ${time}` : ""}
        </p>
        <p className="truncate text-caption text-muted-foreground">{resaleTicketLabel(resale)}</p>
      </div>
      <div className="shrink-0 pr-1 text-right">
        <p className="text-[15px] font-bold text-foreground tnum">{formatBRL(price)}</p>
        {discount > 0 ? (
          <>
            <p className="text-caption text-subtle-foreground tnum line-through">{formatBRL(Number(resale.originalPrice))}</p>
            <p className="text-caption font-semibold text-success tnum">−{discount}%</p>
          </>
        ) : (
          <p className="text-caption text-subtle-foreground">preço original</p>
        )}
      </div>
    </Link>
  );
}
