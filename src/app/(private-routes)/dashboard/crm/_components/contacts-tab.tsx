"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/cn";
import { crmApi, crmKeys, type CrmChannel, type CrmContact, type CrmContactSort, type CrmFilterOptions, type CrmFilters, type CrmOverview, type CrmSegment, type CrmSourceType } from "@/services/crm";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { DataTable, DataTableBody, DataTableCell, DataTableHead, DataTableHeadCell, DataTablePagination, DataTableRow, DataTableShell, MobileCard, MobileCardList } from "@/components/ui/data-table";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { Field, FieldGroup } from "@/components/ui/field";
import { FilterChip, FilterGroup, FilterPanel } from "@/components/ui/filter-panel";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { SearchInput } from "@/components/ui/search-input";
import { Skeleton } from "@/components/ui/skeleton";
import { brl, fmtDate } from "../../financeiro/_components/finance-ui";
import { ChannelDialog } from "./channel-dialog";
import { ContactSheet } from "./contact-sheet";
import type { CrmPermissions, CrmTabKey } from "./crm-ui";
import { ChannelIcon, ChannelMark, IMPORTED_FILTER as IMPORTED, SOURCE_LABEL, ago, describeFilters, formatPhone, hasFilters, num, people, sameFilters } from "./crm-ui";

const RECURRING: CrmFilters = { minOrders: 2 };
const INACTIVE: CrmFilters = { inactiveDays: 90 };

export function ContactsTab({ orgId, filters, onFilters, options, segments, importedTotal, overview, onGoTo, perms }: { orgId: number; filters: CrmFilters; onFilters: (filters: CrmFilters) => void; options?: CrmFilterOptions; segments: CrmSegment[]; importedTotal: number | null; overview?: CrmOverview; onGoTo: (tab: CrmTabKey) => void; perms: CrmPermissions }) {
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
  const active = hasFilters(filters);
  const savedAs = segments.find((s) => sameFilters(s.filters, filters));
  const purchasedEvent = options?.events.find((e) => e.id === filters.purchasedEventIds?.[0]);
  const activeCount = [filters.purchasedEventIds?.length, filters.attendedEventIds?.length, filters.ticketTypeIds?.length, filters.purchasedFrom, filters.purchasedTo, filters.minOrders, filters.inactiveDays, filters.sources?.length, filters.eligibleChannel].filter(Boolean).length;

  function toggleSort(key: CrmContactSort) {
    if (sort === key) setDir(dir === "desc" ? "asc" : "desc");
    else {
      setSort(key);
      setDir(key === "name" ? "asc" : "desc");
    }
    setPage(1);
  }
  const sortHead = (key: CrmContactSort, label: string, align: "left" | "right" = "left") => (
    <DataTableHeadCell align={align}>
      <button type="button" onClick={() => toggleSort(key)} className={cn("inline-flex items-center gap-1 uppercase tracking-[0.08em] hover:text-foreground", sort === key && "text-foreground")} aria-sort={sort === key ? (dir === "desc" ? "descending" : "ascending") : "none"}>
        {label}
        <Icon name={sort === key ? (dir === "desc" ? "arrow-down" : "arrow-up") : "sort"} size={9} className={sort === key ? "text-brand" : "text-subtle-foreground"} />
      </button>
    </DataTableHeadCell>
  );

  const clearSearch = () => {
    setSearchInput("");
    onFilters({});
  };

  const filterPanel = (
    <FilterPanel activeCount={activeCount} onClear={() => onFilters({ search: filters.search })}>
      <FilterGroup title="Recortes prontos">
        <div className="flex flex-wrap gap-1.5">
          <FilterChip active={!active} onClick={() => onFilters({})}>
            Todos{overview ? ` · ${num(overview.total)}` : ""}
          </FilterChip>
          <FilterChip active={sameFilters(filters, RECURRING)} onClick={() => onFilters(RECURRING)}>
            Recorrentes{overview ? ` · ${num(overview.recurring)}` : ""}
          </FilterChip>
          <FilterChip active={sameFilters(filters, INACTIVE)} onClick={() => onFilters(INACTIVE)}>
            Sumidos{overview ? ` · ${num(overview.inactive90Days)}` : ""}
          </FilterChip>
          <FilterChip active={sameFilters(filters, IMPORTED)} onClick={() => onFilters(IMPORTED)}>
            Trazidos por você{importedTotal !== null ? ` · ${num(importedTotal)}` : ""}
          </FilterChip>
        </div>
      </FilterGroup>

      {segments.length > 0 ? (
        <FilterGroup title="Públicos salvos">
          <div className="flex flex-wrap gap-1.5">
            {segments.map((s) => (
              <FilterChip key={s.id} active={sameFilters(s.filters, filters)} onClick={() => onFilters(s.filters)}>
                {s.name} · {num(s.counts.total)}
              </FilterChip>
            ))}
          </div>
        </FilterGroup>
      ) : null}

      <FilterGroup title="Pode receber">
        <div className="flex flex-wrap gap-1.5">
          {(["EMAIL", "WHATSAPP"] as CrmChannel[]).map((c) => (
            <FilterChip key={c} active={filters.eligibleChannel === c} onClick={() => set({ eligibleChannel: filters.eligibleChannel === c ? undefined : c })}>
              <ChannelIcon channel={c} size={11} />
              {c === "EMAIL" ? "E-mail" : "WhatsApp"}
            </FilterChip>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Compras">
        <Field label="Evento em que comprou" htmlFor="f-evento">
          <NativeSelect id="f-evento" value={filters.purchasedEventIds?.[0] ?? ""} onChange={(e) => set({ purchasedEventIds: e.target.value ? [Number(e.target.value)] : undefined, ticketTypeIds: undefined })}>
            <option value="">Qualquer evento</option>
            {(options?.events ?? []).map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Tipo de ingresso" htmlFor="f-ingresso" hint={purchasedEvent ? undefined : "Escolha antes o evento."}>
          <NativeSelect id="f-ingresso" value={filters.ticketTypeIds?.[0] ?? ""} disabled={!purchasedEvent} onChange={(e) => set({ ticketTypeIds: e.target.value ? [Number(e.target.value)] : undefined })}>
            <option value="">Qualquer ingresso</option>
            {(purchasedEvent?.ticketTypes ?? []).map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Foi ao evento" htmlFor="f-foi" hint="Teve o ingresso validado na entrada.">
          <NativeSelect id="f-foi" value={filters.attendedEventIds?.[0] ?? ""} onChange={(e) => set({ attendedEventIds: e.target.value ? [Number(e.target.value)] : undefined })}>
            <option value="">Tanto faz</option>
            {(options?.events ?? []).map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Comprou no período">
          <FieldGroup columns={2} className="gap-2">
            <Input type="date" aria-label="De" value={filters.purchasedFrom ?? ""} onChange={(e) => set({ purchasedFrom: e.target.value || undefined })} />
            <Input type="date" aria-label="Até" value={filters.purchasedTo ?? ""} onChange={(e) => set({ purchasedTo: e.target.value || undefined })} />
          </FieldGroup>
        </Field>
        <FieldGroup columns={2} className="gap-2">
          <Field label="Compras, no mínimo" htmlFor="f-min">
            <NumberInput id="f-min" value={filters.minOrders} onChange={(v) => set({ minOrders: v })} placeholder="Ex.: 2" />
          </Field>
          <Field label="Sem comprar há" htmlFor="f-inativo">
            <NumberInput id="f-inativo" value={filters.inactiveDays} onChange={(v) => set({ inactiveDays: v })} placeholder="dias" />
          </Field>
        </FieldGroup>
      </FilterGroup>

      <FilterGroup title="Origem">
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(SOURCE_LABEL) as CrmSourceType[]).map((s) => (
            <FilterChip key={s} active={filters.sources?.[0] === s} onClick={() => set({ sources: filters.sources?.[0] === s ? undefined : [s] })}>
              {SOURCE_LABEL[s]}
            </FilterChip>
          ))}
        </div>
      </FilterGroup>
    </FilterPanel>
  );

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
      {filterPanel}

      <div className="min-w-0 flex-1 space-y-4">
        {list.data?.syncError ? (
          <Callout tone="danger" title="A lista pode estar desatualizada.">
            Não foi possível ler as compras e os VIPs mais recentes. Avise o suporte com o texto abaixo.
            <span className="mt-1 block break-words font-mono text-caption">{list.data.syncError}</span>
          </Callout>
        ) : null}
        <SearchInput value={searchInput} onChange={setSearchInput} placeholder="Nome, e-mail ou telefone" className="w-full lg:max-w-xl" />

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <span className="font-semibold text-foreground tnum">{counts ? people(counts.total) : "…"}</span>
              {counts ? (
                <>
                  <span className="inline-flex items-center gap-1.5">
                    <ChannelIcon channel="EMAIL" size={11} className="text-success" />
                    <span className="tnum">{num(counts.emailEligible)}</span> e-mail
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <ChannelIcon channel="WHATSAPP" size={11} className="text-success" />
                    <span className="tnum">{num(counts.whatsappEligible)}</span> WhatsApp
                  </span>
                </>
              ) : null}
              {list.isFetching && rows ? <Icon name="loader" size={12} className="animate-spin text-subtle-foreground" /> : null}
            </p>
            {active ? (
              <p className="mt-0.5 truncate text-caption text-muted-foreground">
                {savedAs ? `Público "${savedAs.name}" · ` : ""}
                {describeFilters(filters, options).join(" · ")}
              </p>
            ) : null}
          </div>
          {active ? (
            <div className="flex shrink-0 items-center gap-2">
              <Button variant="subtle" size="sm" leftIcon="close" onClick={clearSearch}>
                Limpar
              </Button>
              {!savedAs && perms.manage ? (
                <Button size="sm" leftIcon="bookmark" onClick={() => setSaving(true)}>
                  Salvar como público
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>

        {list.isLoading && !rows ? (
          <Skeleton className="h-96 rounded-card" />
        ) : list.isError && !rows ? (
          <ErrorState title="Não foi possível carregar os contatos" onRetry={() => void list.refetch()} />
        ) : !rows || rows.length === 0 ? (
          <EmptyState icon="users" title={active ? "Ninguém entra neste recorte" : "Sua lista ainda está vazia"} description={active ? "Afrouxe os filtros ou limpe tudo." : "Quem comprar um ingresso seu aparece aqui sozinho."} action={active ? <Button variant="outline" onClick={clearSearch}>Limpar filtros</Button> : undefined} />
        ) : (
          <DataTableShell
            className={cn(list.isFetching && "opacity-80 transition-opacity")}
            table={
              <DataTable>
                <DataTableHead>
                  <tr>
                    {sortHead("name", "Cliente")}
                    <DataTableHeadCell>Origem</DataTableHeadCell>
                    {sortHead("orders", "Compras", "right")}
                    {sortHead("spent", "Gasto", "right")}
                    {sortHead("lastPurchase", "Última compra")}
                    <DataTableHeadCell align="right">Pode receber</DataTableHeadCell>
                  </tr>
                </DataTableHead>
                <DataTableBody>
                  {rows.map((c, i) => (
                    <DataTableRow key={c.id} index={i} onClick={() => setOpenId(c.id)}>
                      <DataTableCell className="max-w-[280px]">
                        <span className="block truncate font-semibold">{c.name}</span>
                        <span className="block truncate text-caption text-muted-foreground tnum">{[c.email, formatPhone(c.phone)].filter(Boolean).join(" · ") || "Sem e-mail nem telefone"}</span>
                      </DataTableCell>
                      <DataTableCell className="whitespace-nowrap text-muted-foreground">
                        <Sources contact={c} />
                      </DataTableCell>
                      <DataTableCell num className={cn(!c.ordersCount && "text-subtle-foreground")}>
                        {c.ordersCount || "—"}
                      </DataTableCell>
                      <DataTableCell num className={cn("whitespace-nowrap font-semibold", !c.spentCents && "font-normal text-subtle-foreground")}>
                        {c.spentCents ? brl(c.spentCents) : "—"}
                      </DataTableCell>
                      <DataTableCell className="whitespace-nowrap">
                        {c.lastPurchaseAt ? (
                          <>
                            <span className="block tnum">{fmtDate(c.lastPurchaseAt)}</span>
                            <span className="block text-caption text-muted-foreground">{ago(c.lastPurchaseAt)}</span>
                          </>
                        ) : (
                          <span className="text-subtle-foreground">Nunca comprou</span>
                        )}
                      </DataTableCell>
                      <DataTableCell align="right" stopPropagation>
                        <span className="flex justify-end gap-1.5">
                          <ChannelMark channel="EMAIL" state={c.channels.EMAIL} onOpen={() => setChannelTarget({ contact: c, channel: "EMAIL" })} />
                          <ChannelMark channel="WHATSAPP" state={c.channels.WHATSAPP} onOpen={() => setChannelTarget({ contact: c, channel: "WHATSAPP" })} />
                        </span>
                      </DataTableCell>
                    </DataTableRow>
                  ))}
                </DataTableBody>
              </DataTable>
            }
            mobile={
              <MobileCardList>
                {rows.map((c, i) => (
                  <MobileCard
                    key={c.id}
                    index={i}
                    onClick={() => setOpenId(c.id)}
                    title={c.name}
                    subtitle={c.ordersCount ? `${c.ordersCount} ${c.ordersCount === 1 ? "compra" : "compras"} · ${brl(c.spentCents)} · ${ago(c.lastPurchaseAt)}` : SOURCE_LABEL[c.sources[0] ?? "IMPORT"]}
                    badge={
                      <span className="flex shrink-0 gap-1.5">
                        <ChannelMark channel="EMAIL" state={c.channels.EMAIL} onOpen={() => setChannelTarget({ contact: c, channel: "EMAIL" })} />
                        <ChannelMark channel="WHATSAPP" state={c.channels.WHATSAPP} onOpen={() => setChannelTarget({ contact: c, channel: "WHATSAPP" })} />
                      </span>
                    }
                  />
                ))}
              </MobileCardList>
            }
            footer={
              total > 0 ? (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <NativeSelect
                    aria-label="Itens por página"
                    value={perPage}
                    onChange={(e) => {
                      setPerPage(Number(e.target.value));
                      setPage(1);
                    }}
                    className="w-full sm:w-[150px] [&_select]:h-9 [&_select]:text-caption"
                  >
                    <option value={25}>25 por página</option>
                    <option value={50}>50 por página</option>
                    <option value={100}>100 por página</option>
                  </NativeSelect>
                  <DataTablePagination page={page} lastPage={pages} total={total} perPage={perPage} noun="contatos" onPageChange={setPage} />
                </div>
              ) : undefined
            }
          />
        )}
      </div>

      <ContactSheet orgId={orgId} contactId={openId} onClose={() => setOpenId(null)} canManage={perms.manage} />
      <ChannelDialog orgId={orgId} target={channelTarget} onClose={() => setChannelTarget(null)} onOpenContact={setOpenId} onGoTo={onGoTo} canSend={perms.campaigns} />
      <SaveAudienceDialog orgId={orgId} open={saving} onClose={() => setSaving(false)} filters={filters} options={options} counts={counts} />
    </div>
  );
}

function Sources({ contact }: { contact: CrmContact }) {
  const order: CrmSourceType[] = ["PURCHASE", "SIGNUP", "IMPORT", "TICKET_RECEIVED"];
  const sorted = order.filter((s) => contact.sources.includes(s));
  if (!sorted.length) return <span className="text-subtle-foreground">—</span>;
  // Texto, não etiqueta: quase toda linha é "Comprou ingresso", e cor repetida em toda linha vira ruído.
  return (
    <span>
      {SOURCE_LABEL[sorted[0]]}
      {sorted.length > 1 ? <span className="block text-caption text-subtle-foreground">e {SOURCE_LABEL[sorted[1]].toLowerCase()}</span> : null}
    </span>
  );
}

function NumberInput({ id, value, onChange, placeholder }: { id?: string; value?: number; onChange: (value: number | undefined) => void; placeholder: string }) {
  return (
    <Input
      id={id}
      type="number"
      inputMode="numeric"
      min={1}
      value={value ?? ""}
      placeholder={placeholder}
      onChange={(e) => {
        const n = Math.floor(Number(e.target.value));
        onChange(n > 0 ? n : undefined);
      }}
    />
  );
}

function SaveAudienceDialog({ orgId, open, onClose, filters, options, counts }: { orgId: number; open: boolean; onClose: () => void; filters: CrmFilters; options?: CrmFilterOptions; counts?: { total: number; emailEligible: number; whatsappEligible: number } }) {
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
      <DialogContent size="md">
        <form
          className="contents"
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim().length >= 2) create.mutate();
          }}
        >
          <DialogHeader>
            <DialogTitle>Salvar como público</DialogTitle>
            <DialogDescription>O público guarda as regras, não as pessoas: quem passar a se encaixar entra sozinho, e quem pedir para sair deixa de contar.</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <ul className="surface-inset space-y-1 rounded-xl px-4 py-3 text-sm text-foreground">
              {describeFilters(filters, options).map((line) => (
                <li key={line}>{line}</li>
              ))}
              {counts ? (
                <li className="pt-1 text-caption text-muted-foreground tnum">
                  {people(counts.total)} hoje · {num(counts.emailEligible)} e-mail · {num(counts.whatsappEligible)} WhatsApp
                </li>
              ) : null}
            </ul>
            <Field label="Nome" htmlFor="seg-nome">
              <Input id="seg-nome" autoFocus value={name} onChange={(e) => setName(e.target.value)} maxLength={120} placeholder="Ex.: Quem foi ao Halloween" />
            </Field>
            <Field label="Descrição" htmlFor="seg-desc" optional>
              <Input id="seg-desc" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} />
            </Field>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" leftIcon="bookmark" disabled={name.trim().length < 2} loading={create.isPending}>
              Salvar público
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
