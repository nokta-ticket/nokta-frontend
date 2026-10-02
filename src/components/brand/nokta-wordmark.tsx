import localFont from "next/font/local";
import { cn } from "@/lib/utils";

/**
 * Logo oficial da Nokta (empresa mãe, nokta.live): só lettering, na fonte
 * CS Gorila. Não confundir com a logo da Nokta Tickets (círculos
 * ciano-magenta com ingresso, public/logo-painel.svg), que é outra marca.
 * A fonte só tem A-Z/a-z, então serve só para o lettering, nunca para texto.
 */
const csGorila = localFont({
  src: "../../assets/fonts/CSGorila-Regular.otf",
  display: "swap",
  variable: "--font-nokta-wordmark",
});

export const noktaWordmarkFontVariable = csGorila.variable;
export const noktaWordmarkFontClass = csGorila.className;

export function NoktaWordmark({ className }: { className?: string }) {
  return (
    <span role="img" aria-label="Nokta" className={cn(csGorila.className, "inline-block leading-none text-[#1c1a24]", className)}>
      nokta
    </span>
  );
}
