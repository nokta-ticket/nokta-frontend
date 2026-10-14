"use client";

import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { PRODUCER_SIGNUP_PATH, usePlatformHref } from "@/lib/use-platform-href";

/**
 * Banner principal da home no DESKTOP — chamada pra novos produtores
 * (estilo Gandaya: foto de festa full-bleed com grão, título em display,
 * pílulas). O ponto de venda também é o ponto de captação de quem faz
 * evento. No celular o espaço é do carrossel de destaques (quem chega pelo
 * celular quer ingresso); a chamada pra produtores fica no fim da home.
 *
 * Arte em public/hero/producers-wide.jpg (gerada em 2026-10-14, sem texto).
 */
export function HeroBanner() {
  const createHref = usePlatformHref(PRODUCER_SIGNUP_PATH);

  return (
    <section aria-label="Crie seu evento na Nokta" className="relative hidden lg:block">
      {/* -mt-24 desconta o espaço do header fixo (ver PublicShell) pra a
          arte correr por baixo da ilha flutuante. */}
      <div className="grain relative -mt-24 min-h-[680px] overflow-hidden">
        <Image src="/hero/producers-wide.jpg" alt="" fill priority sizes="100vw" className="object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/85 via-background/35 to-transparent" />
        <div className="hero-fade absolute inset-0" />
        <div className="relative mx-auto flex min-h-[680px] max-w-7xl items-center px-6 pt-24">
          <div className="slide-up max-w-2xl py-16">
            <p className="mb-5 inline-flex items-center gap-2 rounded-pill bg-white/10 px-3.5 py-1.5 text-caption font-semibold uppercase tracking-wider text-white backdrop-blur-md">
              <span className="size-1.5 rounded-full bg-brand" />
              Para produtores
            </p>
            <h1 className="font-display text-hero uppercase text-white [text-shadow:0_2px_30px_rgba(0,0,0,.45)]">O jeito mais fácil de fazer sua festa acontecer</h1>
            <p className="mt-6 max-w-md text-lg text-white/80">Crie o evento, venda ingressos e controle a portaria pelo celular. Sem mensalidade, sem burocracia.</p>
            <div className="mt-8 flex items-center gap-3">
              <a href={createHref} className="btn-lift inline-flex h-12 items-center gap-2 rounded-pill bg-white px-6 text-[15px] font-bold text-[#16060f]">
                Criar evento
                <Icon name="arrow-right" size={14} />
              </a>
              <Link href="/para-produtores" className="inline-flex h-12 items-center rounded-pill bg-white/12 px-6 text-[15px] font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/20">
                Como funciona
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
