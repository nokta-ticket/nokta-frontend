"use client";

import type { ComponentType } from "react";
import { useUrlTab } from "../../../_hooks/use-url-tab";
import { EventoEditorHeader } from "./EventoEditorHeader";
import { EventoEditorTabs } from "./EventoEditorTabs";
import { DEFAULT_SECTION, SECTION_KEYS, type SectionKey } from "./section-registry";
import type { EventoData, SectionProps } from "./types";
import SectionVisaoGeral from "./sections/SectionVisaoGeral";
import SectionInformacoes from "./sections/SectionInformacoes";
import SectionDetalhes from "./sections/SectionDetalhes";
import SectionIngressos from "./sections/SectionIngressos";
import SectionImagens from "./sections/SectionImagens";
import SectionPublicacao from "./sections/SectionPublicacao";
import SectionConfiguracoes from "./sections/SectionConfiguracoes";
import SectionCupons from "./sections/SectionCupons";
import SectionVendas from "./sections/SectionVendas";
import SectionEquipe from "./sections/SectionEquipe";
import SectionAccess from "./sections/SectionAccess";

const SECTION_COMPONENTS: Record<SectionKey, ComponentType<SectionProps>> = {
  "visao-geral": SectionVisaoGeral,
  informacoes: SectionInformacoes,
  detalhes: SectionDetalhes,
  ingressos: SectionIngressos,
  imagens: SectionImagens,
  publicacao: SectionPublicacao,
  configuracoes: SectionConfiguracoes,
  cupons: SectionCupons,
  vendas: SectionVendas,
  equipe: SectionEquipe,
  // "access" não tem aba (ver section-registry.ts) — só renderiza por URL.
  access: SectionAccess,
};

/** Editor do evento: cabeçalho + abas sincronizadas com `?tab=` + seção ativa. Também usado pelo painel admin. */
export function EventoEditorLayout({ event, onRefresh }: { event: EventoData; onRefresh: () => void }) {
  const [activeKey, setTab] = useUrlTab<SectionKey>(SECTION_KEYS, DEFAULT_SECTION);
  const ActiveSection = SECTION_COMPONENTS[activeKey] ?? SECTION_COMPONENTS[DEFAULT_SECTION];

  return (
    <div className="space-y-5">
      <EventoEditorHeader event={event} onRefresh={onRefresh} onGoTo={setTab} />
      <EventoEditorTabs value={activeKey} onChange={setTab} />
      <div key={activeKey} className="route-enter">
        <ActiveSection event={event} onRefresh={onRefresh} onGoTo={setTab} />
      </div>
    </div>
  );
}
