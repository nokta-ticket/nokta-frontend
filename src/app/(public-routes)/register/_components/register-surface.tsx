"use client";

import { Suspense } from "react";
import { useSurface } from "@/lib/use-surface";
import { NoktaBrandMark } from "@/components/layout/nokta-brand-mark";
import { RegisterForm } from "./forms-register";

const FORM_FALLBACK = (
  <div className="space-y-3">
    {[...Array(6)].map((_, i) => (
      <div key={i} className="h-[46px] animate-pulse rounded-xl bg-gray-100" />
    ))}
  </div>
);

const CARD = (
  <div className="rounded-[22px] border border-gray-200/50 bg-white px-8 py-6 shadow-[0_8px_40px_-8px_rgba(0,0,0,0.11),_0_2px_12px_-3px_rgba(0,0,0,0.06),_0_0_0_1px_rgba(0,0,0,0.03)]">
    <Suspense fallback={FORM_FALLBACK}>
      <RegisterForm />
    </Suspense>
  </div>
);

/**
 * Fundo/moldura da tela de cadastro — Nokta Tickets (roxo/violeta, padrão) é
 * o que já renderiza no servidor, então é o que aparece primeiro em QUALQUER
 * host (sem flash incorreto: só troca DEPOIS de montar, se `useSurface()`
 * resolver PLATFORM). O `<RegisterForm />` em si (campos, validação,
 * máscaras, OTP, senha, OAuth, endpoints) é o MESMO componente nos dois
 * casos — só a moldura ao redor muda.
 */
function TicketsBackdrop() {
  return (
    <>
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(180deg, #FAFAFC 0%, #F7F7FA 100%)" }}
        />
        <div
          className="absolute inset-0 opacity-[0.45]"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(109,40,217,0.11) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse 52% 68% at 50% 50%, rgba(250,250,252,0.88) 0%, transparent 100%)",
          }}
        />
        <div
          className="absolute left-[-60px] top-1/2 h-[480px] w-[480px] -translate-y-1/2 rounded-full"
          style={{ background: "rgba(139, 92, 246, 0.17)", filter: "blur(120px)" }}
        />
        <div
          className="absolute right-[-80px] top-1/2 h-[420px] w-[420px] -translate-y-[55%] rounded-full"
          style={{ background: "rgba(96, 165, 250, 0.14)", filter: "blur(140px)" }}
        />
        <svg
          className="absolute opacity-[0.22]"
          style={{ left: "calc(16% - 180px)", top: "50%", transform: "translateY(-52%)" }}
          width="360" height="360" viewBox="0 0 360 360" fill="none" aria-hidden="true"
        >
          <circle cx="180" cy="180" r="80" stroke="#8B5CF6" strokeWidth="1.1" />
          <circle cx="180" cy="180" r="120" stroke="#8B5CF6" strokeWidth="0.8" />
          <circle cx="180" cy="180" r="160" stroke="#8B5CF6" strokeWidth="0.5" />
          <circle cx="180" cy="180" r="175" stroke="#8B5CF6" strokeWidth="0.25" />
        </svg>
        <svg
          className="absolute opacity-[0.30]"
          style={{ left: "calc(16% + 75px)", top: "calc(50% + 88px)" }}
          width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"
        >
          <path d="M7 1v12M1 7h12" stroke="#8B5CF6" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <div
          className="absolute opacity-[0.38]"
          style={{
            right: "12%", top: "calc(50% - 130px)",
            width: 168, height: 156,
            backgroundImage: "radial-gradient(circle, rgba(139,92,246,0.50) 1.5px, transparent 1.5px)",
            backgroundSize: "21px 21px",
          }}
        />
        <svg
          className="absolute opacity-[0.20]"
          style={{ right: "calc(12% - 200px)", top: "50%", transform: "translateY(-46%)" }}
          width="360" height="360" viewBox="0 0 360 360" fill="none" aria-hidden="true"
        >
          <circle cx="180" cy="180" r="70" stroke="#8B5CF6" strokeWidth="1.1" />
          <circle cx="180" cy="180" r="110" stroke="#8B5CF6" strokeWidth="0.8" />
          <circle cx="180" cy="180" r="150" stroke="#8B5CF6" strokeWidth="0.5" />
          <circle cx="180" cy="180" r="172" stroke="#8B5CF6" strokeWidth="0.25" />
        </svg>
        <svg
          className="absolute opacity-[0.28]"
          style={{ right: "calc(12% + 22px)", top: "calc(50% - 118px)" }}
          width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"
        >
          <path d="M7 1v12M1 7h12" stroke="#8B5CF6" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <svg
          className="absolute opacity-[0.20]"
          style={{ right: "calc(12% + 62px)", top: "calc(50% + 22px)" }}
          width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true"
        >
          <path d="M5 1v8M1 5h8" stroke="#8B5CF6" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      </div>

      <div className="flex flex-1 items-center justify-center px-4">
        <div className="w-full max-w-[520px]">{CARD}</div>
      </div>
    </>
  );
}

/**
 * Superfície Nokta (app.nokta.live) — mesmo card/form, moldura com a
 * identidade da plataforma (cores frias ciano/magenta do logo-painel.svg,
 * em vez do roxo/violeta da Nokta Tickets) e uma barra de marca mínima no
 * topo. Cobre o header/footer genérico de bilheteria que o Root Layout
 * sempre renderiza (ver comentário em src/app/layout.tsx) com um wrapper
 * `fixed inset-0` — mesmo padrão já usado pela LP institucional
 * (nokta.live/institucional/page.tsx) pra este exato problema.
 */
function PlatformBackdrop() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-white">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(180deg, #FAFAFC 0%, #F7F7FA 100%)" }}
        />
        <div
          className="absolute inset-0 opacity-[0.45]"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(0,180,216,0.12) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        <div
          className="absolute left-[-60px] top-1/2 h-[480px] w-[480px] -translate-y-1/2 rounded-full"
          style={{ background: "rgba(0, 221, 255, 0.16)", filter: "blur(120px)" }}
        />
        <div
          className="absolute right-[-80px] top-1/2 h-[420px] w-[420px] -translate-y-[55%] rounded-full"
          style={{ background: "rgba(255, 0, 212, 0.12)", filter: "blur(140px)" }}
        />
      </div>

      <header className="w-full shrink-0">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center h-20">
          <NoktaBrandMark className="flex-1" />
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center px-4">
        <div className="w-full max-w-[520px]">{CARD}</div>
      </div>

      <footer className="w-full shrink-0 px-4 py-6 text-center text-xs text-[#a4a7ae]">
        Nokta Tecnologia LTDA • CNPJ: 59.386.582/0001-39
      </footer>
    </div>
  );
}

export function RegisterSurface() {
  const surface = useSurface();
  return surface === "PLATFORM" ? <PlatformBackdrop /> : <TicketsBackdrop />;
}
