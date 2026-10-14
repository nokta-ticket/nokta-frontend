import { ContentHero, ContentSection, CtaBand, SectionIndex } from "@/components/marketing/content";
import { SECTION_META, entriesFor, type ContentSection as Section } from "@/content/marketing/registry";

/** Página-índice padrão de uma seção de conteúdo. */
export function SectionIndexPage({ section, title, lede }: { section: Section; title: string; lede: string }) {
  const meta = SECTION_META[section];
  return (
    <>
      <ContentHero crumbs={[{ name: meta.title, path: meta.path }]} title={title} lede={lede} cta={false} />
      <ContentSection id="paginas" wide>
        <SectionIndex entries={entriesFor(section)} />
      </ContentSection>
      <CtaBand />
    </>
  );
}
