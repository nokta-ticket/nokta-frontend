"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import api from "@/lib/axios";
import { toast } from "@/lib/toast";
import { formatInstantDateBR } from "@/lib/format";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { StatusBadge } from "@/components/ui/badge";
import { TicketDetailSkeleton } from "@/components/ui/skeleton";
import { ticketStatusMeta, type TicketDetail, type UserTicket } from "../_lib/tickets";
import { COMPANY } from "@/lib/company";
import { ActionSheet, type ActionSheetItem } from "./_components/action-sheet";
import { ResaleDialog } from "./_components/resale-dialog";
import { TicketExportCard } from "./_components/ticket-export-card";
import { TicketPass, type SiblingTicket } from "./_components/ticket-pass";
import { TransferDialog } from "./_components/transfer-dialog";
import { useTicketExport } from "./_components/use-ticket-export";

const RULES = ["Apresente o QR Code na entrada.", "Chegue com antecedência pra evitar fila.", "Documento com foto pode ser solicitado.", "Ingresso válido pra 1 pessoa."];

export default function DetalheIngressoPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [item, setItem] = useState<TicketDetail | null | undefined>(undefined);
  const [siblings, setSiblings] = useState<SiblingTicket[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [showSave, setShowSave] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showResale, setShowResale] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

  const exportRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await api.get<TicketDetail>(`/tickets/${id}`);
      const data = res.data;
      setItem(data);

      // Ingressos do mesmo evento pro carrossel de QR.
      if (data?.event?.id) {
        const all = await api.get<{ data: UserTicket[] }>(`/tickets?limit=50`);
        const same: SiblingTicket[] = (all.data.data ?? [])
          .filter((t) => t.event?.id === data.event!.id)
          .map((t) => ({ id: t.id, code: t.code, status: t.status, nome: t.ticket?.nome ?? data.ticket.nome, tipo: t.ticket?.tipo ?? 1, lote: t.ticket?.lote ?? 1 }));
        // O ingresso aberto sempre em primeiro.
        same.sort((a, b) => (a.id === data.id ? -1 : b.id === data.id ? 1 : 0));
        setSiblings(same.length > 0 ? same : [{ id: data.id, code: data.code, status: data.status, nome: data.ticket.nome, tipo: data.ticket.tipo, lote: data.ticket.lote }]);
      } else {
        setSiblings([{ id: data.id, code: data.code, status: data.status, nome: data.ticket.nome, tipo: data.ticket.tipo, lote: data.ticket.lote }]);
      }
    } catch {
      setItem(null);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  // Fire-and-forget: registra visualização do QR code.
  useEffect(() => {
    if (item?.code) api.post(`/tickets/${id}/qr-view`).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.id]);

  const activeCode = siblings[activeIdx]?.code ?? item?.code ?? "";
  const holderName = user ? `${user.nome} ${user.sobrenome ?? ""}`.trim() : null;
  const exporter = useTicketExport(exportRef, `ingresso-${activeCode || "ticket"}`, item?.event?.nome ?? "Ingresso");

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Código copiado!");
    } catch {
      toast.error("Não deu pra copiar o código.");
    }
  };

  const openMaps = () => {
    const end = item?.event?.endereco;
    if (!end) return;
    const q = encodeURIComponent(`${end.logradouro}, ${end.numero}, ${end.localidade}, ${end.uf}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, "_blank", "noopener");
  };

  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const walletLabel = isIOS ? "Apple Wallet" : "Google Wallet";

  const saveItems: ActionSheetItem[] = useMemo(
    () => [
      { icon: "wallet", label: `Adicionar à ${walletLabel}`, description: "Em breve você guarda o ingresso na carteira do celular.", badge: "Em breve", onSelect: () => toast.info("Em breve disponível!") },
      { icon: "image", label: "Salvar imagem", description: "Guarda o ingresso completo na galeria.", onSelect: () => exporter.share() },
      { icon: "file-lines", label: "Baixar PDF", description: "Ideal pra imprimir ou enviar.", onSelect: () => exporter.exportPdf() },
      { icon: "external", label: "Abrir imagem em nova aba", description: "Pra salvar com o botão direito.", onSelect: () => exporter.exportPng() },
    ],
    [walletLabel, exporter],
  );

  if (item === undefined) return <TicketDetailSkeleton />;

  if (item === null) {
    return (
      <div className="mx-auto w-full max-w-md px-4 py-10">
        <EmptyState
          icon="ticket"
          title="Ingresso não encontrado"
          description="Verifique se você está logado com a conta correta."
          action={
            <Button asChild variant="outline" shape="pill">
              <Link href="/meus-ingressos">Voltar pra meus ingressos</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const ev = item.event;
  const tk = item.ticket;
  const isUsed = item.status === 2;
  const canTransfer = !isUsed;
  const canResell = !isUsed && tk.valor > 0;
  const status = ticketStatusMeta(item.status);

  const moreItems: ActionSheetItem[] = [
    ...(canResell ? [{ icon: "repeat" as const, label: "Não poderei comparecer", description: "Coloca o ingresso na revenda oficial da Nokta.", onSelect: () => setShowResale(true) }] : []),
    { icon: "file-lines", label: "Baixar PDF", description: "Ideal pra imprimir ou enviar.", onSelect: () => exporter.exportPdf() },
    { icon: "copy", label: "Copiar código", description: activeCode, onSelect: () => copyCode(activeCode) },
    ...(ev ? [{ icon: "calendar" as const, label: "Ver página do evento", onSelect: () => window.location.assign(`/evento/${ev.slug ?? ev.id}`) }] : []),
  ];

  return (
    <div className="mx-auto w-full max-w-md px-4 pb-12 pt-3 lg:max-w-5xl lg:px-6 lg:pt-8">
      <div className="lg:grid lg:grid-cols-[minmax(0,26rem)_1fr] lg:items-start lg:gap-10">
        {/* ingresso + ações */}
        <section className="lg:sticky lg:top-24">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-title font-semibold tracking-tight text-foreground">Seu ingresso</h2>
            <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
          </div>

          <TicketPass event={ev} ticket={tk} status={item.status} siblings={siblings} activeIdx={activeIdx} onActiveIdxChange={setActiveIdx} holderName={holderName} onCopyCode={copyCode} />

          <div className="mt-4 grid grid-cols-3 gap-2.5">
            <Button variant="secondary" className="h-12 flex-col gap-1 px-2 text-caption font-semibold" onClick={() => exporter.share()} loading={exporter.exporting}>
              {exporter.exporting ? null : <Icon name="share" size={16} />}
              Compartilhar
            </Button>
            <Button className="h-12 flex-col gap-1 px-2 text-caption font-semibold" onClick={() => setShowSave(true)}>
              <Icon name="download" size={16} />
              Salvar
            </Button>
            <Button variant="secondary" className="h-12 flex-col gap-1 px-2 text-caption font-semibold" disabled={!canTransfer} title={!canTransfer ? "Ingresso já utilizado não pode ser transferido" : undefined} onClick={() => setShowTransfer(true)}>
              <Icon name="send" size={16} />
              Transferir
            </Button>
          </div>
          <Button variant="ghost" size="full" className="mt-2 text-muted-foreground" leftIcon="ellipsis" onClick={() => setShowMore(true)}>
            Mais opções
          </Button>
        </section>

        {/* informações */}
        <aside className="mt-8 space-y-4 lg:mt-0">
          {ev?.descricao ? (
            <Card>
              <CardHeader>
                <CardTitle>Sobre o evento</CardTitle>
              </CardHeader>
              <CardContent className="pt-3">
                <p className={aboutOpen ? "whitespace-pre-line text-body text-muted-foreground" : "line-clamp-4 whitespace-pre-line text-body text-muted-foreground"}>{ev.descricao}</p>
                {ev.descricao.length > 220 ? (
                  <button type="button" onClick={() => setAboutOpen((v) => !v)} className="mt-2 text-sm font-semibold text-brand underline-offset-4 hover:underline">
                    {aboutOpen ? "Ver menos" : "Ver mais"}
                  </button>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          {ev?.endereco ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="map-pin" size={14} /> Local
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-3">
                {ev.local ? <p className="text-sm font-semibold text-foreground">{ev.local}</p> : null}
                <p className="text-body text-muted-foreground">
                  {ev.endereco.logradouro}, {ev.endereco.numero}
                  {ev.endereco.bairro ? ` · ${ev.endereco.bairro}` : ""}
                  <br />
                  {ev.endereco.localidade}/{ev.endereco.uf}
                  {ev.endereco.cep ? ` · CEP ${ev.endereco.cep}` : ""}
                </p>
                <Button variant="outline" size="sm" shape="pill" leftIcon="map-location" className="mt-3" onClick={openMaps}>
                  Abrir no Google Maps
                </Button>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Regras do ingresso</CardTitle>
            </CardHeader>
            <CardContent className="pt-3">
              <ul className="space-y-2">
                {RULES.map((rule) => (
                  <li key={rule} className="flex items-start gap-2.5 text-body text-muted-foreground">
                    <Icon name="check" size={12} className="mt-1 shrink-0 text-brand" />
                    {rule}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Cancelamento só pelo suporte (não há mais botão de autoatendimento):
              a mensagem já sai com o número do ingresso. */}
          {tk.valor > 0 ? (
            <p className="px-1 text-caption text-muted-foreground">
              Precisa cancelar? Fale com o suporte pelo{" "}
              <a href={`${COMPANY.social.whatsapp}?text=${encodeURIComponent(`Olá! Quero cancelar o ingresso #${item.id}.`)}`} target="_blank" rel="noopener noreferrer" className="font-medium text-brand underline-offset-4 hover:underline">
                WhatsApp
              </a>{" "}
              ou pelo e-mail{" "}
              <a href={`mailto:${COMPANY.emails.support}?subject=${encodeURIComponent(`Cancelamento do ingresso #${item.id}`)}`} className="font-medium text-brand underline-offset-4 hover:underline">
                {COMPANY.emails.support}
              </a>
              .
            </p>
          ) : null}

          <p className="tnum flex items-center justify-between px-1 text-micro font-semibold uppercase tracking-wider text-subtle-foreground">
            <span>Ingresso #{item.id}</span>
            <span>Comprado em {formatInstantDateBR(item.createdAt)}</span>
          </p>
        </aside>
      </div>

      <TicketExportCard ref={exportRef} item={item} code={activeCode} holderName={holderName} holderCpf={user?.cpf} />

      <ActionSheet open={showSave} onOpenChange={setShowSave} title="Salvar ingresso" description="Escolha onde guardar seu ingresso." items={saveItems} />
      <ActionSheet open={showMore} onOpenChange={setShowMore} title="Mais opções" items={moreItems} />
      <TransferDialog open={showTransfer} onOpenChange={setShowTransfer} ticketId={id} />
      <ResaleDialog open={showResale} onOpenChange={setShowResale} item={item} onDone={load} />
    </div>
  );
}
