"use client";

import Link from "next/link";
import Image from "next/image";
import { Facebook, Instagram, Twitter } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full mt-[14px]">
      {/* Linha gradiente topo */}
      <div className="h-[2px] w-full bg-gradient-to-r from-[#9944CC] via-[#D86CFA] to-[#3399FF]" />

      {/* ── DESKTOP ─────────────────────────────────────────────── */}
      <div className="hidden lg:block">
        <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-4 gap-10 items-start pb-12 mt-12">
          <div className="flex flex-col justify-between h-full">
            <Link href="/" className="w-fit block">
              <Image src="/logo.svg" alt="Nokta Tickets" width={160} height={40} className="h-20 w-auto" priority />
            </Link>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                A plataforma mais segura para comprar e vender ingressos para os melhores eventos do Brasil.
              </p>
              <div className="flex space-x-4">
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                  <Facebook className="h-5 w-5 text-gray-600 hover:text-violet-500" />
                </a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                  <Instagram className="h-5 w-5 text-gray-600 hover:text-violet-500" />
                </a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                  <Twitter className="h-5 w-5 text-gray-600 hover:text-violet-500" />
                </a>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-base font-semibold text-black">NAVEGAÇÃO</h4>
            <ul className="space-y-2 text-lg text-gray-700">
              <li><Link href="/" className="hover:underline">Inicio</Link></li>
              <li><Link href="/eventos" className="hover:underline">Todos os Eventos</Link></li>
              <li><Link href="/revenda" className="hover:underline">Marketplace</Link></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-lg uppercase text-black">CONTA</h4>
            <ul className="space-y-2 text-gray-700">
              <li><Link href="/minha-conta" className="hover:underline">Minha Conta</Link></li>
              <li><Link href="/ingressos" className="hover:underline">Meus Ingressos</Link></li>
              <li><Link href="/favoritos" className="hover:underline">Favoritos</Link></li>
              <li><Link href="/notificacoes" className="hover:underline">Notificações</Link></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-lg font-semibold uppercase text-black">SUPORTE</h4>
            <ul className="space-y-2 text-gray-700">
              <li><Link href="/contato" className="hover:underline">Fale Conosco</Link></li>
              <li><Link href="/termos" className="hover:underline">Termos de Uso</Link></li>
              <li><Link href="/privacidade" className="hover:underline">Política de Privacidade</Link></li>
              <li><Link href="/faq" className="hover:underline">FAQ</Link></li>
            </ul>
          </div>
        </div>

        <div className="h-px w-full bg-gradient-to-r from-[#9944CC]/50 via-[#D86CFA]/35 to-[#3399FF]/45 mb-8" />

        <div className="max-w-[1300px] mx-auto py-8 text-sm text-gray-500 flex flex-col md:flex-row justify-between items-center px-4 sm:px-6 lg:px-8">
          <span>© 2026 NOKTA TICKETS. Todos os direitos reservados.</span>
          <span>Nokta Tecnologia LTDA • CNPJ: 59.386.582/0001-39</span>
          <span>Feito com 💜 para os amantes de eventos</span>
        </div>
      </div>

      {/* ── MOBILE ──────────────────────────────────────────────── */}
      <div className="lg:hidden pb-2">
        <div className="flex flex-col items-center gap-2 text-center px-4 py-3">

          <span className="font-gooddog font-bold text-[1.6rem] text-transparent bg-clip-text bg-gradient-to-r from-[#9944CC] to-[#3399FF] leading-none">
            nokta tickets
          </span>

          <div className="flex flex-col gap-1 text-[13px] text-gray-500">
            <p className="font-medium text-gray-700">Nokta Tecnologia LTDA</p>
            <p>CNPJ: 59.386.582/0001-39</p>
            <a href="mailto:contato@noktatickets.com.br" className="text-[#9944CC] hover:underline">
              contato@noktatickets.com.br
            </a>
          </div>

          <div className="flex items-center gap-5">
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <Instagram className="h-5 w-5 text-gray-400 hover:text-[#9944CC] transition" />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
              <Twitter className="h-5 w-5 text-gray-400 hover:text-[#9944CC] transition" />
            </a>
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
              <Facebook className="h-5 w-5 text-gray-400 hover:text-[#9944CC] transition" />
            </a>
          </div>

          <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-1.5 text-[12px] text-gray-400">
            <Link href="/termos" className="hover:text-gray-600 transition whitespace-nowrap">Termos de Uso</Link>
            <span>·</span>
            <Link href="/privacidade" className="hover:text-gray-600 transition whitespace-nowrap">Política de Privacidade</Link>
            <span>·</span>
            <Link href="/faq" className="hover:text-gray-600 transition whitespace-nowrap">FAQ</Link>
          </div>

          <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

          <div className="flex flex-col items-center gap-1 text-[12px] text-gray-400">
            <span>© 2026 NOKTA TICKETS. Todos os direitos reservados.</span>
            <span>Feito com 💜 para os amantes de eventos</span>
          </div>

        </div>
      </div>
    </footer>
  );
}
