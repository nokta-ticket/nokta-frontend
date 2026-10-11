"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronLeft, ChevronRight, Loader2, Search, SlidersHorizontal, Ticket, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { crmApi, crmKeys, type CrmChannel, type CrmContact, type CrmContactSort, type CrmFilterOptions, type CrmFilters, type CrmSegment, type CrmSourceType } from "@/services/crm";
import { BlockSkeleton } from "../../_components/states/loading-state";
import { PRESSABLE, SURFACE, brl, fmtDate } from "../../financeiro/_components/finance-ui";
import { ChannelDialog } from "./channel-dialog";
import { ContactSheet } from "./contact-sheet";
import type { CrmPermissions } from "./crm-ui";
import { BTN_PRIMARY, BTN_SECONDARY, ChannelIcon, ChannelMark, FIELD, LINK, SOURCE_LABEL, ago, describeFilters, formatPhone, hasFilters, num, people, sameFilters } from "./crm-ui";

const TH = "px-5 py-3 font-semibold";

export function ContactsTab({
  orgId,
  filters,
  onFilters,
  options,
  segments,
  onGoTo,
  perms,
}: {
  orgId: number;
  filters: CrmFilters;
  onFilters: (filters: CrmFilters) => void;
  options?: CrmFilterOptions;
  segments: CrmSegment[];
  onGoTo: (tab: "templates" | "channels") => void;
  perms: CrmPermissions;
}) {
  const [channelTarget, setChannelTarget] = useState<{ contact: CrmContact; channel: CrmChannel } | null>(null);
  const [searchInput, setSearchInput] = useState(filters.search ?? "");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [sort, setSort] = useState<CrmContactSort>("lastPurchase");
  const [dir, setDir] = useState<"asc" | "desc">("desc");
  const [openId, setOpenId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  // Filtro trocado por fora (recorte do topo, público salvo): a busca acompanha.
  useEffect(() => {
    setSearchInput(filters.search ?? "");
    setPage(1);
  }, [filters]);
  useEffect(() => {
    const t = setTimeout(() => {
      const search = searchInput.trim() || undefined;
      if (search !== filters.search) onFilters({ ...filters, search });
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const paging = { page, perPage, sort, dir };
  const list = useQuery({
    queryKey: crmKeys.contacts(orgId, { filters, ...paging }),
    queryFn: () => crmApi.listContacts(orgId, filters, paging),
    placeholderData: (prev) => prev,
  });

  const set = (patch: Partial<CrmFilters>) => onFilters({ ...filters, ...patch });
  const rows = list.data?.items;
  const total = list.data?.total ?? 0;
  const counts = list.data?.counts;
  const pages = Math.max(1, Math.ceil(total / perPage));
  const from = total ? (page - 1) * perPage + 1 : 0;
  const to = Math.min(page * perPage, total);
  const nums = [...new Set([1, page - 1, page, page + 1, pages])].filter((p) => p >= 1 && p <= pages).sort((a, b) => a - b);
  const active = hasFilters(filters);
  const savedAs = segments.find((s) => sameFilters(s.filters, filters));
  const purchasedEvent = options?.events.find((e) => e.id === filters.purchasedEventIds?.[0]);
  const advancedCount = [filters.attendedEventIds?.length, filters.ticketTypeIds?.length, filters.purchasedFrom, filters.purchasedTo, filters.minOrders, filters.inactiveDays].filter(Boolean).length;

  function toggleSort(key: CrmContactSort) {
    if (sort === key) setDir(dir === "desc" ? "asc" : "desc");
    else {
      setSort(key);
      setDir(key === "name" ? "asc" : "desc");
    }
    setPage(1);
  }
  const arrow = (key: CrmContactSort) => (
    <span aria-hidden="true" className={sort === key ? "text-[#7c3aed]" : "text-[#a19eae]"}>
      {sort === key ? (dir === "desc" ? "↓" : "↑") : "↕"}
    </span>
  );
  const SortTh = ({ k, children, right = false }: { k: CrmContactSort; children: ReactNode; right?: boolean }) => (
    <th scope="col" className={cn(TH, right && "text-right")} aria-sort={sort === k ? (dir === "desc" ? "descending" : "ascending") : "none"}>
      <button type="button" onClick={() => toggleSort(k)} className={cn("inline-flex items-center gap-1 rounded outline-none focus-visible:ring-2 focus-visible:ring-[#7c3aed]", right && "flex-row-reverse")}>
        {children} {arrow(k)}
      </button>
    </th>
  );

  return (
    <div className="space-y-4">
      {/* Públicos salvos: um toque troca a lista */}
      {segments.length > 0 ? (
        <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Públicos salvos">
          <Chip active={!active} onClick={() => onFilters({})}>
            Todos
          </Chip>
          {segments.map((s) => (
            <Chip key={s.id} active={sameFilters(s.filters, filters)} onClick={() => onFilters(s.filters)} count={s.counts.total}>
              {s.name}
            </Chip>
          ))}
        </div>
      ) : null}

      {/* Filtros */}
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <label className={cn(FIELD, "relative flex shrink-0 items-center pl-10 pr-4 xl:flex-1")}>
          <Search size={17} strokeWidth={1.8} className="pointer-events-none absolute left-3.5 text-[#6b6878]" aria-hidden="true" />
          <span className="sr-only">Pesquisar</span>
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Pesquisar por nome, e-mail ou telefone"
            className="h-full w-full bg-transparent text-base outline-none placeholder:text-[#8a8796] sm:text-[14px]"
          />
        </label>
        <div className="grid grid-cols-2 gap-3 sm:flex">
          <SelectField
            label="Evento em que comprou"
            icon={<Ticket size={17} strokeWidth={1.8} aria-hidden="true" />}
            value={filters.purchasedEventIds?.[0] ?? ""}
            onChange={(v) => set({ purchasedEventIds: v ? [Number(v)] : undefined, ticketTypeIds: undefined })}
            className="col-span-2 sm:w-[290px]"
          >
            <option value="">Comprou em qualquer evento</option>
            {(options?.events ?? []).map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </SelectField>
          <SelectField label="Origem" value={filters.sources?.[0] ?? ""} onChange={(v) => set({ sources: v ? [v as CrmSourceType] : undefined })} className="sm:w-[190px]">
            <option value="">Qualquer origem</option>
            {(Object.keys(SOURCE_LABEL) as CrmSourceType[]).map((s) => (
              <option key={s} value={s}>
                {SOURCE_LABEL[s]}
              </option>
            ))}
          </SelectField>
          <SelectField label="Canal" value={filters.eligibleChannel ?? ""} onChange={(v) => set({ eligibleChannel: (v || undefined) as CrmChannel | undefined })} className="sm:w-[190px]">
            <option value="">Qualquer canal</option>
            <option value="EMAIL">Podem receber e-mail</option>
            <option value="WHATSAPP">Podem receber WhatsApp</option>
          </SelectField>
          <Popover>
            <PopoverTrigger className={cn(BTN_SECONDARY, PRESSABLE, "col-span-2 h-11 rounded-[12px]", advancedCount > 0 && "border-[#c9b8f5] bg-[#f7f3ff] text-[#6d28d9]")}>
              <SlidersHorizontal size={16} strokeWidth={1.8} aria-hidden="true" />
              Mais filtros
              {advancedCount > 0 ? <span className="font-poppins tabular-nums">· {advancedCount}</span> : null}
            </PopoverTrigger>
            <PopoverContent align="end" sideOffset={8} className="w-[min(92vw,360px)] rounded-[16px] border-[#ebe8f2] bg-white p-5 shadow-[0_12px_32px_rgba(28,24,48,0.16)]">
              <div className="space-y-4 text-[#1c1a24]">
                <AdvancedField label="Foi ao evento" hint="Teve o ingresso validado na entrada">
                  <select value={filters.attendedEventIds?.[0] ?? ""} onChange={(e) => set({ attendedEventIds: e.target.value ? [Number(e.target.value)] : undefined })} className={cn(FIELD, "w-full px-3")}>
                    <option value="">Tanto faz</option>
                    {(options?.events ?? []).map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.name}
                      </option>
                    ))}
                  </select>
                </AdvancedField>
                <AdvancedField label="Tipo de ingresso" hint={purchasedEvent ? `Ingressos de ${purchasedEvent.name}` : "Escolha antes o evento em que comprou"}>
                  <select
                    value={filters.ticketTypeIds?.[0] ?? ""}
                    disabled={!purchasedEvent}
                    onChange={(e) => set({ ticketTypeIds: e.target.value ? [Number(e.target.value)] : undefined })}
                    className={cn(FIELD, "w-full px-3 disabled:bg-[#f7f6fa] disabled:text-[#8a8796]")}
                  >
                    <option value="">Qualquer ingresso</option>
                    {(purchasedEvent?.ticketTypes ?? []).map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </AdvancedField>
                <AdvancedField label="Comprou no período">
                  <div className="grid grid-cols-2 gap-2">
                    <input type="date" aria-label="De" value={filters.purchasedFrom ?? ""} onChange={(e) => set({ purchasedFrom: e.target.value || undefined })} className={cn(FIELD, "w-full px-3")} />
                    <input type="date" aria-label="Até" value={filters.purchasedTo ?? ""} onChange={(e) => set({ purchasedTo: e.target.value || undefined })} className={cn(FIELD, "w-full px-3")} />
                  </div>
                </AdvancedField>
                <div className="grid grid-cols-2 gap-3">
                  <AdvancedField label="Compras, no mínimo">
                    <NumberInput value={filters.minOrders} onChange={(v) => set({ minOrders: v })} placeholder="Ex.: 2" />
                  </AdvancedField>
                  <AdvancedField label="Sem comprar há">
                    <NumberInput value={filters.inactiveDays} onChange={(v) => set({ inactiveDays: v })} placeholder="dias" />
                  </AdvancedField>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Alcance do recorte + tabela */}
      <div className={cn(SURFACE, "overflow-hidden")}>
        <div className="flex flex-col gap-3 border-b border-[#ebe8f2] px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[14px] text-[#3a3746]">
              <span className="font-poppins text-[16px] font-semibold tabular-nums text-[#1c1a24]">{counts ? people(counts.total) : "…"}</span>
              {counts ? (
                <>
                  <span className="flex items-center gap-1.5">
                    <span className="text-emerald-700"><ChannelIcon channel="EMAIL" /></span>
                    <span className="font-poppins font-medium tabular-nums">{num(counts.emailEligible)}</span> podem receber e-mail
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="text-emerald-700"><ChannelIcon channel="WHATSAPP" /></span>
                    <span className="font-poppins font-medium tabular-nums">{num(counts.whatsappEligible)}</span> podem receber WhatsApp
                  </span>
                </>
              ) : null}
              {list.isFetching && rows ? <Loader2 size={15} className="animate-spin text-[#8a8796]" aria-label="Atualizando" /> : null}
            </p>
            {active ? <p className="mt-1.5 truncate text-[13px] text-[#6b6878]">{savedAs ? `Público "${savedAs.name}" · ` : ""}{describeFilters(filters, options).join(" · ")}</p> : null}
          </div>
          {active ? (
            <div className="flex shrink-0 items-center gap-3">
              <button type="button" onClick={() => onFilters({})} className={cn(LINK, "flex items-center gap-1", PRESSABLE)}>
                <X size={14} strokeWidth={2} aria-hidden="true" />
                Limpar
              </button>
              {!savedAs && perms.manage ? (
                <button type="button" onClick={() => setSaving(true)} className={cn(BTN_PRIMARY, PRESSABLE)}>
                  Salvar como público
                </button>
              ) : null}
            </div>
          ) : null}
        </div>

        {list.isLoading && !rows ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <BlockSkeleton key={i} className="h-12" />
            ))}
          </div>
        ) : list.isError && !rows ? (
          <div className="px-6 py-14 text-center">
            <p className="text-[14px] text-[#5f5c6b]">Não foi possível carregar os contatos.</p>
            <button type="button" onClick={() => void list.refetch()} className={cn(LINK, "mt-2", PRESSABLE)}>
              Tentar de novo
            </button>
          </div>
        ) : !rows || rows.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <p className="text-[14px] text-[#5f5c6b]">{active ? "Ninguém da sua lista entra neste recorte." : "Sua lista ainda está vazia. Quem comprar um ingresso seu aparece aqui sozinho."}</p>
            {active ? (
              <button type="button" onClick={() => onFilters({})} className={cn(LINK, "mt-2", PRESSABLE)}>
                Limpar filtros
              </button>
            ) : null}
          </div>
        ) : (
          <>
            <table className="hidden w-full text-left text-[14px] lg:table">
              <thead className="bg-[#fbfaff] text-[13px] text-[#5f5c6b]">
                <tr className="border-b border-[#ebe8f2]">
                  <SortTh k="name">Cliente</SortTh>
                  <th scope="col" className={TH}>Telefone</th>
                  <th scope="col" className={TH}>Origem</th>
                  <SortTh k="orders" right>Compras</SortTh>
                  <SortTh k="spent" right>Gasto em ingressos</SortTh>
                  <SortTh k="lastPurchase">Última compra</SortTh>
                  <th scope="col" className={cn(TH, "text-right")}>Pode receber</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f2f0f7]">
                {rows.map((c) => (
                  <tr key={c.id} tabIndex={0} onClick={() => setOpenId(c.id)} onKeyDown={(e) => e.key === "Enter" && setOpenId(c.id)} className="cursor-pointer outline-none hover:bg-[#faf8ff] focus-visible:bg-[#f7f3ff]">
                    <td className="w-[28%] max-w-0 px-5 py-3">
                      <span className="block truncate font-medium text-[#1c1a24]">{c.name}</span>
                      <span className="block truncate text-[13px] text-[#6b6878]">{c.email ?? "Sem e-mail"}</span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 font-poppins text-[13.5px] tabular-nums text-[#3a3746]">{formatPhone(c.phone) || <span className="font-sans text-[#a19eae]">—</span>}</td>
                    <td className="px-5 py-3">
                      <Sources contact={c} />
                    </td>
                    <td className="px-5 py-3 text-right font-poppins tabular-nums">{c.ordersCount || <span className="text-[#a19eae]">—</span>}</td>
                    <td className="px-5 py-3 text-right font-poppins font-semibold tabular-nums">{c.spentCents ? brl(c.spentCents) : <span className="font-normal text-[#a19eae]">—</span>}</td>
                    <td className="whitespace-nowrap px-5 py-3">
                      {c.lastPurchaseAt ? (
                        <>
                          <span className="block font-poppins text-[13.5px] tabular-nums">{fmtDate(c.lastPurchaseAt)}</span>
                          <span className="block text-[12.5px] text-[#6b6878]">{ago(c.lastPurchaseAt)}</span>
                        </>
                      ) : (
                        <span className="text-[#a19eae]">Nunca comprou</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span className="flex justify-end gap-1.5">
                        <ChannelMark channel="EMAIL" state={c.channels.EMAIL} onOpen={() => setChannelTarget({ contact: c, channel: "EMAIL" })} />
                        <ChannelMark channel="WHATSAPP" state={c.channels.WHATSAPP} onOpen={() => setChannelTarget({ contact: c, channel: "WHATSAPP" })} />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <ul className="divide-y divide-[#f2f0f7] lg:hidden">
              {rows.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 px-4 hover:bg-[#faf8ff]">
                  <button type="button" onClick={() => setOpenId(c.id)} className="min-w-0 flex-1 py-3.5 text-left outline-none">
                    <span className="block min-w-0">
                      <span className="block truncate font-medium">{c.name}</span>
                      <span className="mt-0.5 block truncate text-[13px] text-[#5f5c6b]">
                        {c.ordersCount ? `${c.ordersCount} ${c.ordersCount === 1 ? "compra" : "compras"} · ${brl(c.spentCents)} · ${ago(c.lastPurchaseAt)}` : SOURCE_LABEL[c.sources[0] ?? "IMPORT"]}
                      </span>
                    </span>
                  </button>
                  <span className="flex shrink-0 gap-1.5">
                    <ChannelMark channel="EMAIL" state={c.channels.EMAIL} onOpen={() => setChannelTarget({ contact: c, channel: "EMAIL" })} />
                    <ChannelMark channel="WHATSAPP" state={c.channels.WHATSAPP} onOpen={() => setChannelTarget({ contact: c, channel: "WHATSAPP" })} />
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {/* Paginação */}
      {total > 0 ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-poppins text-[13.5px] tabular-nums text-[#5f5c6b]">
            Mostrando {from}–{to} de {num(total)}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <select
              aria-label="Itens por página"
              value={perPage}
              onChange={(e) => {
                setPerPage(Number(e.target.value));
                setPage(1);
              }}
              className="h-9 rounded-[10px] border border-[#e6e2ef] bg-white px-3 text-base sm:text-[13.5px]"
            >
              <option value={25}>25 por página</option>
              <option value={50}>50 por página</option>
              <option value={100}>100 por página</option>
            </select>
            <nav aria-label="Páginas" className="flex items-center gap-1">
              <PageButton label="Página anterior" disabled={page === 1} onClick={() => setPage(page - 1)}>
                <ChevronLeft size={16} aria-hidden="true" />
              </PageButton>
              {nums.map((n, i) => (
                <span key={n} className="flex items-center gap-1">
                  {i > 0 && n - nums[i - 1] > 1 ? <span className="px-1 text-[#6b6878]">…</span> : null}
                  <PageButton current={n === page} onClick={() => setPage(n)}>
                    {n}
                  </PageButton>
                </span>
              ))}
              <PageButton label="Próxima página" disabled={page === pages} onClick={() => setPage(page + 1)}>
                <ChevronRight size={16} aria-hidden="true" />
              </PageButton>
            </nav>
          </div>
        </div>
      ) : null}

      <ContactSheet orgId={orgId} contactId={openId} onClose={() => setOpenId(null)} canManage={perms.manage} />
      <ChannelDialog orgId={orgId} target={channelTarget} onClose={() => setChannelTarget(null)} onOpenContact={setOpenId} onGoTo={onGoTo} canSend={perms.campaigns} />
      <SaveAudienceDialog orgId={orgId} open={saving} onClose={() => setSaving(false)} filters={filters} options={options} counts={counts} />
    </div>
  );
}

function Sources({ contact }: { contact: CrmContact }) {
  const order: CrmSourceType[] = ["PURCHASE", "SIGNUP", "IMPORT", "TICKET_RECEIVED"];
  const sorted = order.filter((s) => contact.sources.includes(s));
  if (!sorted.length) return <span className="text-[#a19eae]">—</span>;
  // Texto, não etiqueta: quase toda linha é "Comprou ingresso", e cor repetida em toda linha vira ruído.
  return (
    <span className="text-[#3a3746]">
      {SOURCE_LABEL[sorted[0]]}
      {sorted.length > 1 ? <span className="text-[#8a8796]"> e {SOURCE_LABEL[sorted[1]].toLowerCase()}</span> : null}
    </span>
  );
}

function Chip({ active, onClick, count, children }: { active: boolean; onClick: () => void; count?: number; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "flex h-9 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-3.5 text-[13.5px] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-[#7c3aed]",
        active ? "border-[#1c1a24] bg-[#1c1a24] text-white" : "border-[#e6e2ef] bg-white text-[#3a3746] hover:border-[#cfc8e2] hover:bg-[#faf8ff]",
        PRESSABLE,
      )}
    >
      {children}
      {count !== undefined ? <span className={cn("font-poppins text-[12.5px] font-medium tabular-nums", active ? "text-white/65" : "text-[#8a8796]")}>{num(count)}</span> : null}
    </button>
  );
}

function SelectField({ label, icon, value, onChange, className, children }: { label: string; icon?: ReactNode; value: string | number; onChange: (value: string) => void; className?: string; children: ReactNode }) {
  const on = value !== "";
  return (
    <label className={cn(FIELD, "relative flex items-center pr-3", icon ? "pl-10" : "pl-3.5", on && "border-[#c9b8f5] bg-[#f7f3ff]", className)}>
      {icon ? <span className={cn("pointer-events-none absolute left-3.5", on ? "text-[#6d28d9]" : "text-[#6b6878]")}>{icon}</span> : null}
      <span className="sr-only">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={cn("h-full w-full appearance-none truncate bg-transparent pr-6 text-base font-medium outline-none sm:text-[14px]", on && "text-[#6d28d9]")}>
        {children}
      </select>
      <ChevronDown size={16} className={cn("pointer-events-none absolute right-3", on ? "text-[#6d28d9]" : "text-[#6b6878]")} aria-hidden="true" />
    </label>
  );
}

function AdvancedField({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-[13.5px] font-semibold">{label}</p>
      {hint ? <p className="mb-1.5 text-[12.5px] text-[#6b6878]">{hint}</p> : <div className="mb-1.5" />}
      {children}
    </div>
  );
}

function NumberInput({ value, onChange, placeholder }: { value?: number; onChange: (value: number | undefined) => void; placeholder: string }) {
  return (
    <input
      type="number"
      inputMode="numeric"
      min={1}
      value={value ?? ""}
      placeholder={placeholder}
      onChange={(e) => {
        const n = Math.floor(Number(e.target.value));
        onChange(n > 0 ? n : undefined);
      }}
      className={cn(FIELD, "w-full px-3 font-poppins tabular-nums placeholder:font-sans placeholder:text-[#8a8796]")}
    />
  );
}

function PageButton({ children, onClick, disabled, current, label }: { children: ReactNode; onClick: () => void; disabled?: boolean; current?: boolean; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-current={current ? "page" : undefined}
      className={cn(
        "flex h-9 min-w-9 items-center justify-center rounded-lg px-2 font-poppins text-[13.5px] font-medium tabular-nums disabled:cursor-not-allowed disabled:opacity-40",
        current ? "bg-[#7c3aed] text-white" : "text-[#3a3746] hover:bg-[#f3f1f8]",
        PRESSABLE,
      )}
    >
      {children}
    </button>
  );
}

function SaveAudienceDialog({
  orgId,
  open,
  onClose,
  filters,
  options,
  counts,
}: {
  orgId: number;
  open: boolean;
  onClose: () => void;
  filters: CrmFilters;
  options?: CrmFilterOptions;
  counts?: { total: number; emailEligible: number; whatsappEligible: number };
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  useEffect(() => {
    if (open) {
      setName("");
      setDescription("");
    }
  }, [open]);

  const create = useMutation({
    mutationFn: () => crmApi.createSegment(orgId, { name: name.trim(), description: description.trim() || undefined, filters }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: crmKeys.segments(orgId) });
      toast.success("Público salvo. Ele se atualiza sozinho conforme a lista muda.");
      onClose();
    },
    onError: (error) => toast.error(getErrorMessage(error, "Não foi possível salvar o público.")),
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Salvar como público</DialogTitle>
          <DialogDescription>O público guarda as regras, não as pessoas: quem passar a se encaixar entra sozinho, e quem pedir para sair deixa de contar.</DialogDescription>
        </DialogHeader>
        <form
          className="mt-1 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim().length >= 2) create.mutate();
          }}
        >
          <ul className="space-y-1 rounded-[12px] bg-[#faf8ff] px-4 py-3 text-[13.5px] text-[#3a3746]">
            {describeFilters(filters, options).map((line) => (
              <li key={line}>{line}</li>
            ))}
            {counts ? (
              <li className="pt-1 font-poppins text-[13px] tabular-nums text-[#6b6878]">
                {people(counts.total)} hoje · {num(counts.emailEligible)} e-mail · {num(counts.whatsappEligible)} WhatsApp
              </li>
            ) : null}
          </ul>
          <label className="block">
            <span className="mb-1.5 block text-[13.5px] font-semibold">Nome</span>
            <input autoFocus value={name} onChange={(e) => setName(e.target.value)} maxLength={120} placeholder="Ex.: Quem foi ao Halloween" className={cn(FIELD, "w-full px-3.5")} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[13.5px] font-semibold">
              Descrição <span className="font-normal text-[#6b6878]">(opcional)</span>
            </span>
            <input value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} className={cn(FIELD, "w-full px-3.5")} />
          </label>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className={cn(BTN_SECONDARY, PRESSABLE)}>
              Cancelar
            </button>
            <button type="submit" disabled={name.trim().length < 2 || create.isPending} className={cn(BTN_PRIMARY, PRESSABLE)}>
              {create.isPending ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : null}
              Salvar público
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
