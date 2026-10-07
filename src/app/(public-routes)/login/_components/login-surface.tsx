"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Suspense, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useSurface } from "@/lib/use-surface";
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

      <p className="mt-1.5 sm:mt-4 text-center text-[13px] text-gray-600">
        Não possui conta?{" "}
        <Link
          href={registerHref}
          className="rounded-sm font-medium text-violet-700 underline-offset-2 transition-colors hover:text-violet-800 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
        >
          Cadastre-se grátis
        </Link>
      </p>
    </div>
  );
}

/**
 * Desenhos decorativos (círculos concêntricos, grade de pontos e cruzes) da
 * moldura da Nokta Tickets — compartilhados com o login do app.nokta.live
 * a pedido do usuário. Fragment de elementos `absolute`: o pai precisa ser o
 * contêiner `fixed inset-0` da moldura.
 */
function BackdropDrawings() {
  return (
    <>
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
    </>
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
        <BackdropDrawings />
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
 * Superfície Nokta (app.nokta.live). Estrutura deliberadamente mínima:
 * logo, formulário, link de cadastro e rodapé, centralizados. Nada de
 * conteúdo ao lado do formulário (testado e recusado pelo usuário).
 *
 * O ambiente é o mesmo que o celular já tinha (pontilhado + brilhos
 * ciano/magenta das cores da marca), mas com os brilhos crescendo com a
 * tela — antes tinham 480px fixos e, no desktop, ficavam presos nas bordas,
 * deixando o miolo da tela branco. Cobre o header/footer genérico de
 * bilheteria do Root Layout com um wrapper `fixed inset-0` (mesmo padrão de
 * register-surface.tsx).
 */
/**
 * Desenhos do app.nokta.live: os mesmos círculos/pontos/cruzes da Nokta
 * Tickets, mas com tamanho que acompanha a tela (`--ring`, 360px a 560px) e
 * a grade de pontos afastada dos círculos — no tamanho fixo de 360px eles
 * viravam ilhas pequenas em monitores largos e a grade batia nos círculos.
 */
function PlatformDrawings() {
  return (
    <div className="absolute inset-0 hidden lg:block" style={{ ["--ring" as string]: "clamp(360px, 22vw, 560px)" }}>
      <svg
        className="absolute opacity-[0.24]"
        style={{ width: "var(--ring)", height: "var(--ring)", left: "calc(14% - var(--ring) / 2)", top: "calc(46% - var(--ring) / 2)" }}
        viewBox="0 0 360 360" fill="none" aria-hidden="true"
      >
        <circle cx="180" cy="180" r="80" stroke="#8B5CF6" strokeWidth="1.1" />
        <circle cx="180" cy="180" r="120" stroke="#8B5CF6" strokeWidth="0.8" />
        <circle cx="180" cy="180" r="160" stroke="#8B5CF6" strokeWidth="0.5" />
        <circle cx="180" cy="180" r="175" stroke="#8B5CF6" strokeWidth="0.25" />
      </svg>
      <svg
        className="absolute opacity-[0.22]"
        style={{ width: "var(--ring)", height: "var(--ring)", right: "calc(13% - var(--ring) / 2)", top: "calc(56% - var(--ring) / 2)" }}
        viewBox="0 0 360 360" fill="none" aria-hidden="true"
      >
        <circle cx="180" cy="180" r="70" stroke="#8B5CF6" strokeWidth="1.1" />
        <circle cx="180" cy="180" r="110" stroke="#8B5CF6" strokeWidth="0.8" />
        <circle cx="180" cy="180" r="150" stroke="#8B5CF6" strokeWidth="0.5" />
        <circle cx="180" cy="180" r="172" stroke="#8B5CF6" strokeWidth="0.25" />
      </svg>
      <div
        className="absolute opacity-[0.38]"
        style={{
          left: "5vw", top: "7vh", width: 168, height: 156,
          backgroundImage: "radial-gradient(circle, rgba(139,92,246,0.50) 1.5px, transparent 1.5px)",
          backgroundSize: "21px 21px",
        }}
      />
      <svg className="absolute opacity-[0.30]" style={{ left: "calc(14% + var(--ring) * 0.22)", top: "calc(46% + var(--ring) * 0.26)" }} width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
        <path d="M7 1v12M1 7h12" stroke="#8B5CF6" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <svg className="absolute opacity-[0.28]" style={{ right: "calc(13% + var(--ring) * 0.3)", top: "calc(56% - var(--ring) * 0.36)" }} width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
        <path d="M7 1v12M1 7h12" stroke="#8B5CF6" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <svg className="absolute opacity-[0.20]" style={{ right: "calc(13% - var(--ring) * 0.34)", top: "calc(56% + var(--ring) * 0.3)" }} width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
        <path d="M5 1v8M1 5h8" stroke="#8B5CF6" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    </div>
  );
}

/** Fundo em uma família só (violeta/lavanda), a mesma do botão e dos desenhos. */
function PlatformAtmosphere() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, #FAFAFC 0%, #F5F4FA 100%)" }} />
      <div
        className="absolute inset-0 opacity-[0.5] lg:hidden"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(124,58,237,0.12) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      <div
        className="absolute left-[-12vw] top-1/2 h-[max(480px,58vw)] w-[max(480px,58vw)] -translate-y-1/2 rounded-full"
        style={{ background: "rgba(124, 58, 237, 0.10)", filter: "blur(140px)" }}
      />
      <div
        className="absolute right-[-14vw] top-1/2 h-[max(420px,52vw)] w-[max(420px,52vw)] -translate-y-[55%] rounded-full"
        style={{ background: "rgba(167, 139, 250, 0.16)", filter: "blur(150px)" }}
      />
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse 34% 52% at 50% 50%, rgba(250,250,252,0.85) 0%, transparent 100%)" }}
      />
      <PlatformDrawings />
    </div>
  );
}

const ENTER = "animate-in fade-in duration-400 ease-[cubic-bezier(0.23,1,0.32,1)] fill-mode-both motion-reduce:animate-none";
const FOCUS_RING = "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-600";
const FOOTER_LINK = `rounded-sm py-3 text-[#2a2735] underline-offset-4 transition-colors duration-150 hover:text-[#16141d] hover:underline lg:py-1 ${FOCUS_RING}`;

/**
 * O Root Layout sempre renderiza o header/footer genéricos da bilheteria por
 * trás desta tela (cobertos pelo `fixed inset-0`). Sem `inert`, o Tab do
 * teclado e o leitor de tela passavam por ~22 links invisíveis atrás dela.
 * Também corrige o título da aba, que vinha como "Nokta Tickets".
 */
function useInertBackground(overlay: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const root = overlay.current;
    if (!root) return;
    const hidden = Array.from(document.querySelectorAll<HTMLElement>("header, footer")).filter(
      (el) => !root.contains(el) && !el.inert,
    );
    hidden.forEach((el) => {
      el.inert = true;
    });
    // O metadata do Next (compartilhado com a bilheteria) diz "Nokta Tickets"
    // e é reaplicado depois da hidratação; reafirma o título enquanto aberto.
    const TITLE = "Entrar | Nokta";
    const previousTitle = document.title;
    const applyTitle = () => {
      if (document.title !== TITLE) document.title = TITLE;
    };
    applyTitle();
    const titleObserver = new MutationObserver(applyTitle);
    titleObserver.observe(document.head, { childList: true, subtree: true, characterData: true });
    return () => {
      titleObserver.disconnect();
      document.title = previousTitle;
      hidden.forEach((el) => {
        el.inert = false;
      });
    };
  }, [overlay]);
}

function PlatformBackdrop({ registerHref }: { registerHref: string }) {
  const overlayRef = useRef<HTMLDivElement>(null);
  useInertBackground(overlayRef);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 isolate flex flex-col overflow-y-auto bg-[#fafafc] selection:bg-violet-600 selection:text-white"
    >
      <PlatformAtmosphere />

      <header className="hidden h-16 w-full shrink-0 items-center lg:flex px-10 min-[1920px]:px-14 [@media(max-height:820px)]:h-12">
        <a
          href="https://www.nokta.live"
          className={`group inline-flex items-center gap-1.5 rounded-md py-3 text-[15px] font-semibold text-[#2a2735] transition-[color,transform] duration-150 ease-out hover:text-[#16141d] active:scale-[0.98] motion-reduce:active:scale-100 min-[1920px]:text-[17px] ${FOCUS_RING}`}
        >
          <ArrowLeft className="h-4 w-4 transition-transform duration-150 ease-out group-hover:-translate-x-0.5 min-[1920px]:h-[18px] min-[1920px]:w-[18px]" />
          Voltar para nokta.live
        </a>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-4 py-8 sm:py-12 lg:pt-4 lg:pb-[5vh] [@media(max-height:820px)]:py-3">
        <div className="flex w-full flex-col items-center min-[1920px]:[zoom:1.1] min-[2400px]:[zoom:1.2]">
          <Link
            href="/"
            className={`mb-8 inline-block rounded-md [@media(max-height:820px)]:mb-5 sm:mb-10 ${FOCUS_RING} ${ENTER}`}
          >
            <NoktaWordmark className="text-[56px] sm:text-[52px] [@media(max-height:820px)]:text-[40px]" />
          </Link>
          <div className={`flex w-full justify-center slide-in-from-bottom-2 delay-75 ${ENTER}`}>
            <LoginCard registerHref={registerHref} />
          </div>
        </div>
      </main>

      <footer className="flex w-full shrink-0 flex-col items-center gap-1 px-4 py-5 text-[14px] font-medium text-[#3a3747] lg:flex-row lg:justify-between lg:px-10 lg:text-[15px] min-[1920px]:px-14 min-[1920px]:text-[16px] [@media(max-height:820px)]:py-3">
        <span>Nokta Tecnologia LTDA • CNPJ: 59.386.582/0001-39</span>
        <nav className="flex items-center gap-6">
          <Link href="/termos" className={FOOTER_LINK}>Termos de uso</Link>
          <Link href="/privacidade" className={FOOTER_LINK}>Privacidade</Link>
        </nav>
      </footer>
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
