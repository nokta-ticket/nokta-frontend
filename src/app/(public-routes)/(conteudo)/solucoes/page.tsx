import { buildMetadata } from "@/lib/seo/metadata";
import { SectionIndexPage } from "../_section-index";

export const metadata = buildMetadata({
  site: "marketing",
  path: "/solucoes",
  title: "Soluções para eventos, festas, bares e restaurantes",
  description: "Venda de ingressos, lista VIP, check-in, promoters, cardápio digital com QR, comandas, reservas e estoque. Veja o que a Nokta resolve na sua operação.",
});

export default function SolucoesPage() {
  return <SectionIndexPage section="solucoes" title="Tudo que a sua noite precisa" lede="Da venda do primeiro ingresso ao fechamento do caixa do bar. Escolha a parte que resolve o seu problema hoje e ligue as outras quando fizer sentido." />;
}
