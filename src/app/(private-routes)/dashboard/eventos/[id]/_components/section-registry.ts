import {
  LayoutDashboard,
  Info,
  FileText,
  Ticket,
  ImageIcon,
  Globe,
  Settings,
  Tag,
  BarChart2,
  QrCode,
  Users,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

export interface SectionMeta {
  key: string
  label: string
  icon: LucideIcon
  disabled?: boolean
  comingSoon?: boolean
}

export const SECTIONS: SectionMeta[] = [
  { key: "visao-geral",   label: "Visão Geral",   icon: LayoutDashboard },
  { key: "informacoes",   label: "Informações",   icon: Info },
  { key: "detalhes",      label: "Detalhes",      icon: FileText },
  { key: "ingressos",     label: "Ingressos",     icon: Ticket },
  { key: "imagens",       label: "Imagens",       icon: ImageIcon },
  { key: "publicacao",    label: "Publicação",    icon: Globe },
  { key: "configuracoes", label: "Configurações", icon: Settings },
  { key: "cupons",        label: "Cupons",        icon: Tag },
  { key: "vendas",        label: "Vendas",        icon: BarChart2 },
  { key: "equipe",        label: "Equipe",         icon: Users },
  { key: "checkin",       label: "Check-in",      icon: QrCode, disabled: true, comingSoon: true },
]

export const DEFAULT_SECTION = "visao-geral"
