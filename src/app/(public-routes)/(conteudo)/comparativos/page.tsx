import { buildMetadata } from "@/lib/seo/metadata";
import { SectionIndexPage } from "../_section-index";

export const metadata = buildMetadata({
  site: "marketing",
  path: "/comparativos",
  title: "Comparativos: Nokta e outras plataformas de ingressos e sistemas para bar",
  description: "Compare a Nokta com outras plataformas de venda de ingressos e sistemas para bar e restaurante: recursos, forma de cobrança, repasse e operação no celular.",
});

export default function ComparativosPage() {
  return <SectionIndexPage section="comparativos" title="Compare antes de escolher" lede="Lado a lado, com o que cada plataforma informa publicamente. Onde não há informação pública, a gente diz que não há — sem chute." />;
}
