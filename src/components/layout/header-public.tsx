'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, Ticket, X } from 'lucide-react';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from '@/components/ui/sheet';
import { navLinks } from '@/lib/primaryMenuPaths';

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isEventPage = /^\/eventos\/[^/]+$/.test(pathname) || /^\/revenda\/\d+$/.test(pathname);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  return (
    <header className="w-full">

      {/* ── MOBILE ────────────────────────────────────────────────── */}
      <div className="lg:hidden flex items-center h-16 px-4 relative w-full">

        {pathname === '/' ? (
          /* Tela inicial: logo à esquerda + botão Ingressos */
          <>
            <Link
              href="/"
              className="font-gooddog font-bold text-[1.65rem] leading-none text-transparent bg-clip-text bg-gradient-to-r from-[#9944CC] to-[#3399FF] ml-1"
            >
              nokta tickets
            </Link>
            <div className="ml-auto flex items-center gap-4">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:opacity-90"
              >
                <Ticket size={13} />
                Ingressos
              </Link>
            </div>
          </>
        ) : (
          /* Demais telas: logo centralizado + botão voltar se for página de evento */
          <>
            {isEventPage ? (
              <button onClick={() => router.back()} aria-label="Voltar" className="flex items-center justify-center">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                  <defs>
                    <linearGradient id="grad-back-pub" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#9944CC"/>
                      <stop offset="100%" stopColor="#3399FF"/>
                    </linearGradient>
                  </defs>
                  <path d="M15 18l-6-6 6-6" stroke="url(#grad-back-pub)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            ) : <div className="w-[26px]" />}

            <Link
              href="/"
              className="absolute left-1/2 -translate-x-1/2 font-gooddog font-bold text-[1.65rem] leading-none text-transparent bg-clip-text bg-gradient-to-r from-[#9944CC] to-[#3399FF]"
            >
              nokta tickets
            </Link>
          </>
        )}

        {/* Hambúrguer — direita (sempre visível) */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <button className={`flex items-center justify-center h-9 w-9 rounded-full hover:bg-black/5 transition outline-none focus-visible:ring-0 ${pathname !== '/' ? 'ml-auto' : ''}`} aria-label="Abrir menu">
              <Menu size={22} className="text-[#9944CC]" />
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[280px] p-0 flex flex-col bg-[#FAFAFA] border-l border-gray-100">

            {/* Logo */}
            <SheetHeader className="px-6 pt-7 pb-5 flex items-center justify-center">
              <SheetTitle asChild>
                <Link href="/" className="font-gooddog font-bold text-[2rem] leading-none text-transparent bg-clip-text bg-gradient-to-r from-[#9944CC] to-[#3399FF]">
                  nokta tickets
                </Link>
              </SheetTitle>
            </SheetHeader>

            {/* Divisor */}
            <div className="w-full h-[2px] bg-gradient-to-r from-[#9944CC] via-[#D86CFA] to-[#3399FF] mb-2" />

            {/* Nav links */}
            <nav className="flex flex-col px-4 py-2 gap-0.5">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`font-sans px-4 py-3 rounded-xl text-[15px] font-medium transition-colors ${
                      isActive
                        ? 'text-[#9944CC] bg-violet-50'
                        : 'text-gray-600 hover:text-[#9944CC] hover:bg-gray-100'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            {/* Links de suporte */}
            <div className="mt-auto px-4 pb-2">
              <div className="w-full h-[2px] bg-gradient-to-r from-[#9944CC] via-[#D86CFA] to-[#3399FF] mb-3" />
              <div className="flex flex-col gap-0.5">
                {[
                  { label: 'Fale com suporte', href: 'mailto:contato@noktatickets.com.br' },
                  { label: 'Termos e políticas', href: '/termos' },
                ].map(({ label, href }) => (
                  <Link key={href} href={href} className="font-sans px-4 py-2.5 text-[13px] text-gray-500 hover:text-[#9944CC] transition-colors rounded-xl hover:bg-gray-100">
                    {label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Botões */}
            <div className="px-5 pb-8 pt-4 space-y-2.5">
              <Link href="/login" className="block">
                <Button variant="outline" className="font-sans w-full font-semibold focus-visible:ring-0 focus-visible:border-gray-300">Entrar</Button>
              </Link>
              <Link href="/register" className="block">
                <Button className="font-sans w-full font-semibold text-white bg-gradient-to-r from-[#9944CC] to-[#3399FF] hover:opacity-90 focus-visible:ring-0">
                  Cadastrar
                </Button>
              </Link>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* ── DESKTOP ───────────────────────────────────────────────── */}
      <div className="hidden lg:flex max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 items-center h-20">

        {/* Logo — esquerda */}
        <div className="flex-1 flex items-center">
          <Link
            href="/"
            className="font-bold font-gooddog text-[1.75rem] leading-none text-transparent bg-clip-text bg-gradient-to-r from-[#9944CC] to-[#3399FF]"
          >
            NOKTA TICKETS
          </Link>
        </div>

        {/* Nav — centro */}
        <nav className="flex items-center gap-8 text-md text-gray-500">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <div key={link.href} className="flex flex-col items-center">
                <Link
                  href={link.href}
                  className={`transition-colors ${isActive ? 'text-violet-600 font-medium' : 'hover:text-violet-700'}`}
                >
                  {link.label}
                </Link>
                {isActive && (
                  <div className="mt-1 w-full h-[2px] bg-gradient-to-r from-purple-500 to-blue-500" />
                )}
              </div>
            );
          })}
        </nav>

        {/* Botões — direita */}
        <div className="flex-1 flex justify-end items-center gap-3">
          <Link href="/login">
            <Button variant="outline" className="font-semibold cursor-pointer px-6">Entrar</Button>
          </Link>
          <Link href="/register">
            <Button
              variant="outline"
              className="font-semibold cursor-pointer text-white px-6 bg-gradient-to-r from-[#9944CC] to-[#3399FF]"
            >
              Cadastrar
            </Button>
          </Link>
        </div>
      </div>

      <div className="w-full h-[2px] bg-gradient-to-r from-[#9944CC] via-[#D86CFA] to-[#3399FF]" />
    </header>
  );
}
