"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowLeft, ArrowUp, Loader2, Monitor, Plus, RefreshCw, Smartphone, Trash2, Upload } from "lucide-react";
import api, { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import type { CrmChannel } from "@/services/crm";
import { crmMarketingApi, crmMarketingKeys, type CrmTemplate, type CrmTemplatePreview, type EmailBlock, type EmailContent, type WhatsappButton, type WhatsappContent } from "@/services/crm-marketing";
import { BlockSkeleton } from "../../_components/states/loading-state";
import { Pill, PRESSABLE, SURFACE, fmtDate } from "../../financeiro/_components/finance-ui";
import { BTN_PRIMARY, BTN_SECONDARY, CHANNEL_LABEL, ChannelIcon, FIELD, LINK } from "./crm-ui";
import { Blockers, EmailPreviewFrame, WhatsappBubble, templateStatus } from "./marketing-ui";

const TH = "px-5 py-3 font-semibold";
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
  const [filter, setFilter] = useState<CrmChannel | "">("");
  const [editing, setEditing] = useState<Editing>(null);
  const [confirming, setConfirming] = useState<number | null>(null);
  const list = useQuery({ queryKey: crmMarketingKeys.templates(orgId), queryFn: () => crmMarketingApi.listTemplates(orgId) });

  const refresh = () => void queryClient.invalidateQueries({ queryKey: crmMarketingKeys.templates(orgId) });
  const remove = useMutation({
    mutationFn: (id: number) => crmMarketingApi.removeTemplate(orgId, id),
    onSuccess: () => {
      refresh();
      setConfirming(null);
      toast.success("Modelo apagado.");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Não foi possível apagar o modelo.")),
  });

  if (editing) {
    const close = () => {
      setEditing(null);
      refresh();
    };
    return editing.channel === "EMAIL" ? (
      <EmailEditor orgId={orgId} template={editing.template as CrmTemplate<EmailContent> | null} onClose={close} readOnly={!canManage} />
    ) : (
      <WhatsappEditor orgId={orgId} template={editing.template as CrmTemplate<WhatsappContent> | null} connected={whatsappConnected} onClose={close} readOnly={!canManage} />
    );
  }

  const rows = (list.data ?? []).filter((t) => !filter || t.channel === filter);
  const excerpt = (t: CrmTemplate) => (t.channel === "EMAIL" ? (t.content as EmailContent).subject || "Sem assunto" : (t.content as WhatsappContent).body || "Sem texto");

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2" aria-label="Filtrar por canal">
          {(
            [
              ["", "Todos"],
              ["EMAIL", "E-mail"],
              ["WHATSAPP", "WhatsApp"],
            ] as [CrmChannel | "", string][]
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              aria-pressed={filter === key}
              onClick={() => setFilter(key)}
              className={cn(
                "h-9 rounded-full border px-3.5 text-[13.5px] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-[#7c3aed]",
                filter === key ? "border-[#1c1a24] bg-[#1c1a24] text-white" : "border-[#e6e2ef] bg-white text-[#3a3746] hover:bg-[#faf8ff]",
                PRESSABLE,
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <div className={cn("flex gap-2", !canManage && "hidden")}>
          <button type="button" onClick={() => setEditing({ template: null, channel: "WHATSAPP" })} className={cn(BTN_SECONDARY, PRESSABLE)}>
            <Plus size={16} strokeWidth={2} aria-hidden="true" />
            Modelo de WhatsApp
          </button>
          <button type="button" onClick={() => setEditing({ template: null, channel: "EMAIL" })} className={cn(BTN_PRIMARY, PRESSABLE)}>
            <Plus size={16} strokeWidth={2} aria-hidden="true" />
            Modelo de e-mail
          </button>
        </div>
      </div>

      <div className={cn(SURFACE, "overflow-hidden")}>
        {list.isLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <BlockSkeleton key={i} className="h-14" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <p className="mx-auto max-w-[52ch] text-[15px] font-semibold text-[#1c1a24]">Um modelo é a mensagem pronta que você usa nas campanhas.</p>
            <p className="mx-auto mt-2 max-w-[62ch] text-[14px] leading-relaxed text-[#5f5c6b]">
              O de e-mail fica pronto assim que você salva. O de WhatsApp precisa ser aprovado pela Meta antes do primeiro envio, o que costuma levar de minutos a um dia.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-[#f2f0f7] lg:hidden">
            {rows.map((t) => (
              <li key={t.id}>
                <button type="button" onClick={() => setEditing({ template: t, channel: t.channel })} className="flex w-full items-start justify-between gap-3 px-4 py-3.5 text-left hover:bg-[#faf8ff]">
                  <span className="min-w-0">
                    <span className="flex items-center gap-2 font-medium">
                      <span className="text-[#6b6878]"><ChannelIcon channel={t.channel} /></span>
                      <span className="truncate">{t.name}</span>
                    </span>
                    <span className="mt-0.5 block truncate text-[13px] text-[#5f5c6b]">{excerpt(t)}</span>
                  </span>
                  <Pill tone={templateStatus(t.channel, t.status).tone}>{templateStatus(t.channel, t.status).label}</Pill>
                </button>
              </li>
            ))}
          </ul>
        )}
        {rows.length > 0 ? (
          <table className="hidden w-full text-left text-[14px] lg:table">
            <thead className="bg-[#fbfaff] text-[13px] text-[#5f5c6b]">
              <tr className="border-b border-[#ebe8f2]">
                <th scope="col" className={cn(TH, "w-[26%]")}>Modelo</th>
                <th scope="col" className={TH}>Mensagem</th>
                <th scope="col" className={TH}>Canal</th>
                <th scope="col" className={TH}>Situação</th>
                <th scope="col" className={TH}>Alterado em</th>
                <th scope="col" className={cn(TH, "w-[200px]")}><span className="sr-only">Ações</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f2f0f7]">
              {rows.map((t) => {
                const status = templateStatus(t.channel, t.status);
                return (
                  <tr key={t.id} className="cursor-pointer hover:bg-[#faf8ff]" onClick={() => setEditing({ template: t, channel: t.channel })}>
                    <td className="px-5 py-4 font-medium text-[#1c1a24]">{t.name}</td>
                    <td className="max-w-0 px-5 py-4 text-[#3a3746]">
                      <span className="block truncate">{excerpt(t)}</span>
                      {t.rejectionReason ? <span className="block truncate text-[13px] text-[#9b1c35]">Motivo da Meta: {t.rejectionReason}</span> : null}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <span className="flex items-center gap-2 text-[#3a3746]">
                        <span className="text-[#6b6878]"><ChannelIcon channel={t.channel} /></span>
                        {CHANNEL_LABEL[t.channel]}
                      </span>
                    </td>
                    <td className="px-5 py-4"><Pill tone={status.tone}>{status.label}</Pill></td>
                    <td className="whitespace-nowrap px-5 py-4 font-poppins text-[13.5px] tabular-nums text-[#5f5c6b]">{fmtDate(t.updatedAt)}</td>
                    <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                      {confirming === t.id ? (
                        <span className="flex items-center justify-end gap-3 text-[13px]">
                          <span className="text-[#3a3746]">Apagar?</span>
                          <button type="button" onClick={() => setConfirming(null)} className={cn(LINK, "text-[#5f5c6b]", PRESSABLE)}>Voltar</button>
                          <button type="button" disabled={remove.isPending} onClick={() => remove.mutate(t.id)} className={cn(LINK, "text-[#9b1c35] hover:text-[#7f1529]", PRESSABLE)}>Apagar</button>
                        </span>
                      ) : (
                        <span className="flex items-center justify-end gap-3">
                          <button type="button" onClick={() => setEditing({ template: t, channel: t.channel })} className={cn(LINK, PRESSABLE)}>Abrir</button>
                          <button type="button" aria-label={`Apagar modelo ${t.name}`} onClick={() => setConfirming(t.id)} className={cn(!canManage && "hidden", "flex h-9 w-9 items-center justify-center rounded-lg text-[#5b5868] outline-none hover:bg-[#f3f1f8] focus-visible:ring-2 focus-visible:ring-[#7c3aed]", PRESSABLE)}>
                            <Trash2 size={17} strokeWidth={1.8} aria-hidden="true" />
                          </button>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : null}
      </div>
    </div>
  );
}

// ── peças comuns dos editores ──

function EditorShell({ title, onClose, actions, left, right }: { title: string; onClose: () => void; actions: ReactNode; left: ReactNode; right: ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={onClose} className={cn("flex items-center gap-2 rounded-md text-[15px] font-semibold text-[#1c1a24] outline-none hover:text-[#7c3aed] focus-visible:ring-2 focus-visible:ring-[#7c3aed]", PRESSABLE)}>
          <ArrowLeft size={17} strokeWidth={2} aria-hidden="true" />
          {title}
        </button>
        <div className="flex flex-wrap gap-2">{actions}</div>
      </div>
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section className={cn(SURFACE, "space-y-5 p-5 sm:p-6")}>{left}</section>
        <section className={cn(SURFACE, "p-5 sm:p-6 xl:sticky xl:top-4")}>{right}</section>
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13.5px] font-semibold text-[#1c1a24]">{label}</span>
      {children}
      {hint ? <span className="mt-1.5 block text-[13px] leading-relaxed text-[#6b6878]">{hint}</span> : null}
    </label>
  );
}

const VARIABLES_HINT = (
  <>
    Use <code className="font-mono text-[12.5px] text-[#1c1a24]">{"{{primeiro_nome}}"}</code>, <code className="font-mono text-[12.5px] text-[#1c1a24]">{"{{nome}}"}</code> e{" "}
    <code className="font-mono text-[12.5px] text-[#1c1a24]">{"{{organizacao}}"}</code> para a mensagem sair com o nome de cada pessoa.
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

const BLOCK_LABEL: Record<EmailBlock["type"], string> = { heading: "Título", text: "Texto", image: "Imagem", button: "Botão", divider: "Linha", spacer: "Espaço" };
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
      toast.success(t.status === "APPROVED" ? "Modelo salvo e pronto para usar." : "Modelo salvo. Ainda falta completar para poder usar.");
    },
    onError,
  });
  const test = useMutation({
    mutationFn: () => crmMarketingApi.testTemplate(orgId, id as number),
    onSuccess: (r) => toast.success(`Teste enviado para ${r.sentTo}.`),
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
        readOnly ? null : <>
          <button type="button" disabled={!id || test.isPending} onClick={() => test.mutate()} title={id ? undefined : "Salve o modelo antes de testar"} className={cn(BTN_SECONDARY, PRESSABLE)}>
            {test.isPending ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : null}
            Enviar teste para mim
          </button>
          <button type="button" disabled={name.trim().length < 2 || save.isPending} onClick={() => save.mutate()} className={cn(BTN_PRIMARY, PRESSABLE)}>
            {save.isPending ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : null}
            Salvar modelo
          </button>
        </>
      }
      left={
        <>
          <Field label="Nome do modelo" hint="Só você vê. Serve para achar o modelo depois.">
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={120} placeholder="Ex.: Abertura de vendas" className={cn(FIELD, "w-full px-3.5")} />
          </Field>
          <Field label="Assunto">
            <input value={content.subject} onChange={(e) => setContent({ ...content, subject: e.target.value })} maxLength={150} placeholder="Ex.: {{primeiro_nome}}, abrimos as vendas do Réveillon" className={cn(FIELD, "w-full px-3.5")} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto]">
            <Field label="Texto ao lado do assunto" hint="Aparece na caixa de entrada, depois do assunto. Opcional.">
              <input value={content.preheader ?? ""} onChange={(e) => setContent({ ...content, preheader: e.target.value || undefined })} maxLength={150} className={cn(FIELD, "w-full px-3.5")} />
            </Field>
            <Field label="Cor dos botões">
              <input type="color" value={content.accentColor ?? "#7c3aed"} onChange={(e) => setContent({ ...content, accentColor: e.target.value })} className="h-11 w-[72px] cursor-pointer rounded-[12px] border border-[#e6e2ef] bg-white p-1" />
            </Field>
          </div>

          <div>
            <p className="text-[13.5px] font-semibold text-[#1c1a24]">Conteúdo</p>
            <p className="mt-1 text-[13px] leading-relaxed text-[#6b6878]">{VARIABLES_HINT}</p>
            <ol className="mt-3 space-y-3">
              {content.blocks.map((block, index) => (
                <li key={index} className="rounded-[14px] border border-[#ebe8f2] p-3.5">
                  <div className="mb-2.5 flex items-center justify-between gap-2">
                    <span className="text-[13px] font-semibold text-[#5f5c6b]">{BLOCK_LABEL[block.type]}</span>
                    <span className="flex gap-1">
                      <IconButton label="Subir" disabled={index === 0} onClick={() => move(index, -1)}><ArrowUp size={15} aria-hidden="true" /></IconButton>
                      <IconButton label="Descer" disabled={index === content.blocks.length - 1} onClick={() => move(index, 1)}><ArrowDown size={15} aria-hidden="true" /></IconButton>
                      <IconButton label="Remover bloco" onClick={() => setContent({ ...content, blocks: content.blocks.filter((_, i) => i !== index) })}><Trash2 size={15} strokeWidth={1.8} aria-hidden="true" /></IconButton>
                    </span>
                  </div>
                  <BlockFields block={block} onChange={(b) => setBlock(index, b)} />
                </li>
              ))}
            </ol>
            <div className="mt-3 flex flex-wrap gap-2">
              {(Object.keys(BLOCK_LABEL) as EmailBlock["type"][]).map((type) => (
                <button key={type} type="button" onClick={() => setContent({ ...content, blocks: [...content.blocks, NEW_BLOCK[type]] })} className={cn(BTN_SECONDARY, "h-9 px-3 text-[13.5px]", PRESSABLE)}>
                  <Plus size={14} strokeWidth={2} aria-hidden="true" />
                  {BLOCK_LABEL[type]}
                </button>
              ))}
            </div>
            <p className="mt-3 text-[13px] leading-relaxed text-[#6b6878]">O rodapé com o nome da sua empresa e o link para sair da lista entra sozinho em todo e-mail.</p>
          </div>
        </>
      }
      right={
        <>
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[13px] text-[#6b6878]">Prévia para Maria Souza</p>
              <p className="truncate text-[15px] font-semibold text-[#1c1a24]">{preview?.channel === "EMAIL" && preview.subject ? preview.subject : "Sem assunto"}</p>
            </div>
            <div className="flex shrink-0 gap-1 rounded-[10px] bg-[#efecf6] p-1" role="group" aria-label="Tamanho da prévia">
              {(
                [
                  ["desktop", "Computador", Monitor],
                  ["mobile", "Celular", Smartphone],
                ] as const
              ).map(([key, label, Icon]) => (
                <button key={key} type="button" aria-label={label} aria-pressed={device === key} onClick={() => setDevice(key)} className={cn("flex h-8 w-9 items-center justify-center rounded-[7px] outline-none focus-visible:ring-2 focus-visible:ring-[#7c3aed]", device === key ? "bg-white text-[#1c1a24] shadow-[0_1px_2px_rgba(28,24,48,0.1)]" : "text-[#6b6878]")}>
                  <Icon size={16} strokeWidth={1.8} aria-hidden="true" />
                </button>
              ))}
            </div>
          </div>
          {preview?.channel === "EMAIL" ? (
            <div className={cn("mx-auto transition-[max-width] duration-300 ease-out", device === "mobile" ? "max-w-[390px]" : "max-w-full")}>
              <EmailPreviewFrame html={preview.html} className="h-[640px]" />
            </div>
          ) : (
            <BlockSkeleton className="h-[640px]" />
          )}
          {problems.length ? <div className="mt-3"><Blockers items={problems} title="Falta para o modelo ficar pronto" /></div> : null}
        </>
      }
    />
  );
}

function IconButton({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: ReactNode }) {
  return (
    <button type="button" aria-label={label} disabled={disabled} onClick={onClick} className={cn("flex h-8 w-8 items-center justify-center rounded-lg text-[#5b5868] outline-none hover:bg-[#f3f1f8] focus-visible:ring-2 focus-visible:ring-[#7c3aed] disabled:opacity-30", PRESSABLE)}>
      {children}
    </button>
  );
}

function BlockFields({ block, onChange }: { block: EmailBlock; onChange: (block: EmailBlock) => void }) {
  const [uploading, setUploading] = useState(false);
  const INPUT = cn(FIELD, "w-full px-3.5");
  if (block.type === "heading") return <input aria-label="Título" value={block.text} onChange={(e) => onChange({ ...block, text: e.target.value })} maxLength={200} placeholder="Título" className={INPUT} />;
  if (block.type === "text") {
    return <textarea aria-label="Texto" value={block.text} onChange={(e) => onChange({ ...block, text: e.target.value })} maxLength={5000} rows={4} placeholder="Texto. Deixe uma linha em branco para separar parágrafos." className={cn(FIELD, "h-auto w-full resize-y px-3.5 py-2.5 leading-relaxed")} />;
  }
  if (block.type === "button") {
    return (
      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
        <input aria-label="Texto do botão" value={block.label} onChange={(e) => onChange({ ...block, label: e.target.value })} maxLength={80} placeholder="Texto do botão" className={INPUT} />
        <input aria-label="Link do botão" type="url" value={block.href} onChange={(e) => onChange({ ...block, href: e.target.value })} placeholder="https://" className={INPUT} />
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
          <input aria-label="Endereço da imagem" type="url" value={block.url} onChange={(e) => onChange({ ...block, url: e.target.value })} placeholder="https://… ou envie um arquivo" className={INPUT} />
          <label className={cn(BTN_SECONDARY, "h-11 shrink-0 cursor-pointer rounded-[12px]", PRESSABLE)}>
            {uploading ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <Upload size={15} strokeWidth={1.8} aria-hidden="true" />}
            Enviar
            <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="sr-only" onChange={(e) => void upload(e.target.files?.[0])} />
          </label>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <input aria-label="Descrição da imagem" value={block.alt ?? ""} onChange={(e) => onChange({ ...block, alt: e.target.value })} maxLength={200} placeholder="Descrição (para quem não vê a imagem)" className={INPUT} />
          <input aria-label="Link ao clicar na imagem" type="url" value={block.href ?? ""} onChange={(e) => onChange({ ...block, href: e.target.value || undefined })} placeholder="Link ao clicar (opcional)" className={INPUT} />
        </div>
      </div>
    );
  }
  return <p className="text-[13px] text-[#6b6878]">{block.type === "divider" ? "Uma linha fina separando duas partes." : "Um respiro entre dois blocos."}</p>;
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
      toast.success("Rascunho salvo.");
    },
    onError,
  });
  const submit = useMutation({
    mutationFn: () => crmMarketingApi.submitTemplate(orgId, current!.id),
    onSuccess: (t) => {
      setCurrent(t as CrmTemplate<WhatsappContent>);
      toast.success("Modelo enviado para análise da Meta.");
    },
    onError,
  });
  const sync = useMutation({
    mutationFn: () => crmMarketingApi.syncTemplate(orgId, current!.id),
    onSuccess: (t) => {
      setCurrent(t as CrmTemplate<WhatsappContent>);
      toast.success("Situação atualizada com a Meta.");
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
          <button type="button" disabled={sync.isPending} onClick={() => sync.mutate()} className={cn(BTN_SECONDARY, PRESSABLE)}>
            {sync.isPending ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <RefreshCw size={15} strokeWidth={1.8} aria-hidden="true" />}
            Atualizar situação
          </button>
        ) : (
          <>
            <button type="button" disabled={name.trim().length < 2 || save.isPending || !dirty} onClick={() => save.mutate()} className={cn(BTN_SECONDARY, PRESSABLE)}>
              {save.isPending ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : null}
              Salvar rascunho
            </button>
            <button
              type="button"
              disabled={!current || dirty || problems.length > 0 || !connected || submit.isPending}
              title={!connected ? "Conecte o WhatsApp Business em Canais" : dirty ? "Salve o rascunho antes" : undefined}
              onClick={() => submit.mutate()}
              className={cn(BTN_PRIMARY, PRESSABLE)}
            >
              {submit.isPending ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : null}
              Enviar para análise da Meta
            </button>
          </>
        )
      }
      left={
        <>
          {status ? (
            <div className="flex flex-wrap items-center gap-2.5">
              <Pill tone={status.tone}>{status.label}</Pill>
              {current?.statusSyncedAt ? <span className="text-[13px] text-[#6b6878]">Situação informada pela Meta em {fmtDate(current.statusSyncedAt)}</span> : null}
            </div>
          ) : null}
          {current?.rejectionReason ? <Blockers items={[current.rejectionReason]} title="Motivo informado pela Meta" /> : null}
          {locked ? <p className="rounded-[14px] bg-[#faf8ff] px-4 py-3 text-[13.5px] leading-relaxed text-[#3a3746]">Depois de enviado para análise, o texto não pode mais ser alterado. Para mudar a mensagem, crie um modelo novo.</p> : null}
          {!connected && !locked ? <p className="rounded-[14px] bg-[#faf8ff] px-4 py-3 text-[13.5px] leading-relaxed text-[#3a3746]">Você pode escrever e salvar o rascunho agora. Para enviar à análise, conecte o WhatsApp Business em Canais.</p> : null}

          <fieldset disabled={locked} className="space-y-5 disabled:opacity-70">
            <Field label="Nome do modelo" hint="Só você vê.">
              <input value={name} onChange={(e) => setName(e.target.value)} maxLength={120} placeholder="Ex.: Abertura de vendas" className={cn(FIELD, "w-full px-3.5")} />
            </Field>
            <Field label="Tipo de mensagem" hint="A Meta cobra valores diferentes por tipo e pode reclassificar o modelo na análise.">
              <select value={content.category} onChange={(e) => setContent({ ...content, category: e.target.value as WhatsappContent["category"] })} className={cn(FIELD, "w-full px-3")}>
                <option value="MARKETING">Divulgação (novidades, eventos, promoções)</option>
                <option value="UTILITY">Serviço (aviso sobre algo que a pessoa já contratou)</option>
              </select>
            </Field>
            <Field label="Título" hint="Opcional. Uma linha em destaque no topo, sem variável.">
              <input value={content.headerText ?? ""} onChange={(e) => setContent({ ...content, headerText: e.target.value || undefined })} maxLength={60} className={cn(FIELD, "w-full px-3.5")} />
            </Field>
            <div>
              <Field label="Mensagem" hint="A mensagem não pode começar nem terminar com uma variável (regra da Meta).">
                <textarea ref={bodyRef} value={content.body} onChange={(e) => setContent({ ...content, body: e.target.value })} maxLength={1024} rows={6} placeholder="Oi {{primeiro_nome}}, abrimos as vendas do nosso próximo evento." className={cn(FIELD, "h-auto w-full resize-y px-3.5 py-2.5 leading-relaxed")} />
              </Field>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-[13px] text-[#6b6878]">
                Inserir:
                {["primeiro_nome", "nome", "organizacao"].map((v) => (
                  <button key={v} type="button" onClick={() => insert(v)} className={cn("rounded-md bg-[#f3f1f8] px-2 py-1 font-mono text-[12.5px] text-[#1c1a24] outline-none hover:bg-[#ebe8f2] focus-visible:ring-2 focus-visible:ring-[#7c3aed]", PRESSABLE)}>
                    {`{{${v}}}`}
                  </button>
                ))}
              </div>
            </div>
            <Field label="Rodapé" hint='Opcional. Ex.: "Responda SAIR para não receber mais".'>
              <input value={content.footer ?? ""} onChange={(e) => setContent({ ...content, footer: e.target.value || undefined })} maxLength={60} className={cn(FIELD, "w-full px-3.5")} />
            </Field>
            <div>
              <p className="text-[13.5px] font-semibold text-[#1c1a24]">Botões</p>
              <ul className="mt-2 space-y-2">
                {content.buttons.map((button, index) => (
                  <li key={index} className="flex flex-wrap gap-2 sm:flex-nowrap">
                    <select aria-label="Tipo do botão" value={button.type} onChange={(e) => setButton(index, e.target.value === "URL" ? { type: "URL", text: button.text, url: "https://" } : { type: "QUICK_REPLY", text: button.text })} className={cn(FIELD, "w-full px-3 sm:w-[170px]")}>
                      <option value="URL">Abre um link</option>
                      <option value="QUICK_REPLY">Resposta rápida</option>
                    </select>
                    <input aria-label="Texto do botão" value={button.text} onChange={(e) => setButton(index, { ...button, text: e.target.value })} maxLength={25} placeholder="Texto" className={cn(FIELD, "w-full min-w-0 flex-1 px-3.5")} />
                    {button.type === "URL" ? <input aria-label="Link" type="url" value={button.url} onChange={(e) => setButton(index, { ...button, url: e.target.value })} placeholder="https://" className={cn(FIELD, "w-full min-w-0 flex-[1.4] px-3.5")} /> : null}
                    <IconButton label="Remover botão" onClick={() => setContent({ ...content, buttons: content.buttons.filter((_, i) => i !== index) })}><Trash2 size={15} strokeWidth={1.8} aria-hidden="true" /></IconButton>
                  </li>
                ))}
              </ul>
              {content.buttons.length < 3 ? (
                <button type="button" onClick={() => setContent({ ...content, buttons: [...content.buttons, { type: "URL", text: "", url: "https://" }] })} className={cn(BTN_SECONDARY, "mt-2 h-9 px-3 text-[13.5px]", PRESSABLE)}>
                  <Plus size={14} strokeWidth={2} aria-hidden="true" />
                  Botão
                </button>
              ) : null}
            </div>
          </fieldset>
        </>
      }
      right={
        <>
          <p className="mb-3 text-[13px] text-[#6b6878]">Prévia para Maria Souza</p>
          {preview?.channel === "WHATSAPP" ? <WhatsappBubble preview={preview} /> : <BlockSkeleton className="h-48" />}
          {problems.length && !locked ? <div className="mt-3"><Blockers items={problems} title="Falta para enviar à análise" /></div> : null}
          <p className="mt-4 text-[13px] leading-relaxed text-[#6b6878]">
            No WhatsApp, mensagem de empresa só sai com um modelo aprovado pela Meta. A situação mostrada aqui é sempre a que a Meta informou.
          </p>
        </>
      }
    />
  );
}
