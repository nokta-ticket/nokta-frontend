"use client";

import { useCallback, useEffect, useState } from "react";
import api, { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/cn";
import { formatBRL, formatDateBR } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable, DataTableBody, DataTableCell, DataTableHead, DataTableHeadCell, DataTableRow, DataTableShell, MobileCard, MobileCardList } from "@/components/ui/data-table";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, FieldGroup } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { RowsSkeleton } from "@/components/ui/skeleton";
import { SelectInput } from "@/components/ui/select-input";
import { StatusBadge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { SwitchRow } from "@/components/ui/switch-row";
import { SectionCard } from "../section-ui";
import type { SectionProps } from "../types";

// ─── Types ────────────────────────────────────────────────────────────────────

type TipoCupom = "PERCENTUAL" | "FIXO";
type AplicacaoCupom = "EVENTO" | "LOTE" | "TIPO_INGRESSO";

interface Cupom {
  id: number;
  eventoId: number;
  codigo: string;
  tipo: TipoCupom;
  desconto: number;
  maxDesconto: number | null;
  valorMinimoCompra: number | null;
  aplicacao: AplicacaoCupom;
  loteNumero: number | null;
  tipoIngressoId: number | null;
  inicio: string | null;
  fim: string | null;
  limiteUso: number | null;
  limitePorUsuario: number | null;
  totalUsado: number;
  ativo: boolean;
  descricao: string | null;
  deletedAt: string | null;
  createdAt: string;
}

interface CupomForm {
  codigo: string;
  tipo: TipoCupom;
  desconto: string;
  maxDesconto: string;
  valorMinimoCompra: string;
  aplicacao: AplicacaoCupom;
  loteNumero: string;
  tipoIngressoId: string;
  inicio: string;
  fim: string;
  limiteUso: string;
  limitePorUsuario: string;
  ativo: boolean;
  descricao: string;
}

const FORM_EMPTY: CupomForm = { codigo: "", tipo: "PERCENTUAL", desconto: "", maxDesconto: "", valorMinimoCompra: "", aplicacao: "EVENTO", loteNumero: "", tipoIngressoId: "", inicio: "", fim: "", limiteUso: "", limitePorUsuario: "", ativo: true, descricao: "" };

const TIPO_OPTIONS = [
  { value: "PERCENTUAL", label: "Percentual (%)" },
  { value: "FIXO", label: "Valor fixo (R$)" },
];
const APLICACAO_OPTIONS = [
  { value: "EVENTO", label: "Evento inteiro" },
  { value: "LOTE", label: "Lote específico" },
  { value: "TIPO_INGRESSO", label: "Tipo de ingresso específico" },
];

function cupomStatus(c: Cupom): { label: string; tone: "success" | "neutral" | "danger" | "warning" } {
  const expired = Boolean(c.fim && new Date(c.fim) < new Date());
  const esgotado = c.limiteUso !== null && c.totalUsado >= c.limiteUso;
  if (!c.ativo) return { label: "Inativo", tone: "neutral" };
  if (esgotado) return { label: "Esgotado", tone: "danger" };
  if (expired) return { label: "Expirado", tone: "warning" };
  return { label: "Ativo", tone: "success" };
}

const discount = (c: Cupom) => (c.tipo === "PERCENTUAL" ? `${Number(c.desconto)}%` : formatBRL(Number(c.desconto)));
const usage = (c: Cupom) => `${c.totalUsado}${c.limiteUso != null ? ` / ${c.limiteUso}` : ""}`;
const validity = (c: Cupom) => (c.inicio || c.fim ? `${c.inicio ? formatDateBR(c.inicio) : "—"} → ${c.fim ? formatDateBR(c.fim) : "sem fim"}` : "Sem validade");

// ─── Cupom Dialog ─────────────────────────────────────────────────────────────

function CupomDialog({ open, onOpenChange, initial, eventoId, onSaved, lotes }: { open: boolean; onOpenChange: (v: boolean) => void; initial?: Cupom; eventoId: number; onSaved: () => void; lotes: { value: string; label: string }[] }) {
  const isEditing = !!initial;
  const [form, setForm] = useState<CupomForm>(FORM_EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setForm({
        codigo: initial.codigo,
        tipo: initial.tipo,
        desconto: String(initial.desconto),
        maxDesconto: initial.maxDesconto != null ? String(initial.maxDesconto) : "",
        valorMinimoCompra: initial.valorMinimoCompra != null ? String(initial.valorMinimoCompra) : "",
        aplicacao: initial.aplicacao,
        loteNumero: initial.loteNumero != null ? String(initial.loteNumero) : "",
        tipoIngressoId: initial.tipoIngressoId != null ? String(initial.tipoIngressoId) : "",
        inicio: initial.inicio ? initial.inicio.split("T")[0] : "",
        fim: initial.fim ? initial.fim.split("T")[0] : "",
        limiteUso: initial.limiteUso != null ? String(initial.limiteUso) : "",
        limitePorUsuario: initial.limitePorUsuario != null ? String(initial.limitePorUsuario) : "",
        ativo: initial.ativo,
        descricao: initial.descricao ?? "",
      });
    } else {
      setForm(FORM_EMPTY);
    }
  }, [open, initial]);

  const f = (k: keyof CupomForm) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSave = async () => {
    if (!form.codigo.trim()) return toast.error("Dê um código pro cupom (ex.: NOKTA10).");
    if (!form.desconto || Number(form.desconto) <= 0) return toast.error("O desconto precisa ser maior que zero.");
    if (form.tipo === "PERCENTUAL" && Number(form.desconto) > 100) return toast.error("Desconto percentual não pode passar de 100%.");

    const payload: Record<string, unknown> = {
      codigo: form.codigo,
      tipo: form.tipo,
      desconto: Number(form.desconto),
      aplicacao: form.aplicacao,
      ativo: form.ativo,
      maxDesconto: form.maxDesconto ? Number(form.maxDesconto) : undefined,
      valorMinimoCompra: form.valorMinimoCompra ? Number(form.valorMinimoCompra) : undefined,
      loteNumero: form.loteNumero ? Number(form.loteNumero) : undefined,
      tipoIngressoId: form.tipoIngressoId ? Number(form.tipoIngressoId) : undefined,
      inicio: form.inicio || undefined,
      fim: form.fim || undefined,
      limiteUso: form.limiteUso ? Number(form.limiteUso) : undefined,
      limitePorUsuario: form.limitePorUsuario ? Number(form.limitePorUsuario) : undefined,
      descricao: form.descricao || undefined,
    };

    setSaving(true);
    try {
      if (isEditing) {
        await api.put(`/produtor/eventos/${eventoId}/cupons/${initial!.id}`, payload);
        toast.success("Cupom atualizado");
      } else {
        await api.post(`/produtor/eventos/${eventoId}/cupons`, payload);
        toast.success("Cupom criado");
      }
      onSaved();
      onOpenChange(false);
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível salvar o cupom."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar cupom" : "Novo cupom"}</DialogTitle>
          <DialogDescription>Desconto percentual ou fixo, com regras de validade e limite de uso.</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <Field label="Código" htmlFor="cp-codigo" required hint="Salvo automaticamente em MAIÚSCULAS.">
            <Input id="cp-codigo" value={form.codigo} onChange={f("codigo")} placeholder="Ex.: NOKTA10, VIPFEST" className="uppercase" autoFocus={!isEditing} />
          </Field>

          <FieldGroup columns={2}>
            <Field label="Tipo de desconto" htmlFor="cp-tipo" required>
              <SelectInput id="cp-tipo" value={form.tipo} onValueChange={(v) => setForm((p) => ({ ...p, tipo: v as TipoCupom }))} options={TIPO_OPTIONS} />
            </Field>
            <Field label="Valor do desconto" htmlFor="cp-desconto" required>
              <Input id="cp-desconto" type="number" min={0} step={0.01} inputMode="decimal" prefix={form.tipo === "PERCENTUAL" ? "%" : "R$"} value={form.desconto} onChange={f("desconto")} placeholder="0" />
            </Field>
            {form.tipo === "PERCENTUAL" ? (
              <Field label="Desconto máximo" htmlFor="cp-max" optional>
                <Input id="cp-max" type="number" min={0} step={0.01} inputMode="decimal" prefix="R$" value={form.maxDesconto} onChange={f("maxDesconto")} placeholder="Sem limite" />
              </Field>
            ) : null}
            <Field label="Compra mínima" htmlFor="cp-min" optional>
              <Input id="cp-min" type="number" min={0} step={0.01} inputMode="decimal" prefix="R$" value={form.valorMinimoCompra} onChange={f("valorMinimoCompra")} placeholder="Sem mínimo" />
            </Field>
          </FieldGroup>

          <Field label="Aplicação" htmlFor="cp-aplicacao">
            <SelectInput id="cp-aplicacao" value={form.aplicacao} onValueChange={(v) => setForm((p) => ({ ...p, aplicacao: v as AplicacaoCupom }))} options={APLICACAO_OPTIONS} />
          </Field>
          {form.aplicacao === "LOTE" ? (
            <Field label="Número do lote" htmlFor="cp-lote" required>
              <Input id="cp-lote" type="number" min={1} inputMode="numeric" value={form.loteNumero} onChange={f("loteNumero")} placeholder="Ex.: 1" />
            </Field>
          ) : null}
          {form.aplicacao === "TIPO_INGRESSO" ? (
            <Field label="Tipo de ingresso" htmlFor="cp-tipo-ingresso" required>
              {lotes.length > 0 ? <SelectInput id="cp-tipo-ingresso" value={form.tipoIngressoId} onValueChange={(v) => setForm((p) => ({ ...p, tipoIngressoId: v }))} options={lotes} placeholder="Escolha o tipo" /> : <Input id="cp-tipo-ingresso" type="number" min={1} inputMode="numeric" value={form.tipoIngressoId} onChange={f("tipoIngressoId")} placeholder="ID do ingresso" />}
            </Field>
          ) : null}

          <FieldGroup columns={2}>
            <Field label="Início da validade" htmlFor="cp-inicio" optional>
              <Input id="cp-inicio" type="date" value={form.inicio} onChange={f("inicio")} />
            </Field>
            <Field label="Fim da validade" htmlFor="cp-fim" optional>
              <Input id="cp-fim" type="date" value={form.fim} onChange={f("fim")} />
            </Field>
            <Field label="Limite total de usos" htmlFor="cp-limite" optional>
              <Input id="cp-limite" type="number" min={1} inputMode="numeric" value={form.limiteUso} onChange={f("limiteUso")} placeholder="Ilimitado" />
            </Field>
            <Field label="Limite por pessoa" htmlFor="cp-limite-user" optional>
              <Input id="cp-limite-user" type="number" min={1} inputMode="numeric" value={form.limitePorUsuario} onChange={f("limitePorUsuario")} placeholder="Ilimitado" />
            </Field>
          </FieldGroup>

          <Field label="Nota interna" htmlFor="cp-descricao" optional>
            <Input id="cp-descricao" value={form.descricao} onChange={f("descricao")} placeholder="Só você vê (ex.: campanha do influencer)" />
          </Field>

          <SwitchRow label="Cupom ativo" description={form.ativo ? "Válido no checkout" : "Desativado — ninguém consegue usar"} checked={form.ativo} onCheckedChange={(v) => setForm((p) => ({ ...p, ativo: v }))} />
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} loading={saving} leftIcon={isEditing ? "save" : "plus"}>
            {isEditing ? "Salvar alterações" : "Criar cupom"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SectionCupons({ event }: SectionProps) {
  const [cupons, setCupons] = useState<Cupom[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCupom, setEditingCupom] = useState<Cupom | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<Cupom | undefined>(undefined);

  const fetchCupons = useCallback(async () => {
    try {
      const res = await api.get<Cupom[]>(`/produtor/eventos/${event.id}/cupons`);
      setCupons(res.data);
    } catch {
      toast.error("Não foi possível carregar os cupons.");
    } finally {
      setLoading(false);
    }
  }, [event.id]);

  useEffect(() => {
    void fetchCupons();
  }, [fetchCupons]);

  const handleToggle = async (cupom: Cupom) => {
    try {
      const updated = await api.patch<Cupom>(`/produtor/eventos/${event.id}/cupons/${cupom.id}/toggle`);
      setCupons((prev) => prev.map((c) => (c.id === cupom.id ? updated.data : c)));
      toast.success(updated.data.ativo ? "Cupom ativado" : "Cupom desativado");
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível alterar o status."));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/produtor/eventos/${event.id}/cupons/${deleteTarget.id}`);
      toast.success(deleteTarget.totalUsado > 0 ? "Cupom arquivado" : "Cupom removido");
      void fetchCupons();
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível remover o cupom."));
      throw err;
    }
  };

  const openEdit = (cupom: Cupom) => {
    setEditingCupom(cupom);
    setDialogOpen(true);
  };
  const openNew = () => {
    setEditingCupom(undefined);
    setDialogOpen(true);
  };

  const visible = cupons.filter((c) => !c.deletedAt);
  const ativos = visible.filter((c) => c.ativo);
  const inativos = visible.filter((c) => !c.ativo);
  const ordered = [...ativos, ...inativos];
  const lotes = (event.ingressos ?? []).filter((t) => t.id && !t.vip).map((t) => ({ value: String(t.id), label: `${t.nome} · ${t.lote}º lote` }));

  const rowActions = (c: Cupom) => (
    <>
      <Button variant="subtle" size="icon-sm" aria-label="Editar cupom" title="Editar" onClick={() => openEdit(c)}>
        <Icon name="edit" size={13} />
      </Button>
      <Button variant="subtle" size="icon-sm" aria-label="Remover cupom" title="Remover" className="hover:bg-danger-bg hover:text-danger" onClick={() => setDeleteTarget(c)}>
        <Icon name="trash" size={13} />
      </Button>
    </>
  );

  return (
    <>
      <SectionCard
        title="Cupons de desconto"
        description={visible.length > 0 ? `${ativos.length} ${ativos.length === 1 ? "ativo" : "ativos"} de ${visible.length}` : "Promoções com regras de validade e limite de uso."}
        action={
          <Button leftIcon="plus" size="sm" onClick={openNew}>
            Novo cupom
          </Button>
        }
        contentClassName="py-4"
      >
        {loading ? (
          <RowsSkeleton rows={4} />
        ) : visible.length === 0 ? (
          <EmptyState icon="tag" title="Nenhum cupom ainda" description="Crie cupons pra impulsionar vendas com promoções e regras personalizadas." action={<Button leftIcon="plus" onClick={openNew}>Criar primeiro cupom</Button>} />
        ) : (
          <DataTableShell
            maxHeight="none"
            table={
              <DataTable>
                <DataTableHead>
                  <tr>
                    <DataTableHeadCell>Código</DataTableHeadCell>
                    <DataTableHeadCell align="right">Desconto</DataTableHeadCell>
                    <DataTableHeadCell align="right">Usos</DataTableHeadCell>
                    <DataTableHeadCell>Validade</DataTableHeadCell>
                    <DataTableHeadCell>Status</DataTableHeadCell>
                    <DataTableHeadCell align="center" width={72}>
                      Ativo
                    </DataTableHeadCell>
                    <DataTableHeadCell align="right" width={96}>
                      <span className="sr-only">Ações</span>
                    </DataTableHeadCell>
                  </tr>
                </DataTableHead>
                <DataTableBody>
                  {ordered.map((c, i) => {
                    const st = cupomStatus(c);
                    return (
                      <DataTableRow key={c.id} index={i} className={cn(!c.ativo && "opacity-70")}>
                        <DataTableCell>
                          <span className="rounded-md bg-brand-soft px-2 py-1 font-mono text-caption font-semibold tracking-wide text-brand">{c.codigo}</span>
                          {c.descricao ? <p className="mt-1 text-caption text-muted-foreground">{c.descricao}</p> : null}
                        </DataTableCell>
                        <DataTableCell num className="font-semibold">
                          {discount(c)}
                          {c.maxDesconto != null ? <span className="block text-caption font-normal text-muted-foreground">máx. {formatBRL(Number(c.maxDesconto))}</span> : null}
                        </DataTableCell>
                        <DataTableCell num>
                          {usage(c)}
                          {c.limitePorUsuario != null ? <span className="block text-caption text-muted-foreground">{c.limitePorUsuario}× por pessoa</span> : null}
                        </DataTableCell>
                        <DataTableCell className={cn(!c.inicio && !c.fim && "text-subtle-foreground")}>
                          {validity(c)}
                          {c.valorMinimoCompra != null ? <span className="block text-caption text-muted-foreground">mín. {formatBRL(Number(c.valorMinimoCompra))}</span> : null}
                        </DataTableCell>
                        <DataTableCell>
                          <StatusBadge tone={st.tone}>{st.label}</StatusBadge>
                        </DataTableCell>
                        <DataTableCell align="center" stopPropagation>
                          <Switch checked={c.ativo} onCheckedChange={() => handleToggle(c)} aria-label={c.ativo ? "Desativar cupom" : "Ativar cupom"} />
                        </DataTableCell>
                        <DataTableCell align="right">
                          <div className="flex justify-end gap-0.5">{rowActions(c)}</div>
                        </DataTableCell>
                      </DataTableRow>
                    );
                  })}
                </DataTableBody>
              </DataTable>
            }
            mobile={
              <MobileCardList>
                {ordered.map((c, i) => {
                  const st = cupomStatus(c);
                  return (
                    <MobileCard
                      key={c.id}
                      index={i}
                      title={<span className="font-mono tracking-wide">{c.codigo}</span>}
                      subtitle={c.descricao ?? validity(c)}
                      badge={<StatusBadge tone={st.tone}>{st.label}</StatusBadge>}
                      meta={[
                        { label: "Desconto", value: discount(c), num: true },
                        { label: "Usos", value: usage(c), num: true },
                        { label: "Validade", value: validity(c) },
                        { label: "Compra mínima", value: c.valorMinimoCompra != null ? formatBRL(Number(c.valorMinimoCompra)) : "Sem mínimo", num: true },
                      ]}
                      actions={
                        <>
                          <label className="mr-auto flex items-center gap-2 text-caption text-muted-foreground">
                            <Switch checked={c.ativo} onCheckedChange={() => handleToggle(c)} aria-label={c.ativo ? "Desativar cupom" : "Ativar cupom"} />
                            {c.ativo ? "Ativo" : "Inativo"}
                          </label>
                          {rowActions(c)}
                        </>
                      }
                    />
                  );
                })}
              </MobileCardList>
            }
          />
        )}
      </SectionCard>

      <CupomDialog open={dialogOpen} onOpenChange={setDialogOpen} initial={editingCupom} eventoId={event.id} onSaved={fetchCupons} lotes={lotes} />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(v) => (!v ? setDeleteTarget(undefined) : null)}
        danger
        icon="tag"
        title={`Remover o cupom ${deleteTarget?.codigo}?`}
        description={deleteTarget && deleteTarget.totalUsado > 0 ? undefined : "O cupom é excluído de vez. Essa ação não pode ser desfeita."}
        confirmLabel={deleteTarget && deleteTarget.totalUsado > 0 ? "Arquivar" : "Excluir"}
        onConfirm={handleDelete}
      >
        {deleteTarget && deleteTarget.totalUsado > 0 ? (
          <Callout tone="warning">
            Este cupom já foi usado {deleteTarget.totalUsado} {deleteTarget.totalUsado === 1 ? "vez" : "vezes"}. Ele será <strong className="text-foreground">arquivado</strong> pra preservar o histórico dos pedidos.
          </Callout>
        ) : null}
      </ConfirmDialog>
    </>
  );
}
