import { buildMetadata } from "@/lib/seo/metadata";
import { SectionIndexPage } from "../_section-index";

export const metadata = buildMetadata({
  site: "marketing",
  path: "/guias",
  title: "Guias para produtores de eventos e donos de bar",
  description: "Como vender ingressos online, calcular o preço do ingresso, montar lista VIP, divulgar a festa, criar cardápio digital e controlar o estoque do bar.",
});

export default function GuiasPage() {
  return <SectionIndexPage section="guias" title="Guias pra quem faz a noite" lede="Passo a passo direto ao ponto, escrito por quem opera evento e bar todo fim de semana." />;
}
