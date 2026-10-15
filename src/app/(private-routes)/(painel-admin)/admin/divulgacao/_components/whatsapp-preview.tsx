"use client";

import { Fragment } from "react";
import { Icon } from "@/components/ui/icon";
import type { MessagePreview } from "../_lib/promo";

/** *negrito* do WhatsApp, só para a prévia. */
function renderBold(text: string) {
  return text.split(/(\*[^*\n]+\*)/g).map((part, i) =>
    part.startsWith("*") && part.endsWith("*") && part.length > 2 ? <strong key={i}>{part.slice(1, -1)}</strong> : <Fragment key={i}>{part}</Fragment>,
  );
}

/** Como a mensagem aparece no WhatsApp de quem recebe (nome de exemplo: Maria). */
export function WhatsappPreview({ preview }: { preview: MessagePreview }) {
  return (
    <div className="rounded-2xl bg-[#efeae2] p-3 sm:p-4">
      <div className="max-w-[340px] overflow-hidden rounded-xl bg-white shadow-sm">
        {preview.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview.imageUrl} alt="" className="aspect-[818/355] w-full bg-surface-2 object-cover" />
        ) : (
          <div className="flex aspect-[818/355] w-full items-center justify-center bg-surface-2 text-caption text-muted-foreground">Sem imagem</div>
        )}
        <div className="px-3 pt-2 pb-1.5">
          <p className="whitespace-pre-line text-[14px] leading-snug text-[#111b21]">{renderBold(preview.body)}</p>
          <p className="mt-1.5 text-[12px] text-[#667781]">{preview.footer}</p>
        </div>
        {preview.buttons.map((label, i) => (
          <div key={label} className="flex items-center justify-center gap-1.5 border-t border-[#e9edef] py-2.5 text-[14px] font-medium text-[#027eb5]">
            <Icon name={i === 0 ? "external" : "undo"} size={12} />
            {label}
          </div>
        ))}
      </div>
      <p className="mt-2 break-all text-caption text-muted-foreground">Link: {preview.link}</p>
    </div>
  );
}
