'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'
import { Logo } from './logo-painel'
import { SidebarNav } from './sidebar-nav'
import { sidebarLinks } from './sidebar-links'
import { Separator } from '@/components/ui/separator'
import { SidebarUserFooter } from './sidebar-user-footer'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'

export default function Sidebar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  return (
    <>
      <header
        className="flex items-center gap-3 p-4 bg-[#151619] lg:hidden"
      >
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Abrir menu">
              <Menu className="w-5 h-5 text-white" />
            </Button>
          </SheetTrigger>

          <SheetContent side="left" className="w-60 p-4 bg-black border-black flex flex-col text-sm">
              <SheetHeader>
                <SheetTitle className="sr-only">Menu de navegação</SheetTitle>
              </SheetHeader>
            <SidebarNav items={sidebarLinks} />
            <Separator className="my-4 bg-white/10 mt-auto" />
            <SidebarUserFooter />
          </SheetContent>
        </Sheet>

        <Logo size={32} />
      </header>

      <aside className="hidden lg:flex w-60 mt-5 p-4 flex-col text-sm">
        <div className="flex justify-center">
          <Logo size={80} />
        </div>

        <Separator className="my-6 bg-white/10" />
        <SidebarNav items={sidebarLinks} />
        <Separator className="my-4 bg-white/10 mt-auto" />
        <SidebarUserFooter />
      </aside>
    </>
  )
}
