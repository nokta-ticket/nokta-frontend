"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useSurface } from "@/lib/use-surface";
import Image from "next/image";
import { NoktaWordmark } from "@/components/brand/nokta-wordmark";
import { LoginForm } from "./login-form";

const FORM_FALLBACK = (
  <div className="space-y-2.5">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="h-[44px] animate-pulse rounded-xl bg-gray-100" />
    ))}
  </div>
);

function LoginCard({ registerHref }: { registerHref: string }) {
  return (
    <div className="w-full max-w-[490px]">
      <div className="rounded-[22px] border border-gray-200/50 bg-white px-6 pt-4 pb-5 sm:px-10 sm:py-10 shadow-[0_8px_40px_-8px_rgba(0,0,0,0.11),_0_2px_12px_-3px_rgba(0,0,0,0.06),_0_0_0_1px_rgba(0,0,0,0.03)]">
        <div className="mb-4 sm:mb-7 text-center">
          <h1 className="text-[24px] font-bold tracking-[-0.5px] text-gray-950">
            Bem-vindo de volta
          </h1>
          <p className="mt-1.5 text-[13px] text-gray-500">
            Acesse sua conta para continuar
          </p>
        </div>

        <Suspense fallback={FORM_FALLBACK}>
          <LoginForm />
        </Suspense>
      </div>

      <p className="mt-1.5 sm:mt-4 text-center text-[13px] text-gray-500">
        Não possui conta?{" "}
        <Link
          href={registerHref}
          className="font-medium text-violet-700 underline-offset-2 transition-colors hover:text-violet-800 hover:underline"
        >
          Cadastre-se grátis
        </Link>
      </p>
    </div>
  );
}

/**
 * Fundo/moldura da tela de login — Nokta Tickets (roxo/violeta, padrão) é o
 * que já renderiza no servidor, então é o que aparece primeiro em QUALQUER
 * host (sem flash incorreto: só troca DEPOIS de montar, se `useSurface()`
 * resolver PLATFORM). O `<LoginForm />` em si (campos, validação, OAuth,
 * endpoints) é o MESMO componente nos dois casos — só a moldura muda.
 * Mesmo padrão de register-surface.tsx.
 */
function TicketsBackdrop({ registerHref }: { registerHref: string }) {
  return (
    <>
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(180deg, #FAFAFC 0%, #F7F7FA 100%)" }}
        />
        <div
          className="absolute left-[-60px] top-1/2 h-[480px] w-[480px] -translate-y-1/2 rounded-full"
          style={{ background: "rgba(139, 92, 246, 0.17)", filter: "blur(120px)" }}
        />
        <div
          className="absolute right-[-80px] top-1/2 h-[420px] w-[420px] -translate-y-[55%] rounded-full"
          style={{ background: "rgba(96, 165, 250, 0.14)", filter: "blur(140px)" }}
        />
        <div
          className="absolute left-1/2 top-[15%] h-[300px] w-[600px] -translate-x-1/2 rounded-full"
          style={{ background: "rgba(139, 92, 246, 0.06)", filter: "blur(100px)" }}
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
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 46% 62% at 50% 50%, rgba(250,250,252,0.88) 0%, transparent 100%)",
          }}
        />
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-3 sm:py-8">
        <LoginCard registerHref={registerHref} />
      </div>
    </>
  );
}

/**
 * Superfície Nokta (app.nokta.live) — mesmo card/form, moldura com a
 * identidade do painel (lavanda/violeta + o card escuro "Panorama" da
 * Início). No desktop a tela se divide: formulário à esquerda, e à direita
 * um painel escuro com a captura REAL da Início (a mesma da landing,
 * public/institucional/painel-inicio.webp) — sem números inventados. Abaixo
 * de lg só o formulário. Cobre o header/footer genérico de bilheteria que o
 * Root Layout sempre renderiza (ver comentário em src/app/layout.tsx) com um
 * wrapper `fixed inset-0` — mesmo padrão de register-surface.tsx.
 */
const PLATFORM_AREAS = ["Eventos e ingressos", "Reservas", "Comandas e caixa", "Cardápio", "Financeiro"];

function PlatformShowcase() {
  return (
    <aside className="sticky top-0 hidden h-dvh p-3 lg:block">
      <div className="relative flex h-full flex-col overflow-hidden rounded-[28px] bg-gradient-to-br from-[#1d1834] via-[#191530] to-[#141020] text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(124,58,237,0.42) 0%, transparent 65%)" }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.5]"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)",
            backgroundSize: "26px 26px",
            maskImage: "linear-gradient(180deg, #000 0%, transparent 60%)",
            WebkitMaskImage: "linear-gradient(180deg, #000 0%, transparent 60%)",
          }}
        />

        <div className="relative px-12 pt-14 xl:px-16 xl:pt-20">
          <h2 className="max-w-[16ch] font-[family-name:var(--font-poppins)] text-[40px] font-semibold leading-[1.04] tracking-[-0.035em] text-balance xl:text-[48px]">
            Sua operação inteira em um só painel.
          </h2>
          <p className="mt-5 max-w-[44ch] text-[15px] leading-relaxed text-[#c9c3dc]">
            Do ingresso vendido à comanda fechada no caixa, tudo o que acontece na sua casa aparece aqui, em tempo real.
          </p>
          <ul className="mt-8 flex max-w-[460px] flex-wrap gap-x-5 gap-y-2.5 text-[13px] text-[#e4def3]">
            {PLATFORM_AREAS.map((area) => (
              <li key={area} className="flex items-center gap-2">
                <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[#a78bfa]" />
                {area}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative mt-auto h-[46%] min-h-[260px]">
          <div className="absolute left-12 top-6 w-[150%] origin-top-left animate-in slide-in-from-bottom-8 duration-1000 ease-out [perspective:1600px] motion-reduce:animate-none xl:left-16">
            <div className="overflow-hidden rounded-[14px] bg-white shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_40px_80px_-30px_rgba(0,0,0,0.7)] [transform:rotateX(8deg)] [transform-origin:50%_0%]">
              <Image
                src="/institucional/painel-inicio.webp"
                alt="Tela Início do painel da Nokta"
                width={2400}
                height={1500}
                priority
                sizes="(min-width: 1024px) 75vw, 0px"
                className="block h-auto w-full"
              />
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function PlatformBackdrop({ registerHref }: { registerHref: string }) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#fbfaff] selection:bg-violet-600 selection:text-white lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.08fr)]">
      <div className="relative flex min-h-dvh flex-col">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden lg:hidden">
          <div
            className="absolute left-1/2 top-[-120px] h-[360px] w-[520px] -translate-x-1/2 rounded-full"
            style={{ background: "rgba(124, 58, 237, 0.10)", filter: "blur(90px)" }}
          />
        </div>

        <header className="flex h-20 shrink-0 items-center px-6 sm:px-10">
          <Link href="/" className="rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-600">
            <NoktaWordmark className="text-[30px]" />
          </Link>
        </header>

        <div className="flex flex-1 items-center justify-center px-4 py-6">
          <LoginCard registerHref={registerHref} />
        </div>

        <footer className="shrink-0 px-4 py-6 text-center text-xs text-[#8a8698]">
          Nokta Tecnologia LTDA • CNPJ: 59.386.582/0001-39
        </footer>
      </div>

      <PlatformShowcase />
    </div>
  );
}

// Fase 5.1: "Cadastre-se grátis" precisa preservar o `ctx` (ex.: "produtor",
// vindo do CTA de cadastro empresarial da LP) — sem isso, quem não tem conta
// ainda perdia a indicação de superfície empresarial ao trocar pra /register.
function useRegisterHref(): string {
  const searchParams = useSearchParams();
  const ctx = searchParams.get("ctx");
  return ctx ? `/register?ctx=${encodeURIComponent(ctx)}` : "/register";
}

function LoginSurfaceInner() {
  const surface = useSurface();
  const registerHref = useRegisterHref();
  return surface === "PLATFORM" ? (
    <PlatformBackdrop registerHref={registerHref} />
  ) : (
    <TicketsBackdrop registerHref={registerHref} />
  );
}

export function LoginSurface() {
  return (
    <Suspense fallback={null}>
      <LoginSurfaceInner />
    </Suspense>
  );
}
