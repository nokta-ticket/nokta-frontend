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

// "access" (Nokta Access, check-in offline) desativado a pedido do usuário
// em 2026-08-21: o modelo exige um roteador Wi-Fi físico dedicado no local
// do evento pra conectar os celulares ao Hub sem internet — infraestrutura
// considerada gambiarra demais frente a alternativas mais simples (ex.
// Starlink garantindo internet ao cliente). Módulo mantido no código
// (nunca apagado, ver EventFreezeModule que ainda depende de
// AccessSnapshotService/AccessOperationalLogService), só a aba sumiu da
// UI. Ver comentário equivalente em nokta-api/.../access.module.ts.
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
]

export const DEFAULT_SECTION = "visao-geral"
