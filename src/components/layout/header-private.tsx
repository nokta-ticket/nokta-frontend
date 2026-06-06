'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Ticket,
  User,
  HeartIcon,
  Briefcase,
  Shield,
  LogOut,
  Menu,
} from 'lucide-react';
import { navLinks } from '@/lib/primaryMenuPaths';
import { UserDropdownMenu } from './user-dropdown-menu';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Cookies from 'js-cookie';
import { toast } from '@/lib/toast';

export default function HeaderPrivate() {
  const pathname = usePathname();
  const router = useRouter();
  const { role, signOut, user } = useAuth();
  const isProdutor = role === 'PRODUTOR';
  const isAdmin = role === 'ADMIN';
  const isEventPage = /^\/eventos\/[^/]+$/.test(pathname) || /^\/meus-ingressos\/[^/]+$/.test(pathname);

  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

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
    toast.success('Logout realizado com sucesso!');
    router.push('/');
  };

  const fullName = user ? `${user.nome ?? ''} ${user.sobrenome ?? ''}`.trim() : '';

  return (
    <header className="w-full">

      {/* ── MOBILE ─────────────────────────────────────────────────── */}
      <div className="lg:hidden flex items-center h-16 px-4 relative w-full">
        {/* Botão voltar — só em páginas de evento */}
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

        {/* Logo centralizado */}
        <Link
          href="/"
          className="absolute left-1/2 -translate-x-1/2 font-gooddog font-bold text-[1.65rem] leading-none text-transparent bg-clip-text bg-gradient-to-r from-[#9944CC] to-[#3399FF]"
        >
          nokta tickets
        </Link>

        {/* Hambúrguer — direita */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <button className="ml-auto flex items-center justify-center h-9 w-9 rounded-full hover:bg-black/5 transition" aria-label="Abrir menu">
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

            {/* Avatar + nome */}
            <div className="px-5 pb-4 flex items-center gap-3">
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarImage src={undefined} />
                <AvatarFallback className="bg-violet-100 text-[#9944CC] font-bold text-sm">
                  {fullName ? fullName[0].toUpperCase() : <User size={16} />}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-[14px] font-bold text-[#0F172A] truncate leading-tight">
                  {fullName || 'Minha conta'}
                </p>
                {user?.email && (
                  <p className="text-[12px] text-gray-400 truncate">{user.email}</p>
                )}
              </div>
            </div>

            <div className="w-full h-[2px] bg-gradient-to-r from-[#9944CC] via-[#D86CFA] to-[#3399FF] mb-2" />

            {/* Nav links */}
            <nav className="flex flex-col px-4 py-2 gap-0.5">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link key={link.href} href={link.href}
                    className={`font-sans px-4 py-3 rounded-xl text-[15px] font-medium transition-colors ${
                      isActive ? 'text-[#9944CC] bg-violet-50' : 'text-gray-600 hover:text-[#9944CC] hover:bg-gray-100'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}

              {[
                { href: '/meus-ingressos', label: 'Meus ingressos', icon: <Ticket size={16} /> },
                { href: '/favoritos',      label: 'Favoritos',      icon: <HeartIcon size={16} /> },
                { href: '/perfil',         label: 'Meu perfil',     icon: <User size={16} /> },
                ...(isProdutor ? [{ href: '/produtor/metricas', label: 'Área do produtor', icon: <Briefcase size={16} /> }] : []),
                ...(isAdmin    ? [{ href: '/admin',    label: 'Admin',             icon: <Shield size={16} /> }]    : []),
              ].map(({ href, label, icon }) => (
                <Link key={href} href={href}
                  className={`font-sans flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] font-medium transition-colors ${
                    pathname === href ? 'text-[#9944CC] bg-violet-50' : 'text-gray-600 hover:text-[#9944CC] hover:bg-gray-100'
                  }`}
                >
                  {icon}{label}
                </Link>
              ))}
            </nav>

            {/* Links de suporte */}
            <div className="mt-auto px-4 pb-2">
              <div className="w-full h-[2px] bg-gradient-to-r from-[#9944CC] via-[#D86CFA] to-[#3399FF] mb-3" />
              {[
                { label: 'Central de ajuda', href: '/ajuda' },
                { label: 'Fale com suporte', href: '/suporte' },
                { label: 'Termos e políticas', href: '/termos' },
              ].map(({ label, href }) => (
                <Link key={href} href={href} className="font-sans block px-4 py-2.5 text-[13px] text-gray-500 hover:text-[#9944CC] transition-colors rounded-xl hover:bg-gray-100">
                  {label}
                </Link>
              ))}
            </div>

            {/* Logout */}
            <div className="px-5 pb-8 pt-4">
              <button onClick={handleLogout}
                className="font-sans w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-red-100 text-red-500 text-[14px] font-semibold hover:bg-red-50 transition-colors"
              >
                <LogOut size={16} /> Sair
              </button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* ── DESKTOP ─────────────────────────────────────────────────── */}
      <div className="hidden lg:flex max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 items-center h-20">

        {/* Logo — esquerda */}
        <div className="flex-1 flex items-center">
          <Link href="/" className="font-bold font-gooddog text-[1.75rem] leading-none text-transparent bg-clip-text bg-gradient-to-r from-[#9944CC] to-[#3399FF]">
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

        {/* Menu do usuário — direita */}
        <div className="flex flex-1 justify-end items-center">
          <UserDropdownMenu />
        </div>
      </div>

      <div className="w-full h-[2px] bg-gradient-to-r from-[#9944CC] via-[#D86CFA] to-[#3399FF]" />
    </header>
  );
}
