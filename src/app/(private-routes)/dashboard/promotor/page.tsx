"use client";

import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUrlTab } from "../_hooks/use-url-tab";
import { useMyPromoterProfile } from "./_hooks/use-my-promoter";
import { ResumoTab } from "./_components/resumo-tab";
import { OrganizacoesTab } from "./_components/organizacoes-tab";
import { LinksVendasTab } from "./_components/links-vendas-tab";
import { MeusAcertosTab } from "./_components/meus-acertos-tab";

const TABS = ["resumo", "organizacoes", "links", "acertos"] as const;
type TabKey = (typeof TABS)[number];

export default function MeuPainelPromoterPage() {
  const { data: profile, isLoading } = useMyPromoterProfile();
  const [tab, setTab] = useUrlTab<TabKey>(TABS, "resumo");

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Meu painel de promotor" />
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-card" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-card" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="space-y-6">
        <PageHeader title="Meu painel de promotor" />
        <EmptyState icon="megaphone" title="Você ainda não é promoter" description="Quando aceitar um convite de promoter de alguma organização, seu painel aparece aqui." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Meu painel de promotor" description={`Olá, ${profile.displayName ?? "promotor"} — suas vendas, links, códigos e comissões.`} />

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)} className="-mx-4 px-4 lg:mx-0 lg:px-0">
        <TabsList variant="line" aria-label="Seções do painel de promotor">
          <TabsTrigger value="resumo">Resumo</TabsTrigger>
          <TabsTrigger value="organizacoes">Organizações</TabsTrigger>
          <TabsTrigger value="links">Links e vendas</TabsTrigger>
          <TabsTrigger value="acertos">Acertos</TabsTrigger>
        </TabsList>
      </Tabs>

      <div key={tab} className="route-enter">
        {tab === "resumo" && <ResumoTab />}
        {tab === "organizacoes" && <OrganizacoesTab />}
        {tab === "links" && <LinksVendasTab />}
        {tab === "acertos" && <MeusAcertosTab />}
      </div>
    </div>
  );
}
