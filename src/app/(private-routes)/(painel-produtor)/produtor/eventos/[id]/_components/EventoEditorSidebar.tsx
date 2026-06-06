"use client"

import { cn } from "@/lib/utils"
import { SECTIONS, SectionMeta } from "./section-registry"

interface Props {
  activeKey: string
  onSelect: (key: string) => void
}

export function EventoEditorSidebar({ activeKey, onSelect }: Props) {
  return (
    <aside className="w-[210px] shrink-0">
      <div className="rounded-2xl border border-gray-200/80 bg-white overflow-hidden shadow-sm sticky top-4">
        <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-primary/[0.04] to-transparent">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Seções</p>
        </div>
        <nav className="p-2 space-y-0.5">
          {SECTIONS.map((s) => (
            <SidebarItem
              key={s.key}
              section={s}
              isActive={activeKey === s.key}
              onClick={() => !s.disabled && onSelect(s.key)}
            />
          ))}
        </nav>
      </div>
    </aside>
  )
}

function SidebarItem({
  section,
  isActive,
  onClick,
}: {
  section: SectionMeta
  isActive: boolean
  onClick: () => void
}) {
  const Icon = section.icon

  return (
    <button
      onClick={onClick}
      disabled={section.disabled}
      className={cn(
        "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all duration-150",
        "text-[13px] font-medium",
        isActive
          ? "bg-primary/10 text-primary"
          : section.disabled
            ? "text-gray-300 cursor-not-allowed"
            : "text-gray-600 hover:bg-gray-100/70 hover:text-gray-900"
      )}
    >
      <Icon
        className={cn(
          "w-4 h-4 shrink-0",
          isActive ? "text-primary" : section.disabled ? "text-gray-300" : "text-gray-400"
        )}
      />
      <span className="flex-1 truncate">{section.label}</span>
      {section.comingSoon && (
        <span className="text-[9px] font-semibold bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-full leading-none">
          breve
        </span>
      )}
    </button>
  )
}
