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
