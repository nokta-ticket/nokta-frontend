import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "./_components/login-form";

export default function LoginPage() {
  return (
    <>
      {/* ── Fundo lavanda premium ───────────────────────────────────────── */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">

        {/* Base: quase branco com temperatura fria */}
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(180deg, #FAFAFC 0%, #F7F7FA 100%)" }}
        />

        {/* ── BLOBS DE LUZ ─────────────────────────────────── */}

        {/* Blob violeta esquerda — centrado verticalmente */}
        <div
          className="absolute left-[-60px] top-1/2 h-[480px] w-[480px] -translate-y-1/2 rounded-full"
          style={{ background: "rgba(139, 92, 246, 0.17)", filter: "blur(120px)" }}
        />

        {/* Blob azul direita — centrado, levemente acima */}
        <div
          className="absolute right-[-80px] top-1/2 h-[420px] w-[420px] -translate-y-[55%] rounded-full"
          style={{ background: "rgba(96, 165, 250, 0.14)", filter: "blur(140px)" }}
        />

        {/* Acento violeta sutil no centro-topo — temperatura geral */}
        <div
          className="absolute left-1/2 top-[15%] h-[300px] w-[600px] -translate-x-1/2 rounded-full"
          style={{ background: "rgba(139, 92, 246, 0.06)", filter: "blur(100px)" }}
        />

        {/* ── ANÉIS ESQUERDA ───────────────────────────────── */}
        <svg
          className="absolute opacity-[0.22]"
          style={{ left: "calc(16% - 180px)", top: "50%", transform: "translateY(-52%)" }}
          width="360" height="360" viewBox="0 0 360 360" fill="none"
          aria-hidden="true"
        >
          <circle cx="180" cy="180" r="80"  stroke="#8B5CF6" strokeWidth="1.1" />
          <circle cx="180" cy="180" r="120" stroke="#8B5CF6" strokeWidth="0.8" />
          <circle cx="180" cy="180" r="160" stroke="#8B5CF6" strokeWidth="0.5" />
          <circle cx="180" cy="180" r="175" stroke="#8B5CF6" strokeWidth="0.25" />
        </svg>

        {/* Cruz esquerda */}
        <svg
          className="absolute opacity-[0.30]"
          style={{ left: "calc(16% + 75px)", top: "calc(50% + 88px)" }}
          width="14" height="14" viewBox="0 0 14 14" fill="none"
          aria-hidden="true"
        >
          <path d="M7 1v12M1 7h12" stroke="#8B5CF6" strokeWidth="1.5" strokeLinecap="round" />
        </svg>

        {/* ── GRID DE PONTOS DIREITA ────────────────────────── */}
        <div
          className="absolute opacity-[0.38]"
          style={{
            right: "12%",
            top: "calc(50% - 130px)",
            width: 168,
            height: 156,
            backgroundImage:
              "radial-gradient(circle, rgba(139,92,246,0.50) 1.5px, transparent 1.5px)",
            backgroundSize: "21px 21px",
          }}
        />

        {/* ── ANÉIS DIREITA ─────────────────────────────────── */}
        <svg
          className="absolute opacity-[0.20]"
          style={{ right: "calc(12% - 200px)", top: "50%", transform: "translateY(-46%)" }}
          width="360" height="360" viewBox="0 0 360 360" fill="none"
          aria-hidden="true"
        >
          <circle cx="180" cy="180" r="70"  stroke="#8B5CF6" strokeWidth="1.1" />
          <circle cx="180" cy="180" r="110" stroke="#8B5CF6" strokeWidth="0.8" />
          <circle cx="180" cy="180" r="150" stroke="#8B5CF6" strokeWidth="0.5" />
          <circle cx="180" cy="180" r="172" stroke="#8B5CF6" strokeWidth="0.25" />
        </svg>

        {/* Cruz direita-cima */}
        <svg
          className="absolute opacity-[0.28]"
          style={{ right: "calc(12% + 22px)", top: "calc(50% - 118px)" }}
          width="14" height="14" viewBox="0 0 14 14" fill="none"
          aria-hidden="true"
        >
          <path d="M7 1v12M1 7h12" stroke="#8B5CF6" strokeWidth="1.5" strokeLinecap="round" />
        </svg>

        {/* Cruz direita-pequena */}
        <svg
          className="absolute opacity-[0.20]"
          style={{ right: "calc(12% + 62px)", top: "calc(50% + 22px)" }}
          width="10" height="10" viewBox="0 0 10 10" fill="none"
          aria-hidden="true"
        >
          <path d="M5 1v8M1 5h8" stroke="#8B5CF6" strokeWidth="1.2" strokeLinecap="round" />
        </svg>

        {/* Véu central — clareia atrás do card sem apagar os laterais */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 46% 62% at 50% 50%, rgba(250,250,252,0.88) 0%, transparent 100%)",
          }}
        />
      </div>

      {/* ── Conteúdo centralizado ───────────────────────────────────────── */}
      <div className="flex flex-1 items-center justify-center px-4 py-3 sm:py-8">
        <div className="w-full max-w-[490px]">

          {/* Card */}
          <div className="rounded-[22px] border border-gray-200/50 bg-white px-6 py-6 sm:px-10 sm:py-10 shadow-[0_8px_40px_-8px_rgba(0,0,0,0.11),_0_2px_12px_-3px_rgba(0,0,0,0.06),_0_0_0_1px_rgba(0,0,0,0.03)]">

            {/* Cabeçalho */}
            <div className="mb-4 sm:mb-7 text-center">
              <h1 className="text-[24px] font-bold tracking-[-0.5px] text-gray-950">
                Bem-vindo de volta
              </h1>
              <p className="mt-1.5 text-[13px] text-gray-500">
                Acesse sua conta para continuar
              </p>
            </div>

            <Suspense
              fallback={
                <div className="space-y-2.5">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-[44px] animate-pulse rounded-xl bg-gray-100" />
                  ))}
                </div>
              }
            >
              <LoginForm />
            </Suspense>
          </div>

          {/* Link abaixo do card */}
          <p className="mt-3 sm:mt-4 text-center text-[13px] text-gray-500">
            Não possui conta?{" "}
            <Link
              href="/register"
              className="font-medium text-violet-700 underline-offset-2 transition-colors hover:text-violet-800 hover:underline"
            >
              Cadastre-se grátis
            </Link>
          </p>

        </div>
      </div>
    </>
  );
}
