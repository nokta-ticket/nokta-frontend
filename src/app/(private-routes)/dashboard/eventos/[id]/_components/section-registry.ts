import type { IconName } from "@/components/ui/icon";

export interface SectionMeta {
  key: SectionKey;
  label: string;
  icon: IconName;
}

export const SECTION_KEYS = ["visao-geral", "informacoes", "detalhes", "ingressos", "imagens", "publicacao", "configuracoes", "cupons", "lista-vip", "vendas", "equipe", "access"] as const;
export type SectionKey = (typeof SECTION_KEYS)[number];

// "access" (Nokta Access, check-in offline) desativado a pedido do usuário
// em 2026-08-21: o modelo exige um roteador Wi-Fi físico dedicado no local
// do evento pra conectar os celulares ao Hub sem internet — infraestrutura
// considerada gambiarra demais frente a alternativas mais simples (ex.
// Starlink garantindo internet ao cliente). Módulo mantido no código
// (nunca apagado, ver EventFreezeModule que ainda depende de
// AccessSnapshotService/AccessOperationalLogService), só a aba sumiu da
// UI: `?tab=access` ainda renderiza se alguém digitar a URL, mas nenhum
// link aponta pra cá. Ver comentário equivalente em nokta-api/.../access.module.ts.
export const SECTIONS: SectionMeta[] = [
  { key: "visao-geral", label: "Visão geral", icon: "columns" },
  { key: "informacoes", label: "Informações", icon: "info" },
  { key: "detalhes", label: "Detalhes", icon: "file-lines" },
  { key: "ingressos", label: "Ingressos", icon: "ticket" },
  { key: "imagens", label: "Imagens", icon: "image" },
  { key: "publicacao", label: "Publicação", icon: "globe" },
  { key: "cupons", label: "Cupons", icon: "tag" },
  { key: "lista-vip", label: "Lista VIP", icon: "crown" },
  { key: "vendas", label: "Vendas", icon: "chart-line" },
  { key: "equipe", label: "Equipe", icon: "users" },
  { key: "configuracoes", label: "Configurações", icon: "settings" },
];

export const DEFAULT_SECTION: SectionKey = "visao-geral";
