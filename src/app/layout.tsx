import type { Metadata, Viewport } from "next";
import { Anton, Plus_Jakarta_Sans } from "next/font/google";
import { config as faConfig } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { StepUpProvider } from "@/components/session/step-up-modal";
import { PhoneRequiredGate } from "@/components/session/phone-required-gate";
import { AppThemeProvider } from "@/components/theme/theme-provider";
import { AppToaster } from "@/components/ui/toaster";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import { SITES } from "@/lib/seo/site";

// O CSS do FontAwesome é importado acima uma vez — sem isso ele injeta um
// <style> por ícone em runtime (e os ícones aparecem gigantes antes disso).
faConfig.autoAddCss = false;

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const anton = Anton({
  variable: "--font-anton",
  subsets: ["latin"],
  display: "swap",
  weight: "400",
});

export const metadata: Metadata = {
  // Base pra URLs relativas de metadata (ex.: a /opengraph-image herdada
  // por páginas sem imagem própria). Páginas com buildMetadata já usam URL
  // absoluta no site canônico delas.
  metadataBase: new URL(SITES.tickets.url),
  title: {
    default: "Nokta",
    template: "%s · Nokta",
  },
  description: "Os melhores eventos e festas em um só lugar. Compre seus ingressos e viva a experiência Nokta.",
  applicationName: "Nokta",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Nokta" },
};

export const viewport: Viewport = {
  themeColor: "#0f0f11",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

/**
 * Root Layout: só providers. Nenhuma API dinâmica aqui (headers/cookies)
 * — qualquer uma forçaria TODA a árvore a renderizar dinâmica e mataria o
 * cache das rotas públicas. O "shell" visual (header, nav inferior,
 * rodapé, sidebar) é decidido pelos layouts de cada grupo de rotas.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" data-scroll-behavior="smooth" className={`${jakarta.variable} ${anton.variable} dark`} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://api.nokta.live" crossOrigin="use-credentials" />
        <link rel="preconnect" href="https://api.noktatickets.com.br" crossOrigin="use-credentials" />
      </head>
      <body className="min-h-dvh bg-background font-sans text-foreground antialiased" suppressHydrationWarning>
        <AppThemeProvider>
          <AuthProvider>
            <StepUpProvider>
              {children}
              <PhoneRequiredGate />
              <AppToaster />
              <SpeedInsights />
              <Analytics />
            </StepUpProvider>
          </AuthProvider>
        </AppThemeProvider>
      </body>
    </html>
  );
}
