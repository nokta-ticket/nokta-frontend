'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Home,
  Calendar,
  Ticket,
  Heart,
  User,
  HelpCircle,
  MessageSquare,
  Shield,
  LogOut,
  Pencil,
  X,
  Menu,
  Briefcase,
} from 'lucide-react';
import { navLinks } from '@/lib/primaryMenuPaths';
import { UserDropdownMenu } from './user-dropdown-menu';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Cookies from 'js-cookie';
import { toast } from '@/lib/toast';

function RevendaIcon({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1280 1104"
      width={size}
      height={size}
      fill="currentColor"
      className={className}
    >
      <g transform="translate(0,1104) scale(0.1,-0.1)" fill="currentColor">
        <path d="M9644 11026 c-18 -8 -51 -31 -75 -53 -74 -66 -376 -434 -801 -973 -141 -179 -275 -343 -298 -364 -63 -57 -122 -78 -201 -74 -60 3 -76 9 -190 75 -206 118 -324 171 -524 237 -314 102 -653 152 -1119 163 -668 15 -1380 -60 -2351 -248 -378 -73 -419 -63 -672 170 -354 324 -752 650 -864 706 -27 14 -74 31 -103 37 -114 22 -233 -43 -381 -209 -124 -139 -197 -234 -322 -423 -374 -563 -760 -1218 -1131 -1920 -340 -644 -591 -1188 -608 -1318 -14 -106 35 -172 173 -237 161 -75 236 -117 524 -293 467 -284 528 -317 731 -388 98 -34 189 -69 203 -78 36 -24 48 -54 93 -231 96 -379 108 -465 73 -541 -10 -22 -94 -130 -187 -240 -274 -324 -317 -381 -376 -499 -62 -123 -81 -191 -86 -301 -5 -122 8 -192 53 -282 45 -88 99 -149 182 -206 99 -68 194 -98 323 -104 158 -7 295 36 397 123 44 37 435 451 874 925 373 402 376 407 422 499 39 79 42 90 45 187 4 84 0 116 -17 171 -58 190 -208 344 -401 409 -42 14 -84 19 -175 19 -191 0 -291 -38 -505 -194 -85 -62 -126 -87 -131 -78 -7 13 -117 521 -148 686 -19 100 -19 106 -2 160 10 31 189 360 398 731 405 719 691 1236 843 1520 236 444 262 486 358 575 48 45 149 98 237 124 105 31 1088 183 1460 225 343 40 514 50 855 50 206 1 391 -4 460 -11 659 -70 620 -65 620 -88 0 -21 -13 -23 -332 -68 -183 -26 -425 -56 -538 -67 -335 -34 -502 -75 -684 -166 -134 -68 -192 -110 -356 -258 -35 -32 -164 -137 -285 -234 -272 -218 -359 -303 -406 -397 -30 -62 -34 -78 -34 -150 0 -69 5 -88 30 -139 38 -75 116 -154 219 -221 242 -158 459 -223 701 -212 150 7 271 37 454 113 252 104 310 121 566 163 286 48 624 99 940 141 253 35 303 34 387 -4 51 -23 135 -94 1498 -1285 765 -668 1691 -1482 1729 -1521 178 -182 202 -376 73 -588 -68 -113 -190 -221 -372 -331 -102 -62 -175 -86 -239 -77 -94 12 -155 55 -436 302 -487 428 -999 864 -1065 908 -119 80 -203 92 -310 45 -80 -36 -120 -90 -120 -164 0 -65 50 -148 157 -261 26 -28 339 -297 696 -598 371 -314 657 -562 671 -584 40 -62 49 -106 43 -211 -7 -128 -28 -204 -92 -336 -64 -134 -155 -263 -255 -366 -92 -94 -126 -113 -205 -113 -51 -1 -70 5 -126 36 -37 21 -410 313 -830 650 -420 336 -779 622 -798 635 -29 20 -46 23 -125 23 -164 0 -220 -51 -221 -200 0 -88 17 -130 79 -193 78 -80 863 -709 1317 -1055 213 -162 258 -207 302 -300 31 -65 32 -70 31 -202 -1 -232 -59 -395 -184 -520 -161 -161 -394 -196 -599 -90 -67 35 -32 7 -587 466 -527 435 -852 698 -914 741 -113 77 -306 149 -371 138 -85 -15 -138 -94 -139 -208 0 -86 24 -140 94 -204 28 -26 402 -329 830 -673 428 -343 787 -638 797 -655 35 -57 18 -161 -48 -287 -85 -162 -263 -300 -513 -396 -83 -32 -191 -35 -269 -8 -38 13 -219 137 -635 434 -655 468 -635 453 -883 650 l-182 145 20 25 c10 14 94 107 186 208 314 346 362 435 350 654 -14 262 -191 481 -437 541 -141 34 -312 8 -435 -66 -81 -49 -88 -56 -239 -240 -175 -214 -373 -445 -714 -834 -156 -178 -299 -347 -317 -376 -95 -149 -83 -332 35 -518 106 -169 298 -277 492 -277 104 0 168 15 265 61 95 45 186 126 369 330 64 71 119 129 123 129 3 0 134 -95 291 -212 669 -497 839 -623 1095 -806 285 -205 372 -254 520 -297 311 -89 660 7 973 269 175 146 303 338 377 566 46 142 72 163 219 179 227 26 394 104 545 253 200 198 303 426 346 768 26 205 43 244 125 285 425 216 666 560 776 1113 19 95 41 186 49 202 19 37 46 51 171 91 469 148 756 481 845 979 62 340 -32 577 -304 766 -68 47 -146 111 -236 190 -11 10 -1 29 58 110 190 265 327 606 396 984 55 301 72 351 157 465 25 33 155 177 289 320 591 629 649 699 649 780 0 43 -18 93 -47 133 -20 26 -2606 2264 -2837 2455 -105 86 -199 115 -272 83z m169 -622 c34 -18 532 -417 827 -663 262 -219 494 -422 960 -841 223 -201 456 -407 518 -459 112 -92 113 -94 95 -114 -23 -27 -401 -441 -588 -643 -77 -84 -143 -151 -147 -151 -3 1 -561 461 -1240 1021 -678 561 -1235 1021 -1237 1022 -4 4 120 153 473 572 228 269 230 272 268 272 22 0 53 -7 71 -16z m-7324 -226 c25 -23 152 -141 281 -262 129 -122 276 -256 326 -298 58 -49 99 -93 114 -122 23 -42 24 -48 12 -92 -7 -26 -38 -86 -69 -133 -31 -47 -353 -626 -715 -1286 -363 -660 -714 -1298 -780 -1418 -117 -212 -121 -218 -141 -204 -12 8 -233 137 -492 287 -259 150 -475 277 -482 282 -9 7 39 111 184 401 620 1241 1114 2080 1674 2840 19 25 36 46 38 47 2 0 25 -19 50 -42z" />
        <path d="M3708 4850 c-82 -15 -174 -50 -235 -89 -35 -23 -133 -116 -248 -237 -793 -832 -1114 -1237 -1180 -1489 -21 -78 -21 -232 0 -309 44 -165 173 -321 326 -395 51 -24 118 -47 170 -57 l86 -17 109 54 109 54 289 325 c561 630 1149 1306 1181 1355 45 70 65 143 65 240 0 101 -19 176 -70 274 -68 131 -184 232 -310 272 -73 23 -219 33 -292 19z" />
        <path d="M4650 3945 c-112 -21 -222 -80 -321 -173 -124 -116 -1156 -1279 -1283 -1446 -83 -109 -136 -260 -136 -385 1 -278 211 -531 488 -588 181 -37 378 40 543 214 26 26 237 271 471 543 936 1092 932 1087 964 1220 44 185 -31 386 -191 507 -144 110 -324 146 -535 108z" />
      </g>
    </svg>
  );
}

export default function HeaderPrivate() {
  const pathname = usePathname();
  const router = useRouter();
  const { role, signOut, user } = useAuth();
  const isProdutor = role === 'PRODUTOR';
  const isAdmin = role === 'ADMIN';
  const isEventPage = /^\/eventos\/[^/]+$/.test(pathname) || /^\/meus-ingressos\/[^/]+$/.test(pathname) || /^\/revenda\/\d+$/.test(pathname);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
    setShowLogoutConfirm(false);
  }, [pathname]);

  const handleNavClick = (href: string) => {
    setMobileOpen(false);
    if (pathname !== href) router.push(href);
  };

  const handleLogout = async () => {
    const token = Cookies.get('token');
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {}
    signOut();
    setMobileOpen(false);
    setShowLogoutConfirm(false);
    toast.success('Logout realizado com sucesso!');
    router.push('/');
  };

  const fullName = user ? `${user.nome ?? ''} ${user.sobrenome ?? ''}`.trim() : '';

  const navItems = [
    { href: '/',               label: 'Início',         icon: <Home size={24} /> },
    { href: '/meus-ingressos', label: 'Meus ingressos', icon: <Ticket size={24} /> },
    { href: '/revenda',        label: 'Revenda',        icon: <RevendaIcon size={24} /> },
    { href: '/eventos',        label: 'Eventos',        icon: <Calendar size={24} /> },
    { href: '/favoritos',      label: 'Favoritos',      icon: <Heart size={24} /> },
    { href: '/perfil',         label: 'Meu perfil',     icon: <User size={24} /> },
    ...(isAdmin ? [{ href: '/admin', label: 'Admin', icon: <Shield size={24} /> }] : []),
  ];

  const footerItems = [
    ...(isProdutor
      ? [{ href: '/produtor/metricas', label: 'Área do produtor',  icon: <Briefcase size={20} /> }]
      : [{ href: '/produtor/onboarding', label: 'Seja produtor',   icon: <Briefcase size={20} /> }]),
    { href: '/ajuda',   label: 'Central de ajuda',   icon: <HelpCircle size={20} /> },
    { href: '/suporte', label: 'Fale com suporte',   icon: <MessageSquare size={20} /> },
    { href: '/termos',  label: 'Termos e políticas', icon: <Shield size={20} /> },
  ];

  return (
    <header className="w-full">

      {/* ── MOBILE ─────────────────────────────────────────────────── */}
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
                href="/meus-ingressos"
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:opacity-90"
              >
                <Ticket size={13} />
                Ingressos
              </Link>
              <button
                onClick={() => setMobileOpen(true)}
                className="flex items-center justify-center h-9 w-9 rounded-full hover:bg-black/5 transition outline-none focus-visible:ring-0"
                aria-label="Abrir menu"
              >
                <Menu size={22} className="text-[#9944CC]" />
              </button>
            </div>
          </>
        ) : (
          /* Demais telas: logo centralizado */
          <>
            {isEventPage ? (
              <button onClick={() => router.back()} aria-label="Voltar" className="flex items-center justify-center">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                  <defs>
                    <linearGradient id="grad-back-priv" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#9944CC"/>
                      <stop offset="100%" stopColor="#3399FF"/>
                    </linearGradient>
                  </defs>
                  <path d="M15 18l-6-6 6-6" stroke="url(#grad-back-priv)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            ) : <div className="w-[26px]" />}

            <Link
              href="/"
              className="absolute left-1/2 -translate-x-1/2 font-gooddog font-bold text-[1.65rem] leading-none text-transparent bg-clip-text bg-gradient-to-r from-[#9944CC] to-[#3399FF]"
            >
              nokta tickets
            </Link>

            <button
              onClick={() => setMobileOpen(true)}
              className="ml-auto flex items-center justify-center h-9 w-9 rounded-full hover:bg-black/5 transition outline-none focus-visible:ring-0"
              aria-label="Abrir menu"
            >
              <Menu size={22} className="text-[#9944CC]" />
            </button>
          </>
        )}
      </div>

      {/* Sheet do menu (sempre disponível) */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="right"
          className="w-[300px] p-0 overflow-y-auto gap-0 [&>button.absolute]:hidden"
        >
          <SheetTitle className="sr-only">Menu</SheetTitle>

          {/* ── Header com gradiente ── */}
          <div className="relative px-6 pt-6 pb-5 bg-gradient-to-br from-purple-50 via-white to-blue-50 border-b">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 text-indigo-400"
              aria-label="Fechar menu"
            >
              <X size={24} strokeWidth={2} />
            </button>

            <div className="absolute -top-14 -left-16 h-44 w-44 rounded-full bg-purple-100/70 blur-sm pointer-events-none" />
            <div className="absolute bottom-0 -right-20 h-48 w-48 rounded-full bg-blue-100/70 blur-sm pointer-events-none" />

            <div className="relative flex flex-col items-center text-center">
              <div className="h-20 w-20 rounded-full bg-white p-1 shadow-md">
                <Avatar className="h-full w-full rounded-full">
                  <AvatarImage src={undefined} />
                  <AvatarFallback className="bg-violet-100 text-[#9944CC] font-bold text-2xl rounded-full h-full w-full">
                    {fullName ? fullName[0].toUpperCase() : <User size={24} />}
                  </AvatarFallback>
                </Avatar>
              </div>

              <h2 className="mt-3 text-xl font-bold tracking-tight text-slate-900">
                {fullName || 'Minha conta'}
              </h2>
              {user?.email && (
                <p className="mt-0.5 text-sm text-slate-500">{user.email}</p>
              )}

              <button
                type="button"
                onClick={() => { setMobileOpen(false); router.push('/perfil/editar'); }}
                className="mt-4 inline-flex items-center gap-2 rounded-xl border border-purple-200 px-5 py-2 text-sm font-medium text-purple-500 bg-white/50"
              >
                <Pencil size={16} />
                Editar foto
              </button>
            </div>
          </div>

          <div className="h-[3px] bg-gradient-to-r from-purple-500 via-fuchsia-400 to-blue-500" />

          {/* ── Navegação ── */}
          <nav className="flex flex-col flex-1 px-6 pt-5">
            <div className="space-y-3">
              {navItems.map(({ href, label, icon }) => {
                const isActive = pathname === href;
                return (
                  <button
                    key={href}
                    type="button"
                    onClick={() => handleNavClick(href)}
                    className={[
                      'flex w-full items-center gap-5 rounded-2xl px-5 py-3 text-[15px] font-medium transition',
                      isActive ? 'bg-purple-50 text-purple-500' : 'text-slate-700 hover:bg-slate-50',
                    ].join(' ')}
                  >
                    <span className={isActive ? 'text-purple-500' : 'text-slate-700'}>
                      {icon}
                    </span>
                    {label}
                  </button>
                );
              })}
            </div>

            <div className="my-5 h-[3px] bg-gradient-to-r from-purple-500 via-fuchsia-400 to-blue-500" />

            <div className="space-y-1">
              {footerItems.map(({ href, label, icon }) => (
                <button
                  key={href}
                  type="button"
                  onClick={() => handleNavClick(href)}
                  className="flex w-full items-center gap-5 px-5 py-2 text-[14px] text-slate-500 hover:bg-slate-50 rounded-xl transition"
                >
                  <span>{icon}</span>
                  {label}
                </button>
              ))}
            </div>

            <div className="mt-auto">
              <div className="mx-5 mt-4 border-t border-red-100" />
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(true)}
                className="my-3 flex w-full items-center gap-5 rounded-xl px-5 py-2.5 text-[15px] font-medium text-red-500 hover:bg-red-50 transition"
              >
                <LogOut size={18} />
                Sair
              </button>
            </div>

            {/* ── Confirmação de logout ── */}
            {showLogoutConfirm && (
              <div className="absolute inset-0 z-50 flex items-end justify-center bg-black/30 backdrop-blur-sm">
                <div className="w-full bg-white rounded-t-2xl px-6 pt-6 pb-8 space-y-5 shadow-xl">
                  <div className="flex flex-col items-center text-center gap-2">
                    <div className="h-12 w-12 rounded-full bg-red-50 flex items-center justify-center">
                      <LogOut size={22} className="text-red-500" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Deseja realmente sair?</h3>
                    <p className="text-sm text-gray-500">Você será desconectado da sua conta.</p>
                  </div>
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full h-12 rounded-xl bg-red-500 hover:bg-red-600 text-white text-[15px] font-semibold transition"
                    >
                      Sair
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowLogoutConfirm(false)}
                      className="w-full h-12 rounded-xl border border-gray-200 text-gray-700 text-[15px] font-medium hover:bg-gray-50 transition"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </nav>
        </SheetContent>
      </Sheet>

      {/* ── DESKTOP ─────────────────────────────────────────────────── */}
      <div className="hidden lg:flex max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 items-center h-20">

        <div className="flex-1 flex items-center">
          <Link href="/" className="font-bold font-gooddog text-[1.75rem] leading-none text-transparent bg-clip-text bg-gradient-to-r from-[#9944CC] to-[#3399FF]">
            NOKTA TICKETS
          </Link>
        </div>

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

        <div className="flex flex-1 justify-end items-center">
          <UserDropdownMenu />
        </div>
      </div>

      <div className="w-full h-[2px] bg-gradient-to-r from-[#9944CC] via-[#D86CFA] to-[#3399FF]" />
    </header>
  );
}
