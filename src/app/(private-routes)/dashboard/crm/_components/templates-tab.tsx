"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api, { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/cn";
import type { CrmChannel } from "@/services/crm";
import { crmMarketingApi, crmMarketingKeys, type CrmTemplate, type CrmTemplatePreview, type EmailBlock, type EmailContent, type WhatsappButton, type WhatsappContent } from "@/services/crm-marketing";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable, DataTableBody, DataTableCell, DataTableHead, DataTableHeadCell, DataTableRow, DataTableShell, MobileCard, MobileCardList } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, FieldGroup } from "@/components/ui/field";
import { Icon, type IconName } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { PageHeader } from "@/components/ui/page-header";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { fmtDate } from "../../financeiro/_components/finance-ui";
import { CHANNEL_LABEL, ChannelIcon, Note } from "./crm-ui";
import { Blockers, EmailPreviewFrame, WhatsappBubble, templateStatus } from "./marketing-ui";

type Editing = { template: CrmTemplate | null; channel: CrmChannel } | null;

const NEW_EMAIL: EmailContent = {
  subject: "",
  blocks: [
    { type: "heading", text: "Oi, {{primeiro_nome|pessoal}}!" },
    { type: "text", text: "Escreva aqui a novidade que você quer contar." },
    { type: "button", label: "Ver o evento", href: "https://" },
  ],
};
const NEW_WHATSAPP: WhatsappContent = { category: "MARKETING", language: "pt_BR", body: "", buttons: [] };

/** Modelos de mensagem: e-mail (pronto ao salvar) e WhatsApp (depende da análise da Meta). */
export function TemplatesTab({ orgId, whatsappConnected, canManage }: { orgId: number; whatsappConnected: boolean; canManage: boolean }) {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<CrmChannel | "ALL">("ALL");
  const [editing, setEditing] = useState<Editing>(null);
  const [confirming, setConfirming] = useState<CrmTemplate | null>(null);
  const list = useQuery({ queryKey: crmMarketingKeys.templates(orgId), queryFn: () => crmMarketingApi.listTemplates(orgId) });

  const refresh = () => void queryClient.invalidateQueries({ queryKey: crmMarketingKeys.templates(orgId) });
  const remove = useMutation({
    mutationFn: (id: number) => crmMarketingApi.removeTemplate(orgId, id),
    onSuccess: () => {
      refresh();
      toast.success("Modelo apagado");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Não foi possível apagar o modelo.")),
  });

  if (editing) {
    const close = () => {
      setEditing(null);
      refresh();
    };
    return editing.channel === "EMAIL" ? <EmailEditor orgId={orgId} template={editing.template as CrmTemplate<EmailContent> | null} onClose={close} readOnly={!canManage} /> : <WhatsappEditor orgId={orgId} template={editing.template as CrmTemplate<WhatsappContent> | null} connected={whatsappConnected} onClose={close} readOnly={!canManage} />;
  }

  const rows = (list.data ?? []).filter((t) => filter === "ALL" || t.channel === filter);
  const excerpt = (t: CrmTemplate) => (t.channel === "EMAIL" ? (t.content as EmailContent).subject || "Sem assunto" : (t.content as WhatsappContent).body || "Sem texto");
  const openEditor = (t: CrmTemplate) => setEditing({ template: t, channel: t.channel });

  const actions = (t: CrmTemplate) => (
    <>
      <Button variant="subtle" size="icon-sm" aria-label="Abrir modelo" title="Abrir" onClick={() => openEditor(t)}>
        <Icon name="edit" size={13} />
      </Button>
      {canManage ? (
        <Button variant="subtle" size="icon-sm" aria-label={`Apagar modelo ${t.name}`} title="Apagar" className="hover:bg-danger-bg hover:text-danger" onClick={() => setConfirming(t)}>
          <Icon name="trash" size={13} />
        </Button>
      ) : null}
    </>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SegmentedControl
          value={filter}
          onChange={setFilter}
          options={[
            { value: "ALL", label: "Todos" },
            { value: "EMAIL", label: "E-mail", icon: "mail" },
            { value: "WHATSAPP", label: "WhatsApp", icon: "whatsapp" },
          ]}
        />
        {canManage ? (
          <div className="flex gap-2">
            <Button variant="outline" leftIcon="whatsapp" onClick={() => setEditing({ template: null, channel: "WHATSAPP" })}>
              Modelo de WhatsApp
            </Button>
            <Button leftIcon="mail" onClick={() => setEditing({ template: null, channel: "EMAIL" })}>
              Modelo de e-mail
            </Button>
          </div>
        ) : null}
      </div>

      {list.isLoading ? (
        <Skeleton className="h-64 rounded-card" />
      ) : rows.length === 0 ? (
        <EmptyState icon="file-lines" title="Um modelo é a mensagem pronta que você usa nas campanhas" description="O de e-mail fica pronto assim que você salva. O de WhatsApp precisa ser aprovado pela Meta antes do primeiro envio, o que costuma levar de minutos a um dia." action={canManage ? <Button leftIcon="plus" onClick={() => setEditing({ template: null, channel: "EMAIL" })}>Criar modelo de e-mail</Button> : undefined} />
      ) : (
        <DataTableShell
          table={
            <DataTable>
              <DataTableHead>
                <tr>
                  <DataTableHeadCell>Modelo</DataTableHeadCell>
                  <DataTableHeadCell>Mensagem</DataTableHeadCell>
                  <DataTableHeadCell>Canal</DataTableHeadCell>
                  <DataTableHeadCell>Situação</DataTableHeadCell>
                  <DataTableHeadCell>Alterado em</DataTableHeadCell>
                  <DataTableHeadCell align="right" width={96}>
                    <span className="sr-only">Ações</span>
                  </DataTableHeadCell>
                </tr>
              </DataTableHead>
              <DataTableBody>
                {rows.map((t, i) => {
                  const status = templateStatus(t.channel, t.status);
                  return (
                    <DataTableRow key={t.id} index={i} onClick={() => openEditor(t)}>
                      <DataTableCell className="font-semibold">{t.name}</DataTableCell>
                      <DataTableCell className="max-w-[320px]">
                        <span className="block truncate text-muted-foreground">{excerpt(t)}</span>
                        {t.rejectionReason ? <span className="block truncate text-caption text-danger">Motivo da Meta: {t.rejectionReason}</span> : null}
                      </DataTableCell>
                      <DataTableCell className="whitespace-nowrap">
                        <span className="flex items-center gap-2">
                          <ChannelIcon channel={t.channel} size={12} className="text-muted-foreground" />
                          {CHANNEL_LABEL[t.channel]}
                        </span>
                      </DataTableCell>
                      <DataTableCell>
                        <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
                      </DataTableCell>
                      <DataTableCell className="whitespace-nowrap text-muted-foreground tnum">{fmtDate(t.updatedAt)}</DataTableCell>
                      <DataTableCell align="right" stopPropagation>
                        <div className="flex justify-end gap-0.5">{actions(t)}</div>
                      </DataTableCell>
                    </DataTableRow>
                  );
                })}
              </DataTableBody>
            </DataTable>
          }
          mobile={
            <MobileCardList>
              {rows.map((t, i) => {
                const status = templateStatus(t.channel, t.status);
                return <MobileCard key={t.id} index={i} onClick={() => openEditor(t)} title={t.name} subtitle={`${CHANNEL_LABEL[t.channel]} · ${excerpt(t)}`} badge={<StatusBadge tone={status.tone}>{status.label}</StatusBadge>} meta={[{ label: "Alterado em", value: fmtDate(t.updatedAt), num: true }]} actions={actions(t)} />;
              })}
            </MobileCardList>
          }
        />
      )}

      <ConfirmDialog open={confirming !== null} onOpenChange={(o) => (!o ? setConfirming(null) : null)} danger icon="trash" title={`Apagar o modelo “${confirming?.name}”?`} description="Campanhas já enviadas com ele continuam no histórico." confirmLabel="Apagar" onConfirm={() => (confirming ? remove.mutateAsync(confirming.id) : undefined)} />
    </div>
  );
}

// ── peças comuns dos editores ──

function EditorShell({ title, onClose, actions, left, right }: { title: string; onClose: () => void; actions: ReactNode; left: ReactNode; right: ReactNode }) {
  return (
    <div className="space-y-5">
      <PageHeader back={onClose} title={title} actions={actions} />
      <div className="grid items-start gap-4 xl:grid-cols-2">
        <Card>
          <CardContent className="space-y-5">{left}</CardContent>
        </Card>
        <Card className="xl:sticky xl:top-24">
          <CardContent>{right}</CardContent>
        </Card>
      </div>
    </div>
  );
}

const VARIABLES_HINT = (
  <>
    Use <code className="rounded bg-surface-2 px-1 font-mono text-caption text-foreground">{"{{primeiro_nome}}"}</code>, <code className="rounded bg-surface-2 px-1 font-mono text-caption text-foreground">{"{{nome}}"}</code> e <code className="rounded bg-surface-2 px-1 font-mono text-caption text-foreground">{"{{organizacao}}"}</code> pra mensagem sair com o nome de cada pessoa.
  </>
);

/** Prévia vinda do backend (o mesmo código que monta a mensagem de verdade), com espera de digitação. */
function usePreview(orgId: number, channel: CrmChannel, content: EmailContent | WhatsappContent) {
  const [preview, setPreview] = useState<CrmTemplatePreview | null>(null);
  const serial = useRef(0);
  const key = JSON.stringify(content);
  useEffect(() => {
    const id = ++serial.current;
    const t = setTimeout(() => {
      crmMarketingApi
        .previewTemplate(orgId, channel, content)
        .then((p) => id === serial.current && setPreview(p))
        .catch(() => undefined);
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId, channel, key]);
  return preview;
}

// ── editor de e-mail ──

const BLOCK_META: Record<EmailBlock["type"], { label: string; icon: IconName }> = {
  heading: { label: "Título", icon: "hashtag" },
  text: { label: "Texto", icon: "file-lines" },
  image: { label: "Imagem", icon: "image" },
  button: { label: "Botão", icon: "link" },
  divider: { label: "Linha", icon: "minus" },
  spacer: { label: "Espaço", icon: "expand" },
};
const NEW_BLOCK: Record<EmailBlock["type"], EmailBlock> = {
  heading: { type: "heading", text: "" },
  text: { type: "text", text: "" },
  image: { type: "image", url: "", alt: "" },
  button: { type: "button", label: "", href: "https://" },
  divider: { type: "divider" },
  spacer: { type: "spacer" },
};

function EmailEditor({ orgId, template, onClose, readOnly }: { orgId: number; template: CrmTemplate<EmailContent> | null; onClose: () => void; readOnly: boolean }) {
  const [id, setId] = useState<number | null>(template?.id ?? null);
  const [name, setName] = useState(template?.name ?? "");
  const [content, setContent] = useState<EmailContent>(template?.content ?? NEW_EMAIL);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const preview = usePreview(orgId, "EMAIL", content);

  const onError = (error: unknown) => toast.error(getErrorMessage(error, "Não foi possível salvar."));
  const save = useMutation({
    mutationFn: () => (id ? crmMarketingApi.updateTemplate(orgId, id, { name: name.trim(), content }) : crmMarketingApi.createTemplate(orgId, { channel: "EMAIL", name: name.trim(), content })),
    onSuccess: (t) => {
      setId(t.id);
      toast.success(t.status === "APPROVED" ? "Modelo salvo e pronto pra usar" : "Modelo salvo. Ainda falta completar pra poder usar.");
    },
    onError,
  });
  const test = useMutation({
    mutationFn: () => crmMarketingApi.testTemplate(orgId, id as number),
    onSuccess: (r) => toast.success(`Teste enviado para ${r.sentTo}`),
    onError: (error) => toast.error(getErrorMessage(error, "Não foi possível enviar o teste.")),
  });

  const setBlock = (index: number, block: EmailBlock) => setContent({ ...content, blocks: content.blocks.map((b, i) => (i === index ? block : b)) });
  const move = (index: number, delta: number) => {
    const blocks = [...content.blocks];
    const [item] = blocks.splice(index, 1);
    blocks.splice(index + delta, 0, item);
    setContent({ ...content, blocks });
  };
  const problems = preview?.problems ?? [];

  return (
    <EditorShell
      title={template ? "Modelo de e-mail" : "Novo modelo de e-mail"}
      onClose={onClose}
      actions={
        readOnly ? null : (
          <>
            <Button variant="outline" leftIcon="send" disabled={!id} loading={test.isPending} onClick={() => test.mutate()} title={id ? undefined : "Salve o modelo antes de testar"}>
              Enviar teste pra mim
            </Button>
            <Button leftIcon="save" disabled={name.trim().length < 2} loading={save.isPending} onClick={() => save.mutate()}>
              Salvar modelo
            </Button>
          </>
        )
      }
      left={
        <>
          <Field label="Nome do modelo" htmlFor="tpl-nome" hint="Só você vê. Serve pra achar o modelo depois.">
            <Input id="tpl-nome" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} placeholder="Ex.: Abertura de vendas" />
          </Field>
          <Field label="Assunto" htmlFor="tpl-assunto">
            <Input id="tpl-assunto" value={content.subject} onChange={(e) => setContent({ ...content, subject: e.target.value })} maxLength={150} placeholder="Ex.: {{primeiro_nome}}, abrimos as vendas do Réveillon" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto]">
            <Field label="Texto ao lado do assunto" htmlFor="tpl-preheader" optional hint="Aparece na caixa de entrada, depois do assunto.">
              <Input id="tpl-preheader" value={content.preheader ?? ""} onChange={(e) => setContent({ ...content, preheader: e.target.value || undefined })} maxLength={150} />
            </Field>
            <Field label="Cor dos botões" htmlFor="tpl-cor">
              <input id="tpl-cor" type="color" value={content.accentColor ?? "#e5179c"} onChange={(e) => setContent({ ...content, accentColor: e.target.value })} className="h-11 w-[72px] cursor-pointer rounded-input border border-border bg-surface-2 p-1 md:h-10" />
            </Field>
          </div>

          <div>
            <p className="text-sm font-semibold text-foreground">Conteúdo</p>
            <Note className="mt-1">{VARIABLES_HINT}</Note>
            <ol className="mt-3 space-y-2.5">
              {content.blocks.map((block, index) => (
                <li key={index} className="surface-inset rounded-xl p-3.5">
                  <div className="mb-2.5 flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-caption font-semibold uppercase tracking-wider text-muted-foreground">
                      <Icon name={BLOCK_META[block.type].icon} size={11} />
                      {BLOCK_META[block.type].label}
                    </span>
                    <span className="flex gap-0.5">
                      <Button variant="subtle" size="icon-sm" className="size-8" aria-label="Subir" title="Subir" disabled={index === 0} onClick={() => move(index, -1)}>
                        <Icon name="arrow-up" size={12} />
                      </Button>
                      <Button variant="subtle" size="icon-sm" className="size-8" aria-label="Descer" title="Descer" disabled={index === content.blocks.length - 1} onClick={() => move(index, 1)}>
                        <Icon name="arrow-down" size={12} />
                      </Button>
                      <Button variant="subtle" size="icon-sm" className="size-8 hover:bg-danger-bg hover:text-danger" aria-label="Remover bloco" title="Remover" onClick={() => setContent({ ...content, blocks: content.blocks.filter((_, i) => i !== index) })}>
                        <Icon name="trash" size={12} />
                      </Button>
                    </span>
                  </div>
                  <BlockFields block={block} onChange={(b) => setBlock(index, b)} />
                </li>
              ))}
            </ol>
            <div className="mt-3 flex flex-wrap gap-2">
              {(Object.keys(BLOCK_META) as EmailBlock["type"][]).map((type) => (
                <Button key={type} variant="outline" size="sm" leftIcon="plus" onClick={() => setContent({ ...content, blocks: [...content.blocks, NEW_BLOCK[type]] })}>
                  {BLOCK_META[type].label}
                </Button>
              ))}
            </div>
            <Note className="mt-3">O rodapé com o nome da sua empresa e o link pra sair da lista entra sozinho em todo e-mail.</Note>
          </div>
        </>
      }
      right={
        <>
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-caption text-muted-foreground">Prévia para Maria Souza</p>
              <p className="truncate text-sm font-semibold text-foreground">{preview?.channel === "EMAIL" && preview.subject ? preview.subject : "Sem assunto"}</p>
            </div>
            <SegmentedControl
              size="sm"
              value={device}
              onChange={setDevice}
              options={[
                { value: "desktop", label: "Computador", icon: "desktop" },
                { value: "mobile", label: "Celular", icon: "mobile" },
              ]}
            />
          </div>
          {preview?.channel === "EMAIL" ? (
            <div className={cn("mx-auto transition-[max-width] duration-300 ease-out", device === "mobile" ? "max-w-[390px]" : "max-w-full")}>
              <EmailPreviewFrame html={preview.html} className="h-[640px]" />
            </div>
          ) : (
            <Skeleton className="h-[640px] rounded-card" />
          )}
          {problems.length ? (
            <div className="mt-3">
              <Blockers items={problems} title="Falta pro modelo ficar pronto" />
            </div>
          ) : null}
        </>
      }
    />
  );
}

function BlockFields({ block, onChange }: { block: EmailBlock; onChange: (block: EmailBlock) => void }) {
  const [uploading, setUploading] = useState(false);
  if (block.type === "heading") return <Input aria-label="Título" value={block.text} onChange={(e) => onChange({ ...block, text: e.target.value })} maxLength={200} placeholder="Título" />;
  if (block.type === "text") {
    return <Textarea aria-label="Texto" value={block.text} onChange={(e) => onChange({ ...block, text: e.target.value })} maxLength={5000} rows={4} placeholder="Texto. Deixe uma linha em branco pra separar parágrafos." className="min-h-0" />;
  }
  if (block.type === "button") {
    return (
      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
        <Input aria-label="Texto do botão" value={block.label} onChange={(e) => onChange({ ...block, label: e.target.value })} maxLength={80} placeholder="Texto do botão" />
        <Input aria-label="Link do botão" type="url" leftIcon="link" value={block.href} onChange={(e) => onChange({ ...block, href: e.target.value })} placeholder="https://" />
      </div>
    );
  }
  if (block.type === "image") {
    const upload = async (file?: File) => {
      if (!file) return;
      setUploading(true);
      try {
        const form = new FormData();
        form.append("files", file);
        const res = await api.post<{ data: string[] }>("/upload", form, { headers: { "Content-Type": "multipart/form-data" } });
        if (res.data.data[0]) onChange({ ...block, url: res.data.data[0] });
      } catch (error) {
        toast.error(getErrorMessage(error, "Não foi possível enviar a imagem."));
      } finally {
        setUploading(false);
      }
    };
    return (
      <div className="space-y-2">
        <div className="flex gap-2">
          <Input aria-label="Endereço da imagem" type="url" leftIcon="image" value={block.url} onChange={(e) => onChange({ ...block, url: e.target.value })} placeholder="https://… ou envie um arquivo" />
          <label className="inline-flex h-11 shrink-0 cursor-pointer items-center gap-2 rounded-input border border-border-strong px-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-surface-2 md:h-10">
            <Icon name={uploading ? "loader" : "upload"} size={13} className={cn(uploading && "animate-spin")} />
            Enviar
            <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="sr-only" onChange={(e) => void upload(e.target.files?.[0])} />
          </label>
        </div>
        <FieldGroup columns={2} className="gap-2">
          <Input aria-label="Descrição da imagem" value={block.alt ?? ""} onChange={(e) => onChange({ ...block, alt: e.target.value })} maxLength={200} placeholder="Descrição (pra quem não vê a imagem)" />
          <Input aria-label="Link ao clicar na imagem" type="url" value={block.href ?? ""} onChange={(e) => onChange({ ...block, href: e.target.value || undefined })} placeholder="Link ao clicar (opcional)" />
        </FieldGroup>
      </div>
    );
  }
  return <Note>{block.type === "divider" ? "Uma linha fina separando duas partes." : "Um respiro entre dois blocos."}</Note>;
}

// ── editor de WhatsApp ──

function WhatsappEditor({ orgId, template, connected, onClose, readOnly }: { orgId: number; template: CrmTemplate<WhatsappContent> | null; connected: boolean; onClose: () => void; readOnly: boolean }) {
  const [current, setCurrent] = useState(template);
  const [name, setName] = useState(template?.name ?? "");
  const [content, setContent] = useState<WhatsappContent>(template?.content ?? NEW_WHATSAPP);
  const preview = usePreview(orgId, "WHATSAPP", content);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const status = current ? templateStatus("WHATSAPP", current.status) : null;
  const locked = current !== null && !["DRAFT", "REJECTED"].includes(current.status);
  const onError = (error: unknown) => toast.error(getErrorMessage(error, "Não foi possível concluir."));

  const save = useMutation({
    mutationFn: () => (current ? crmMarketingApi.updateTemplate(orgId, current.id, { name: name.trim(), content }) : crmMarketingApi.createTemplate(orgId, { channel: "WHATSAPP", name: name.trim(), content })),
    onSuccess: (t) => {
      setCurrent(t as CrmTemplate<WhatsappContent>);
      toast.success("Rascunho salvo");
    },
    onError,
  });
  const submit = useMutation({
    mutationFn: () => crmMarketingApi.submitTemplate(orgId, current!.id),
    onSuccess: (t) => {
      setCurrent(t as CrmTemplate<WhatsappContent>);
      toast.success("Modelo enviado pra análise da Meta");
    },
    onError,
  });
  const sync = useMutation({
    mutationFn: () => crmMarketingApi.syncTemplate(orgId, current!.id),
    onSuccess: (t) => {
      setCurrent(t as CrmTemplate<WhatsappContent>);
      toast.success("Situação atualizada com a Meta");
    },
    onError,
  });

  const insert = (variable: string) => {
    const el = bodyRef.current;
    const at = el?.selectionStart ?? content.body.length;
    setContent({ ...content, body: `${content.body.slice(0, at)}{{${variable}}}${content.body.slice(el?.selectionEnd ?? at)}` });
  };
  const setButton = (index: number, button: WhatsappButton) => setContent({ ...content, buttons: content.buttons.map((b, i) => (i === index ? button : b)) });
  const problems = preview?.problems ?? [];
  const dirty = current === null || name.trim() !== current.name || JSON.stringify(content) !== JSON.stringify(current.content);

  return (
    <EditorShell
      title={template ? "Modelo de WhatsApp" : "Novo modelo de WhatsApp"}
      onClose={onClose}
      actions={
        readOnly ? null : locked ? (
          <Button variant="outline" leftIcon="refresh" loading={sync.isPending} onClick={() => sync.mutate()}>
            Atualizar situação
          </Button>
        ) : (
          <>
            <Button variant="outline" leftIcon="save" disabled={name.trim().length < 2 || !dirty} loading={save.isPending} onClick={() => save.mutate()}>
              Salvar rascunho
            </Button>
            <Button leftIcon="send" disabled={!current || dirty || problems.length > 0 || !connected} loading={submit.isPending} title={!connected ? "Conecte o WhatsApp Business em Canais" : dirty ? "Salve o rascunho antes" : undefined} onClick={() => submit.mutate()}>
              Enviar pra análise da Meta
            </Button>
          </>
        )
      }
      left={
        <>
          {status ? (
            <div className="flex flex-wrap items-center gap-2.5">
              <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
              {current?.statusSyncedAt ? <span className="text-caption text-muted-foreground">Situação informada pela Meta em {fmtDate(current.statusSyncedAt)}</span> : null}
            </div>
          ) : null}
          {current?.rejectionReason ? <Blockers items={[current.rejectionReason]} title="Motivo informado pela Meta" /> : null}
          {locked ? <Callout tone="neutral">Depois de enviado pra análise, o texto não pode mais ser alterado. Pra mudar a mensagem, crie um modelo novo.</Callout> : null}
          {!connected && !locked ? <Callout tone="info">Você pode escrever e salvar o rascunho agora. Pra enviar à análise, conecte o WhatsApp Business em Canais.</Callout> : null}

          <fieldset disabled={locked} className="space-y-5 disabled:opacity-70">
            <Field label="Nome do modelo" htmlFor="wa-nome" hint="Só você vê.">
              <Input id="wa-nome" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} placeholder="Ex.: Abertura de vendas" />
            </Field>
            <Field label="Tipo de mensagem" htmlFor="wa-tipo" hint="A Meta cobra valores diferentes por tipo e pode reclassificar o modelo na análise.">
              <NativeSelect id="wa-tipo" value={content.category} onChange={(e) => setContent({ ...content, category: e.target.value as WhatsappContent["category"] })}>
                <option value="MARKETING">Divulgação (novidades, eventos, promoções)</option>
                <option value="UTILITY">Serviço (aviso sobre algo que a pessoa já contratou)</option>
              </NativeSelect>
            </Field>
            <Field label="Título" htmlFor="wa-titulo" optional hint="Uma linha em destaque no topo, sem variável.">
              <Input id="wa-titulo" value={content.headerText ?? ""} onChange={(e) => setContent({ ...content, headerText: e.target.value || undefined })} maxLength={60} />
            </Field>
            <div>
              <Field label="Mensagem" htmlFor="wa-body" hint="A mensagem não pode começar nem terminar com uma variável (regra da Meta).">
                <Textarea id="wa-body" ref={bodyRef} value={content.body} onChange={(e) => setContent({ ...content, body: e.target.value })} maxLength={1024} rows={6} placeholder="Oi {{primeiro_nome}}, abrimos as vendas do nosso próximo evento." />
              </Field>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-caption text-muted-foreground">
                Inserir:
                {["primeiro_nome", "nome", "organizacao"].map((v) => (
                  <button key={v} type="button" onClick={() => insert(v)} className="press rounded-md bg-surface-2 px-2 py-1 font-mono text-caption text-foreground outline-none hover:bg-surface-3 focus-visible:ring-2 focus-visible:ring-brand">
                    {`{{${v}}}`}
                  </button>
                ))}
              </div>
            </div>
            <Field label="Rodapé" htmlFor="wa-rodape" optional hint='Ex.: "Responda SAIR para não receber mais".'>
              <Input id="wa-rodape" value={content.footer ?? ""} onChange={(e) => setContent({ ...content, footer: e.target.value || undefined })} maxLength={60} />
            </Field>
            <div>
              <p className="text-sm font-semibold text-foreground">Botões</p>
              <ul className="mt-2 space-y-2">
                {content.buttons.map((button, index) => (
                  <li key={index} className="flex flex-wrap gap-2 sm:flex-nowrap">
                    <NativeSelect aria-label="Tipo do botão" value={button.type} onChange={(e) => setButton(index, e.target.value === "URL" ? { type: "URL", text: button.text, url: "https://" } : { type: "QUICK_REPLY", text: button.text })} className="sm:w-[180px]">
                      <option value="URL">Abre um link</option>
                      <option value="QUICK_REPLY">Resposta rápida</option>
                    </NativeSelect>
                    <Input aria-label="Texto do botão" value={button.text} onChange={(e) => setButton(index, { ...button, text: e.target.value })} maxLength={25} placeholder="Texto" className="min-w-0 flex-1" />
                    {button.type === "URL" ? <Input aria-label="Link" type="url" value={button.url} onChange={(e) => setButton(index, { ...button, url: e.target.value })} placeholder="https://" className="min-w-0 flex-[1.4]" /> : null}
                    <Button variant="subtle" size="icon" aria-label="Remover botão" title="Remover" className="shrink-0 hover:bg-danger-bg hover:text-danger" onClick={() => setContent({ ...content, buttons: content.buttons.filter((_, i) => i !== index) })}>
                      <Icon name="trash" size={13} />
                    </Button>
                  </li>
                ))}
              </ul>
              {content.buttons.length < 3 ? (
                <Button variant="outline" size="sm" leftIcon="plus" className="mt-2" onClick={() => setContent({ ...content, buttons: [...content.buttons, { type: "URL", text: "", url: "https://" }] })}>
                  Botão
                </Button>
              ) : null}
            </div>
          </fieldset>
        </>
      }
      right={
        <>
          <p className="mb-3 text-caption text-muted-foreground">Prévia para Maria Souza</p>
          {preview?.channel === "WHATSAPP" ? <WhatsappBubble preview={preview} /> : <Skeleton className="h-48 rounded-card" />}
          {problems.length && !locked ? (
            <div className="mt-3">
              <Blockers items={problems} title="Falta pra enviar à análise" />
            </div>
          ) : null}
          <Note className="mt-4">No WhatsApp, mensagem de empresa só sai com um modelo aprovado pela Meta. A situação mostrada aqui é sempre a que a Meta informou.</Note>
        </>
      }
    />
  );
}
