"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ChevronRight, Download, Loader2, Upload } from "lucide-react";
import { useOrganizations } from "@/context/OrganizationContext";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { crmApi, crmKeys, type CrmFilters, type CrmOverview } from "@/services/crm";
import { PageContainer } from "../_components/page/page-container";
import { useRequireWorkspace } from "../_components/require-workspace-provider";
import { EmptyState } from "../_components/states/empty-state";
import { BlockSkeleton } from "../_components/states/loading-state";
import { InfoTip, PANORAMA, PRESSABLE, SURFACE } from "../financeiro/_components/finance-ui";
import { AudiencesTab } from "./_components/audiences-tab";
import { ContactsTab } from "./_components/contacts-tab";
import { BTN_SECONDARY, ChannelIcon, ELIGIBILITY_RULE, num, sameFilters, useCrmPermissions } from "./_components/crm-ui";
import { ImportsTab } from "./_components/imports-tab";
import { CampaignsTab } from "./_components/campaigns-tab";
import { ChannelsTab } from "./_components/channels-tab";
import { TemplatesTab } from "./_components/templates-tab";
import { crmMarketingApi, crmMarketingKeys } from "@/services/crm-marketing";

type TabKey = "contacts" | "audiences" | "campaigns" | "templates" | "channels";
const TABS: [TabKey, string][] = [
  ["contacts", "Contatos"],
  ["audiences", "Públicos"],
  ["campaigns", "Campanhas"],
  ["templates", "Modelos"],
  ["channels", "Canais"],
];

const RECURRING: CrmFilters = { minOrders: 2 };
const INACTIVE: CrmFilters = { inactiveDays: 90 };
const IMPORTED: CrmFilters = { sources: ["IMPORT"] };

/**
 * Clientes: a lista de quem compra do produtor, os públicos que ele recorta,
 * as campanhas que ele manda e os canais por onde elas saem. Todo número do
 * topo filtra a lista de contatos.
 */
export default function ClientesPage() {
  const { currentOrg, activeModuleKeys, loadingOrgs, loadingModules } = useOrganizations();
  const { guard } = useRequireWorkspace();
  const orgId = currentOrg?.id ?? null;

  const [tab, setTab] = useState<TabKey>("contacts");
  // Importações são parte de Contatos: a lista dá lugar à importação e volta.
  const [importing, setImporting] = useState(false);
  const [filters, setFilters] = useState<CrmFilters>({});
  const [exporting, setExporting] = useState(false);
  const perms = useCrmPermissions();

  useEffect(() => {
    setFilters({});
    setTab("contacts");
    setImporting(false);
  }, [orgId]);

  const enabled = orgId !== null && activeModuleKeys.includes("tickets");
  const overview = useQuery({ queryKey: crmKeys.overview(orgId ?? -1), queryFn: () => crmApi.overview(orgId as number), enabled });
  const imported = useQuery({
    queryKey: crmKeys.contacts(orgId ?? -1, { count: "imported" }),
    queryFn: () => crmApi.listContacts(orgId as number, IMPORTED, { page: 1, perPage: 1, sort: "created", dir: "desc" }),
    enabled,
  });
  const options = useQuery({ queryKey: crmKeys.options(orgId ?? -1), queryFn: () => crmApi.filterOptions(orgId as number), enabled, staleTime: 5 * 60_000 });
  const segments = useQuery({ queryKey: crmKeys.segments(orgId ?? -1), queryFn: () => crmApi.listSegments(orgId as number), enabled });
  const channels = useQuery({ queryKey: crmMarketingKeys.channels(orgId ?? -1), queryFn: () => crmMarketingApi.channels(orgId as number), enabled });

  if (loadingOrgs || loadingModules) {
    return (
      <PageContainer>
        <BlockSkeleton className="h-96" />
      </PageContainer>
    );
  }
  if (!currentOrg || orgId === null) {
    return (
      <PageContainer>
        <EmptyState title="Nada por aqui ainda" description="Crie seu workspace para ver quem compra de você." actionLabel="Criar workspace" onAction={() => guard(() => {})} />
      </PageContainer>
    );
  }
  if (!enabled) {
    return (
      <PageContainer>
        <EmptyState title="Clientes ainda não está ativo" description="Ative Eventos e ingressos em Explore a Nokta para ver quem compra de você." />
      </PageContainer>
    );
  }
  const forbidden = (overview.error as { response?: { status?: number } } | null)?.response?.status === 403;
  if (forbidden) {
    return (
      <PageContainer>
        <EmptyState title="Sem acesso aos clientes" description="Só o proprietário ou um gerente do workspace vê a lista de clientes." />
      </PageContainer>
    );
  }

  function applyFilters(next: CrmFilters) {
    setFilters(next);
    setImporting(false);
    setTab("contacts");
  }
  function goTo(next: TabKey) {
    setImporting(false);
    setTab(next);
  }

  async function exportCsv() {
    setExporting(true);
    try {
      const blob = await crmApi.exportContacts(orgId as number, filters);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "contatos.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(getErrorMessage(error, "Não foi possível exportar os contatos."));
    } finally {
      setExporting(false);
    }
  }

  return (
    <PageContainer>
      {tab !== "contacts" && tab !== "audiences" ? null : overview.isError ? (
        <div className={cn(SURFACE, "flex flex-col items-center gap-3 px-6 py-12 text-center")}>
          <p className="text-[14px] text-[#5f5c6b]">Não foi possível carregar seus clientes agora.</p>
          <button type="button" onClick={() => void overview.refetch()} className={cn("rounded-[10px] bg-[#1c1a24] px-4 py-2 text-[13.5px] font-semibold text-white", PRESSABLE)}>
            Tentar de novo
          </button>
        </div>
      ) : !overview.data ? (
        <div className="grid gap-3 sm:gap-4 2xl:grid-cols-[minmax(0,5fr)_minmax(0,9fr)]">
          <BlockSkeleton className="h-[176px] rounded-[20px]" />
          <BlockSkeleton className="h-[176px] rounded-[20px]" />
        </div>
      ) : (
        <div className="grid gap-3 sm:gap-4 2xl:grid-cols-[minmax(0,5fr)_minmax(0,9fr)]">
          <ReachCard overview={overview.data} onPick={applyFilters} />
          <section aria-label="Recortes prontos" className={cn(SURFACE, "grid grid-cols-3 overflow-hidden")}>
            <Cut
              label="Recorrentes"
              hint="Compraram duas vezes ou mais"
              value={overview.data.recurring}
              active={sameFilters(filters, RECURRING)}
              onClick={() => applyFilters(RECURRING)}
              divider="border-r border-[#f2f0f7]"
            />
            <Cut
              label="Sumidos"
              hint="Sem comprar há 90 dias ou mais"
              value={overview.data.inactive90Days}
              active={sameFilters(filters, INACTIVE)}
              onClick={() => applyFilters(INACTIVE)}
              divider="border-r border-[#f2f0f7]"
            />
            <Cut
              label="Trazidos por você"
              hint="Vieram das suas planilhas"
              value={imported.data?.total ?? null}
              active={sameFilters(filters, IMPORTED)}
              onClick={() => applyFilters(IMPORTED)}
              divider=""
            />
          </section>
        </div>
      )}

      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3 border-b border-[#ebe8f2]">
        <div role="tablist" aria-label="Seções de clientes" className="-mb-px flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {TABS.map(([k, l]) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={tab === k}
              onClick={() => goTo(k)}
              className={cn(
                "shrink-0 whitespace-nowrap px-3 pb-3 pt-1 text-[15px] font-semibold outline-none transition-colors focus-visible:text-[#7c3aed]",
                tab === k ? "text-[#1c1a24] shadow-[inset_0_-2px_0_#7c3aed]" : "text-[#6b6878] hover:text-[#1c1a24]",
              )}
            >
              {l}
              {k === "audiences" && segments.data?.length ? <span className="ml-1.5 font-poppins text-[13px] font-medium tabular-nums text-[#8a8796]">{segments.data.length}</span> : null}
            </button>
          ))}
        </div>
        <div className={cn("flex gap-2 pb-2.5", tab !== "contacts" && "hidden")}>
          {perms.manage ? (
            <button type="button" onClick={() => setImporting(true)} className={cn(BTN_SECONDARY, PRESSABLE)}>
              <Upload size={16} strokeWidth={1.8} aria-hidden="true" />
              Importar
            </button>
          ) : null}
          {perms.exportData ? (
            <button type="button" onClick={() => void exportCsv()} disabled={exporting} className={cn(BTN_SECONDARY, PRESSABLE)}>
              {exporting ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Download size={16} strokeWidth={1.8} aria-hidden="true" />}
              Exportar
            </button>
          ) : null}
        </div>
      </div>

      {tab === "contacts" && !importing && <ContactsTab orgId={orgId} filters={filters} onFilters={setFilters} options={options.data} segments={segments.data ?? []} onGoTo={goTo} perms={perms} />}
      {tab === "contacts" && importing && perms.manage && (
        <div className="space-y-4">
          <button type="button" onClick={() => setImporting(false)} className={cn("flex items-center gap-2 rounded-md text-[15px] font-semibold text-[#1c1a24] outline-none hover:text-[#7c3aed] focus-visible:ring-2 focus-visible:ring-[#7c3aed]", PRESSABLE)}>
            <ArrowLeft size={17} strokeWidth={2} aria-hidden="true" />
            Importar contatos
          </button>
          <ImportsTab orgId={orgId} onDone={() => applyFilters(IMPORTED)} />
        </div>
      )}
      {tab === "audiences" && (
        <AudiencesTab orgId={orgId} segments={segments.data} loading={segments.isLoading} options={options.data} onOpen={applyFilters} onNew={() => applyFilters({})} canManage={perms.manage} />
      )}
      {tab === "campaigns" && <CampaignsTab orgId={orgId} segments={segments.data ?? []} options={options.data} onGoTo={goTo} canManage={perms.campaigns} />}
      {tab === "templates" && <TemplatesTab orgId={orgId} whatsappConnected={channels.data?.whatsapp.account?.status === "CONNECTED"} canManage={perms.campaigns} />}
      {tab === "channels" && <ChannelsTab orgId={orgId} canManage={perms.channels} />}
    </PageContainer>
  );
}

/** Tamanho da lista e quanto dela cada canal alcança. */
function ReachCard({ overview, onPick }: { overview: CrmOverview; onPick: (filters: CrmFilters) => void }) {
  return (
    <section className={cn(PANORAMA, "flex flex-col justify-between gap-5 p-6")}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="flex items-center gap-1.5 text-[14px] font-medium text-white/80">
          Sua lista
          <InfoTip dark label="Como é contado quem pode receber" text={ELIGIBILITY_RULE} />
        </h2>
        <button type="button" onClick={() => onPick({})} className={cn("flex items-center gap-1 rounded-md text-[13px] font-medium text-white/70 outline-none hover:text-white focus-visible:ring-2 focus-visible:ring-white/60", PRESSABLE)}>
          Ver todos
          <ChevronRight size={14} strokeWidth={2} aria-hidden="true" />
        </button>
      </div>
      <p className="font-poppins text-[34px] font-bold leading-none tabular-nums">
        {num(overview.total)}
        <span className="ml-2 font-sans text-[15px] font-medium text-white/70">{overview.total === 1 ? "pessoa" : "pessoas"}</span>
      </p>
      <div className="grid gap-3 sm:grid-cols-2 sm:gap-6">
        <Reach channel="EMAIL" label="Podem receber e-mail" value={overview.emailEligible} total={overview.total} onClick={() => onPick({ eligibleChannel: "EMAIL" })} />
        <Reach channel="WHATSAPP" label="Podem receber WhatsApp" value={overview.whatsappEligible} total={overview.total} onClick={() => onPick({ eligibleChannel: "WHATSAPP" })} />
      </div>
    </section>
  );
}

function Reach({ channel, label, value, total, onClick }: { channel: "EMAIL" | "WHATSAPP"; label: string; value: number; total: number; onClick: () => void }) {
  const share = total ? Math.round((value / total) * 100) : 0;
  return (
    <button type="button" onClick={onClick} className={cn("group block rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-white/60", PRESSABLE)}>
      <span className="flex items-center justify-between gap-3 text-[13.5px] text-white/75 group-hover:text-white">
        <span className="flex items-center gap-2">
          <ChannelIcon channel={channel} />
          {label}
        </span>
        <span className="font-poppins font-semibold tabular-nums text-white">
          {num(value)} <span className="font-medium text-white/55">· {share}%</span>
        </span>
      </span>
      <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-white/12">
        <span className="block h-full rounded-full bg-[#a78bfa] transition-[width] duration-500 ease-out" style={{ width: `${share}%` }} />
      </span>
    </button>
  );
}

/** Recorte pronto: o número é o atalho para a lista filtrada. */
function Cut({ label, hint, value, active, onClick, divider }: { label: string; hint: string; value: number | null; active: boolean; onClick: () => void; divider: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "group flex flex-col justify-between gap-3 p-4 text-left outline-none transition-colors hover:bg-[#faf8ff] focus-visible:bg-[#faf8ff] sm:gap-4 sm:p-6",
        active && "bg-[#f7f3ff] hover:bg-[#f7f3ff]",
        divider,
      )}
    >
      <span className="flex items-start justify-between gap-2 text-[13px] font-medium leading-snug text-[#3a3746] sm:text-[14px]">
        {label}
        <ChevronRight size={16} strokeWidth={2} className={cn("hidden shrink-0 text-[#b9b5c6] transition-transform sm:block duration-150 ease-out group-hover:translate-x-0.5 group-hover:text-[#7c3aed]", active && "text-[#7c3aed]")} aria-hidden="true" />
      </span>
      <span>
        <span className="block font-poppins text-[24px] font-bold leading-none tabular-nums text-[#1c1a24] sm:text-[30px]">{value === null ? "…" : num(value)}</span>
        <span className="mt-2 hidden text-[13px] text-[#6b6878] sm:block">{hint}</span>
      </span>
    </button>
  );
}
