import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { buildPlatformUrl } from "@/lib/surfaces";

const CREATE_EVENT_HREF = buildPlatformUrl("/register?ctx=produtor");

/**
 * Banner principal da home — chamada pra novos produtores (estilo
 * Gandaya: foto de festa full-bleed com grão, título em display, pílulas).
 * O ponto de venda também é o ponto de captação de quem faz evento.
 *
 * Artes em public/hero (geradas em 2026-10-14, sem texto): `producers-wide`
 * pro desktop (16:9) e `producers-tall` pro celular (4:5).
 */
export function HeroBanner() {
  return (
    <section aria-label="Crie seu evento na Nokta" className="relative">
      {/* celular / tablet */}
      <div className="px-4 pt-2 lg:hidden">
        <div className="grain relative aspect-[4/5] overflow-hidden rounded-[22px] bg-surface-2 shadow-card-hover ring-1 ring-white/5">
          <Image src="/hero/producers-tall.jpg" alt="" fill priority sizes="100vw" className="object-cover" />
          <div className="poster-fade absolute inset-0" />
          <div className="absolute inset-x-0 bottom-0 p-5">
            <p className="mb-3 inline-flex items-center gap-1.5 rounded-pill bg-white/12 px-3 py-1 text-micro font-bold uppercase tracking-wider text-white backdrop-blur-md">
              <span className="size-1.5 rounded-full bg-brand" />
              Para produtores
            </p>
            <h2 className="font-display text-[2.3rem] uppercase leading-[0.92] text-white [text-shadow:0_2px_24px_rgba(0,0,0,.5)]">
              O jeito mais fácil de fazer sua festa acontecer
            </h2>
            <p className="mt-3 max-w-xs text-sm text-white/80">Crie o evento, venda ingressos e controle a portaria pelo celular. Sem mensalidade.</p>
            <div className="mt-4 flex items-center gap-2">
              <a href={CREATE_EVENT_HREF} className="btn-lift inline-flex h-11 items-center gap-2 rounded-pill bg-white px-5 text-sm font-bold text-[#16060f]">
                Criar evento
                <Icon name="arrow-right" size={12} />
              </a>
              <Link href="/para-produtores" className="inline-flex h-11 items-center rounded-pill bg-white/12 px-4 text-sm font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/20">
                Saiba mais
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* desktop */}
      {/* -mt-24 desconta o espaço do header fixo (ver PublicShell) pra a
          arte correr por baixo da ilha flutuante. */}
      <div className="grain relative -mt-24 hidden min-h-[680px] overflow-hidden lg:block">
        <Image src="/hero/producers-wide.jpg" alt="" fill priority sizes="100vw" className="object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/85 via-background/35 to-transparent" />
        <div className="hero-fade absolute inset-0" />
        <div className="relative mx-auto flex min-h-[680px] max-w-7xl items-center px-6 pt-24">
          <div className="slide-up max-w-2xl py-16">
            <p className="mb-5 inline-flex items-center gap-2 rounded-pill bg-white/10 px-3.5 py-1.5 text-caption font-semibold uppercase tracking-wider text-white backdrop-blur-md">
              <span className="size-1.5 rounded-full bg-brand" />
              Para produtores
            </p>
            <h1 className="font-display text-hero uppercase text-white [text-shadow:0_2px_30px_rgba(0,0,0,.45)]">
              O jeito mais fácil de fazer sua festa acontecer
            </h1>
            <p className="mt-6 max-w-md text-lg text-white/80">Crie o evento, venda ingressos e controle a portaria pelo celular. Sem mensalidade, sem burocracia.</p>
            <div className="mt-8 flex items-center gap-3">
              <a href={CREATE_EVENT_HREF} className="btn-lift inline-flex h-12 items-center gap-2 rounded-pill bg-white px-6 text-[15px] font-bold text-[#16060f]">
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
