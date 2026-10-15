"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { SearchInput, useDebouncedValue } from "@/components/ui/search-input";
import { RowsSkeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import api, { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/cn";
import { WhatsappPreview } from "../_components/whatsapp-preview";
import type { EventOption, Simulation } from "../_lib/promo";

const ACTIVITY_OPTIONS = [
  { value: "", label: "Sem limite" },
  { value: "30", label: "Últimos 30 dias" },
  { value: "90", label: "Últimos 90 dias" },
  { value: "180", label: "Últimos 6 meses" },
  { value: "365", label: "Último ano" },
];

/** "150,00" → 15000 centavos. Vazio ou inválido = não informado. */
function toCents(value: string): number | undefined {
  const n = Number(value.replace(/\./g, "").replace(",", "."));
  return value.trim() && Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : undefined;
}

function CheckLine({ id, checked, onChange, label, hint }: { id: string; checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <div className="flex items-start gap-3">
      <Checkbox id={id} checked={checked} onCheckedChange={(v) => onChange(v === true)} className="mt-0.5" />
      <label htmlFor={id} className="cursor-pointer text-sm leading-snug text-foreground">
        {label}
        {hint ? <span className="block text-caption text-muted-foreground">{hint}</span> : null}
      </label>
    </div>
  );
}

export default function NovaCampanhaPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [events, setEvents] = useState<EventOption[] | null>(null);
  const [event, setEvent] = useState<EventOption | null>(null);

  const [cities, setCities] = useState("");
  const [producerBuyers, setProducerBuyers] = useState(true);
  const [allOptedIn, setAllOptedIn] = useState(false);
  const [activeWithinDays, setActiveWithinDays] = useState("");
  const [maxRecipients, setMaxRecipients] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [placeText, setPlaceText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [sendNow, setSendNow] = useState(true);
  const [scheduledAt, setScheduledAt] = useState("");
  const [price, setPrice] = useState("");
  const [notes, setNotes] = useState("");

  const [simulation, setSimulation] = useState<Simulation | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    setEvents(null);
    api
      .get<EventOption[]>("/admin/divulgacao/eventos", { params: { busca: debouncedSearch || undefined } })
      .then(({ data }) => alive && setEvents(data))
      .catch((err) => {
        if (alive) setEvents([]);
        toast.error(getErrorMessage(err, "Não foi possível buscar os eventos."));
      });
    return () => {
      alive = false;
    };
  }, [debouncedSearch]);

  function chooseEvent(option: EventOption) {
    setEvent(option);
    setCities(option.city ?? "");
    setSimulation(null);
  }

  const input = useMemo(() => {
    if (!event) return null;
    return {
      eventId: event.id,
      audience: {
        cities: cities.split(",").map((c) => c.trim()).filter(Boolean),
        producerBuyers,
        allOptedIn,
        activeWithinDays: activeWithinDays ? Number(activeWithinDays) : undefined,
        maxRecipients: maxRecipients ? Math.max(1, Math.floor(Number(maxRecipients))) || undefined : undefined,
      },
      couponCode: couponCode.trim() || undefined,
      placeText: placeText.trim() || undefined,
      imageUrl: imageUrl.trim() || undefined,
    };
  }, [event, cities, producerBuyers, allOptedIn, activeWithinDays, maxRecipients, couponCode, placeText, imageUrl]);
  const debouncedInput = useDebouncedValue(input, 600);

  // Prévia e contagem acompanham o formulário (nada é gravado).
  useEffect(() => {
    if (!debouncedInput) return;
    let alive = true;
    setSimulating(true);
    api
      .post<Simulation>("/admin/divulgacao/simulacao", debouncedInput)
      .then(({ data }) => alive && setSimulation(data))
      .catch((err) => alive && toast.error(getErrorMessage(err, "Não foi possível montar a prévia.")))
      .finally(() => alive && setSimulating(false));
    return () => {
      alive = false;
    };
  }, [debouncedInput]);

  const counts = simulation?.counts ?? null;
  const problems = simulation?.problems ?? [];
  const scheduleProblem = !sendNow && !scheduledAt ? "Escolha a data e a hora do envio." : null;
  const canSchedule = Boolean(input && simulation && !simulating && problems.length === 0 && !scheduleProblem && (counts?.willReceive ?? 0) > 0);

  async function handleCreate() {
    if (!input) return;
    try {
      const { data } = await api.post<{ id: number }>("/admin/divulgacao/campanhas", {
        ...input,
        scheduledAt: sendNow ? undefined : new Date(scheduledAt).toISOString(),
        priceCents: toCents(price),
        notes: notes.trim() || undefined,
      });
      toast.success(sendNow ? "Campanha agendada para agora" : "Campanha agendada");
      router.push(`/admin/divulgacao/${data.id}`);
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível agendar."));
      throw err;
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Nova campanha" description="Destaque de um evento para quem autorizou receber novidades da Nokta Tickets." back="/admin/divulgacao" />

      {!event ? (
        <Card>
          <CardHeader>
            <CardTitle>Qual evento?</CardTitle>
            <CardDescription>Só eventos publicados e ainda por acontecer.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-3">
            <SearchInput value={search} onChange={setSearch} placeholder="Nome do evento ou do produtor" />
            {events === null ? (
              <RowsSkeleton rows={4} />
            ) : events.length === 0 ? (
              <EmptyState compact icon="calendar" title="Nenhum evento encontrado" />
            ) : (
              <ul className="divide-y divide-border">
                {events.map((e) => (
                  <li key={e.id}>
                    <button type="button" onClick={() => chooseEvent(e)} disabled={!e.salesOpen} className="flex w-full items-center gap-3 py-3 text-left transition-colors hover:bg-surface-2/60 disabled:cursor-not-allowed disabled:opacity-60">
                      {e.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={e.imageUrl} alt="" className="h-12 w-20 shrink-0 rounded-md bg-surface-2 object-cover" />
                      ) : (
                        <span className="h-12 w-20 shrink-0 rounded-md bg-surface-2" />
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium text-foreground">{e.nome}</span>
                        <span className="block truncate text-caption text-muted-foreground">
                          {e.organizationName} · {e.whenText}
                          {e.city ? ` · ${e.city}` : ""}
                        </span>
                      </span>
                      {!e.salesOpen ? <StatusBadge tone="neutral">Vendas fechadas</StatusBadge> : null}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-6">
            <Card>
              <CardContent className="flex items-center gap-3 pt-5">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-foreground">{event.nome}</span>
                  <span className="block truncate text-caption text-muted-foreground">
                    {event.organizationName} · {event.whenText}
                  </span>
                </span>
                <Button size="sm" variant="ghost" onClick={() => setEvent(null)}>
                  Trocar
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Para quem</CardTitle>
                <CardDescription>Sempre só quem autorizou. Quem já tem ingresso do evento e quem recebeu divulgação nos últimos 3 dias (ou 2 na semana) ficam de fora.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-3">
                <CheckLine id="aud-all" checked={allOptedIn} onChange={setAllOptedIn} label="Toda a base que autorizou" hint="Ignora os filtros abaixo. Use com cuidado: mensagem pouco relevante gera bloqueio." />
                <div className={cn("space-y-4", allOptedIn && "pointer-events-none opacity-50")}>
                  <Field label="Cidades" htmlFor="aud-cities" hint="Quem já foi a evento nessas cidades ou tem a cidade no cadastro. Separe por vírgula.">
                    <Input id="aud-cities" value={cities} onChange={(e) => setCities(e.target.value)} placeholder="Belo Horizonte, Contagem" />
                  </Field>
                  <CheckLine id="aud-producer" checked={producerBuyers} onChange={setProducerBuyers} label={`Quem já comprou de ${event.organizationName}`} hint="Somado às cidades." />
                </div>
                <FieldGroup columns={2}>
                  <Field label="Teve ingresso nos" htmlFor="aud-active">
                    <NativeSelect id="aud-active" value={activeWithinDays} onChange={(e) => setActiveWithinDays(e.target.value)}>
                      {ACTIVITY_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </NativeSelect>
                  </Field>
                  <Field label="No máximo" htmlFor="aud-max" optional hint="Comece pequeno. Os mais ativos primeiro.">
                    <Input id="aud-max" type="number" inputMode="numeric" min={1} value={maxRecipients} onChange={(e) => setMaxRecipients(e.target.value)} placeholder="Sem teto" />
                  </Field>
                </FieldGroup>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Mensagem</CardTitle>
                <CardDescription>O texto é fixo. Aqui só os valores que mudam.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-3">
                <FieldGroup columns={2}>
                  <Field label="Cupom" htmlFor="msg-coupon" optional hint="Precisa existir e estar ativo no evento.">
                    <Input id="msg-coupon" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} placeholder="NOKTA10" />
                  </Field>
                  <Field label="Local mostrado" htmlFor="msg-place" optional hint="Padrão: cidade do evento.">
                    <Input id="msg-place" value={placeText} onChange={(e) => setPlaceText(e.target.value)} placeholder={event.city ? `${event.city}${event.uf ? ` - ${event.uf}` : ""}` : "Nome do lugar, cidade"} />
                  </Field>
                </FieldGroup>
                <Field label="Imagem" htmlFor="msg-image" optional hint="Padrão: banner do evento. JPEG ou PNG, por HTTPS.">
                  <Input id="msg-image" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://…/arte.jpg" />
                </Field>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Envio</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-3">
                <CheckLine id="send-now" checked={sendNow} onChange={setSendNow} label="Enviar assim que possível" hint="O envio começa no minuto seguinte e segue em lotes." />
                {!sendNow ? (
                  <Field label="Data e hora" htmlFor="send-at" hint="Horário do seu navegador.">
                    <Input id="send-at" type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
                  </Field>
                ) : null}
                <FieldGroup columns={2}>
                  <Field label="Valor cobrado do produtor" htmlFor="send-price" optional hint="Só registro, nada é cobrado aqui.">
                    <Input id="send-price" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="R$ 0,00" />
                  </Field>
                  <Field label="Observação" htmlFor="send-notes" optional>
                    <Textarea id="send-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
                  </Field>
                </FieldGroup>
              </CardContent>
            </Card>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <Card>
              <CardHeader>
                <CardTitle>Quem recebe</CardTitle>
                <CardDescription>Se o envio fosse agora. A lista final é montada na hora do envio.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 pt-3 text-sm">
                {simulating && !counts ? (
                  <RowsSkeleton rows={3} />
                ) : counts ? (
                  <>
                    <p className="tnum text-3xl font-semibold text-foreground">{counts.willReceive}</p>
                    <ul className="space-y-1 text-muted-foreground">
                      <li className="tnum">{counts.matching} autorizaram e se encaixam no público</li>
                      <li className="tnum">{counts.withTicket} já têm ingresso (fora)</li>
                      <li className="tnum">{counts.frequencyCapped} receberam divulgação há pouco (fora)</li>
                    </ul>
                  </>
                ) : (
                  <p className="text-muted-foreground">Escolha o público.</p>
                )}
              </CardContent>
            </Card>

            {problems.length || scheduleProblem ? (
              <Callout tone="warning" title="Antes de agendar">
                <ul className="list-disc space-y-1 pl-4">
                  {problems.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                  {scheduleProblem ? <li>{scheduleProblem}</li> : null}
                </ul>
              </Callout>
            ) : null}

            {simulation ? <WhatsappPreview preview={simulation.preview} /> : null}

            <Button size="full" leftIcon="send" disabled={!canSchedule} onClick={() => setConfirmOpen(true)}>
              Agendar envio
            </Button>
          </aside>
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Agendar envio"
        description={`${counts?.willReceive ?? 0} pessoa(s) devem receber o destaque de ${event?.nome ?? "o evento"} ${sendNow ? "a partir do próximo minuto" : "no horário escolhido"}. Depois que o envio começa, não dá para cancelar.`}
        confirmLabel="Agendar"
        icon="send"
        onConfirm={handleCreate}
      />
    </div>
  );
}
