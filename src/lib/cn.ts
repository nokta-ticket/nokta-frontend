import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * tailwind-merge precisa conhecer os tokens customizados do design system
 * (globals.css @theme) — senão descarta `text-stat` quando uma cor de texto
 * aparece ao lado, ou trata `rounded-card` como desconhecido. Token novo de
 * tamanho/sombra/raio/fonte → registrar aqui.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: ["hero", "display", "title", "stat", "stat-lg", "body", "caption", "micro"] }],
      shadow: [{ shadow: ["hairline", "1", "2", "3", "card", "card-hover", "thumb"] }],
      rounded: [{ rounded: ["card", "input", "modal", "pill"] }],
      "font-family": [{ font: ["display"] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
