'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { toast } from '@/lib/toast'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar'
import {
  ChevronDown,
  HeartIcon,
  LogOut,
  Ticket,
  User,
  UserPlus,
  Briefcase,
  Shield,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

export function UserDropdownMenu() {
  const router = useRouter()
  const pathname = usePathname()
  const menuRef = useRef<HTMLDivElement>(null)
  const { role, signOut, user } = useAuth()
  const isProdutor = role === 'PRODUTOR'
  const isAdmin = role === 'ADMIN'
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  useEffect(() => setOpen(false), [pathname])

  const handleLogout = async () => {
    // Fase 5: signOut() já chama POST /auth/logout (limpa o cookie HttpOnly
    // no backend) — não precisa duplicar a chamada aqui.
    signOut()
    toast.success('Logout realizado com sucesso!')
    // Navegação forçada — ver header-private.tsx.
    window.location.href = '/'
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="cursor-pointer flex items-center rounded-full border border-gray-300 px-3 py-1 transition hover:shadow-sm"
      >
        <Avatar className="h-10 w-10 rounded-full">
          {user?.fotoPerfil ? (
            <AvatarImage src={user.fotoPerfil} alt="Usuário" />
          ) : (
            <AvatarImage src="/user_default.png" alt="Usuário" />
          )}
          <AvatarFallback>
            <img src="/user_default.png" alt="Usuário padrão" />
          </AvatarFallback>
        </Avatar>
        <ChevronDown className="ml-2 h-4 w-4 text-gray-500" />
      </button>

      {open && (
        <div className="cursor-pointer absolute z-50 mt-2 w-56 rounded-md border bg-white shadow-lg right-1/2 translate-x-1/2 lg:right-0 lg:translate-x-0">
          <div className="px-4 py-2 text-sm font-medium text-gray-900">
            Minha Conta
          </div>

          <ul className="flex flex-col gap-1 p-1 text-sm">
            {isAdmin ? (
              <li>
                <Link
                  href="/admin/dashboard"
                  className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-gray-100"
                >
                  <Shield size={16} className="text-gray-500" />
                  Painel Admin
                </Link>
              </li>
            ) : (
              <>
                <li>
                  <Link
                    href="/meus-ingressos"
                    className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-gray-100"
                  >
                    <Ticket size={16} className="text-gray-500" />
                    Meus Ingressos
                  </Link>
                </li>

                <li>
                  <Link
                    href="/perfil"
                    className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-gray-100"
                  >
                    <User size={16} className="text-gray-500" />
                    Meu Perfil
                  </Link>
                </li>

                <li>
                  <Link
                    href="/favoritos"
                    className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-gray-100"
                  >
                    <HeartIcon size={16} className="text-gray-500" />
                    Favoritos
                  </Link>
                </li>

                <li>
                  <Link
                    href={isProdutor ? '/produtor/metricas' : '/para-produtores'}
                    className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-gray-100"
                  >
                    {isProdutor ? (
                      <>
                        <Briefcase size={16} className="text-gray-500" />
                        Painel Produtor
                      </>
                    ) : (
                      <>
                        <UserPlus size={16} className="text-gray-500" />
                        Virar Produtor
                      </>
                    )}
                  </Link>
                </li>
              </>
            )}

            <hr className="my-1 border-gray-200" />

            <li>
              <button
                onClick={handleLogout}
                className="cursor-pointer flex w-full items-center justify-center gap-2 rounded-md px-3 py-2 text-red-600 hover:bg-red-50"
              >
                <LogOut size={16} />
                Sair
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  )
}
