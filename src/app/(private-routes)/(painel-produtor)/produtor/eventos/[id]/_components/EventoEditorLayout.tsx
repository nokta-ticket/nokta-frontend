"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { EventoEditorSidebar } from "./EventoEditorSidebar"
import { EventoEditorHeader } from "./EventoEditorHeader"
import { EventoData, SectionProps } from "./types"
import { DEFAULT_SECTION } from "./section-registry"
import SectionVisaoGeral from "./sections/SectionVisaoGeral"
import SectionInformacoes from "./sections/SectionInformacoes"
import SectionDetalhes from "./sections/SectionDetalhes"
import SectionIngressos from "./sections/SectionIngressos"
import SectionImagens from "./sections/SectionImagens"
import SectionPublicacao from "./sections/SectionPublicacao"
import SectionConfiguracoes from "./sections/SectionConfiguracoes"
import SectionCupons from "./sections/SectionCupons"
import SectionVendas from "./sections/SectionVendas"

const SECTION_COMPONENTS: Record<string, React.ComponentType<SectionProps>> = {
  "visao-geral":   SectionVisaoGeral,
  "informacoes":   SectionInformacoes,
  "detalhes":      SectionDetalhes,
  "ingressos":     SectionIngressos,
  "imagens":       SectionImagens,
  "publicacao":    SectionPublicacao,
  "configuracoes": SectionConfiguracoes,
  "cupons":        SectionCupons,
  "vendas":        SectionVendas,
}

interface Props {
  event: EventoData
  onRefresh: () => void
}

export function EventoEditorLayout({ event, onRefresh }: Props) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const activeKey = searchParams.get("tab") || DEFAULT_SECTION

  const ActiveSection =
    SECTION_COMPONENTS[activeKey] ?? SECTION_COMPONENTS[DEFAULT_SECTION]

  const handleSelect = (key: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", key)
    router.push(`?${params.toString()}`, { scroll: false })
  }

  return (
    <section className="w-full max-w-[1200px] mx-auto">
      <EventoEditorHeader event={event} />
      <div className="flex gap-5 items-start">
        <EventoEditorSidebar activeKey={activeKey} onSelect={handleSelect} />
        <main className="flex-1 min-w-0">
          <ActiveSection event={event} onRefresh={onRefresh} />
        </main>
      </div>
    </section>
  )
}
