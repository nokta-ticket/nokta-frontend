'use client'

import { useRouter } from 'next/navigation'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/context/AuthContext'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar'

export function SidebarUserFooter() {
  const { user, isAuthResolved } = useAuth()
  const router = useRouter()

  const handleRedirect = () => {
    router.push('/')
  }

  if (!isAuthResolved || !user) {
    return (
      <div className="px-4 pb-4 text-sm text-muted-foreground">
        Carregando...
      </div>
    )
  }

  const firstInitial = user.nome?.charAt(0).toUpperCase() || '?'
  const lastInitial = user.sobrenome?.charAt(0).toUpperCase() || '?'
  const fullName = `${user.nome ?? ''} ${user.sobrenome ?? ''}`.trim()
  const email = user.email ?? ''

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="px-4 -ml-4 pb-4 text-xs text-white/70 cursor-pointer w-full">
          <div className="flex items-center gap-2">
            <Avatar className="w-10 h-10 rounded-full">
              <AvatarImage src="/user_default.png" alt="Avatar do usuário" />
              <AvatarFallback>
                {firstInitial}
                {lastInitial}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col leading-tight">
              <span className="font-semibold text-white truncate max-w-[150px]">
                {fullName || 'Usuário'}
              </span>
              <span
                className="text-white/60 truncate max-w-[150px]"
                title={email}
              >
                {email}
              </span>
            </div>
          </div>
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        sideOffset={4}
        className="w-48 bg-white shadow-md border rounded-md"
      >
        <DropdownMenuItem
          onClick={handleRedirect}
          className="text-sm cursor-pointer hover:bg-muted font-medium px-3 py-2"
        >
          Voltar para o site
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}