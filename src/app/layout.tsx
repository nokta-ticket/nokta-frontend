import type { Metadata } from "next";
import { Poppins, Space_Grotesk } from "next/font/google";
import "./globals.css";
import FooterConditional from "@/components/layout/footer-conditional";
import { Toaster } from "@/components/ui/toaster";
import HeaderSwitcher from "@/lib/header-switcher";
import { AuthProvider } from "@/context/AuthContext";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next"

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  display: "swap",
  weight: ["200", "300", "400", "500", "600", "700", "800"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Nokta Tickets",
  description: "Plataforma oficial da Nokta para eventos e ingressos",
};

// Fase 5.3, Etapa 1/2 — este layout NÃO PODE usar nenhuma API dinâmica
// (headers/cookies/searchParams): qualquer uma delas força TODA a árvore
// (as três superfícies, já que compartilham o mesmo Root Layout) a
// renderizar 100% dinâmica no Next.js, impedindo cache real em qualquer
// rota — inclusive a LP institucional, que não tem motivo pra nunca ser
// cacheada (ver docs/platform/surfaces.md §18.2/§19). Antes, a Fase 5.1
// resolvia "pular o header/footer de bilheteria na LP" com `headers()`
// aqui — funcionalmente correto, mas do jeito mais caro possível.
//
// Solução: sempre renderizar a MESMA árvore (nunca decidir por host aqui).
// A página institucional (única que precisa de header/footer diferente)
// se sobrepõe ao header/footer genérico com um wrapper `fixed inset-0`
// (mesmo padrão já usado por dashboard/admin/produtor pra cobrir o shell
// público — ver dashboard/layout.tsx) — cobertura puramente visual, sem
// nenhuma decisão de host neste arquivo.
export default function RootLayout({
  children,
  painel: painelSlot,
}: {
  children: React.ReactNode;
  painel?: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${poppins.variable} ${spaceGrotesk.variable}`}>
      <body className="bg-white antialiased font-sans" suppressHydrationWarning>
        <AuthProvider>
          {painelSlot ?? (
            <div className="flex min-h-dvh flex-col">
              <HeaderSwitcher />
              <main className="flex flex-1 flex-col">{children}</main>
              <FooterConditional />
            </div>
          )}
          <Toaster />
          <SpeedInsights />
          <Analytics/>
        </AuthProvider>
      </body>
    </html>
  );
}
