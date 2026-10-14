"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SECTIONS, type SectionKey } from "./section-registry";

/** Navegação das seções do editor: abas sublinhadas, rolam na horizontal no celular. */
export function EventoEditorTabs({ value, onChange }: { value: SectionKey; onChange: (key: SectionKey) => void }) {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as SectionKey)} className="-mx-4 px-4 lg:mx-0 lg:px-0">
      <TabsList variant="line" aria-label="Seções do evento">
        {SECTIONS.map((s) => (
          <TabsTrigger key={s.key} value={s.key}>
            {s.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
