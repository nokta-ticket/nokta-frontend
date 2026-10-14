"use client";

import { useRef, useState, type DragEvent, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/cn";
import { crmApi, crmKeys, type CrmImportLegalBasis, type CrmImportPreview, type CrmImportProblem } from "@/services/crm";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ChoiceCard } from "@/components/ui/choice-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { RowsSkeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { fmtDate } from "../../financeiro/_components/finance-ui";
import { Note, formatPhone, num } from "./crm-ui";

const PROBLEM_LABEL: Record<CrmImportProblem, string> = {
  SEM_CONTATO: "sem e-mail nem telefone",
  EMAIL_INVALIDO: "com e-mail inválido",
  TELEFONE_INVALIDO: "com telefone inválido",
  DUPLICADO_NO_ARQUIVO: "repetidas no próprio arquivo",
};

const TEMPLATE = "nome;email;telefone\nMaria Souza;maria@exemplo.com;(11) 99999-8888\n";

function downloadTemplate() {
  const url = URL.createObjectURL(new Blob(["﻿" + TEMPLATE], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "modelo-contatos.csv";
  a.click();
  URL.revokeObjectURL(url);
}

/** Importação de planilha: mostra o que vai acontecer antes de gravar e registra de onde a lista veio. */
export function ImportsTab({ orgId, onDone }: { orgId: number; onDone: () => void }) {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<CrmImportPreview | null>(null);
  const [origin, setOrigin] = useState("");
  const [purpose, setPurpose] = useState("");
  const [basis, setBasis] = useState<CrmImportLegalBasis | "">("");
  const [consentEmail, setConsentEmail] = useState(false);
  const [consentWhatsapp, setConsentWhatsapp] = useState(false);
  const [legitimacy, setLegitimacy] = useState(false);
  const [showRows, setShowRows] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [result, setResult] = useState<CrmImportPreview | null>(null);

  const history = useQuery({ queryKey: crmKeys.imports(orgId), queryFn: () => crmApi.listImports(orgId) });

  const analyze = useMutation({
    mutationFn: (f: File) => crmApi.previewImport(orgId, f),
    onSuccess: (data) => setPreview(data),
    onError: (error) => {
      setFile(null);
      toast.error(getErrorMessage(error, "Não foi possível ler o arquivo."));
    },
  });
  const commit = useMutation({
    mutationFn: () =>
      crmApi.commitImport(orgId, file as File, {
        originDescription: origin.trim(),
        purpose: purpose.trim(),
        legalBasis: basis as CrmImportLegalBasis,
        consentEmail: basis === "CONSENT" && consentEmail,
        consentWhatsapp: basis === "CONSENT" && consentWhatsapp,
        legitimacyConfirmed: legitimacy,
      }),
    onSuccess: (data) => {
      setResult(data);
      void queryClient.invalidateQueries({ queryKey: crmKeys.all(orgId) });
    },
    onError: (error) => toast.error(getErrorMessage(error, "Não foi possível importar.")),
  });

  function pick(f: File | undefined) {
    if (!f) return;
    reset();
    setFile(f);
    analyze.mutate(f);
  }
  function reset() {
    setFile(null);
    setPreview(null);
    setResult(null);
    setOrigin("");
    setPurpose("");
    setBasis("");
    setConsentEmail(false);
    setConsentWhatsapp(false);
    setLegitimacy(false);
    setShowRows(false);
    if (inputRef.current) inputRef.current.value = "";
  }
  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    pick(e.dataTransfer.files?.[0]);
  }

  const importable = preview ? preview.willCreate + preview.willMerge : 0;
  const problemTotal = preview ? Object.values(preview.problems).reduce((s, n) => s + (n ?? 0), 0) : 0;
  const ready = origin.trim().length >= 10 && purpose.trim().length >= 5 && basis !== "" && legitimacy && (basis !== "CONSENT" || consentEmail || consentWhatsapp);

  return (
    <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <Card className="fade-up">
        <CardHeader>
          <div>
            <CardTitle>Trazer uma lista sua</CardTitle>
            {!file && !result ? <CardDescription>Arquivo CSV com as colunas nome, email e telefone. Cada linha precisa de pelo menos um e-mail ou um telefone.</CardDescription> : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {result ? (
            <>
              <Callout tone="success" title="Lista importada">
                {num(result.willCreate)} {result.willCreate === 1 ? "contato novo" : "contatos novos"}
                {result.willMerge ? ` e ${num(result.willMerge)} que já estavam na sua lista` : ""}.
              </Callout>
              <div className="flex flex-wrap gap-2">
                <Button rightIcon="arrow-right" onClick={onDone}>
                  Ver contatos importados
                </Button>
                <Button variant="outline" onClick={reset}>
                  Importar outra
                </Button>
              </div>
            </>
          ) : !file ? (
            <>
              <input ref={inputRef} type="file" accept=".csv,text/csv" className="sr-only" id="crm-import-file" onChange={(e) => pick(e.target.files?.[0])} />
              <label
                htmlFor="crm-import-file"
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                className={cn("flex cursor-pointer flex-col items-center gap-2 rounded-card border-2 border-dashed px-6 py-10 text-center transition-colors focus-within:border-brand", dragging ? "border-brand bg-brand-soft/40" : "border-border-strong bg-surface-2/40 hover:border-brand hover:bg-brand-soft/30")}
              >
                <span className="flex size-12 items-center justify-center rounded-full bg-surface text-brand shadow-card">
                  <Icon name="upload" size={18} />
                </span>
                <span className="text-sm font-semibold text-foreground">Escolher arquivo</span>
                <span className="text-caption text-muted-foreground">ou arraste a planilha pra cá · até 10 mil linhas</span>
              </label>
              <Button variant="link" size="sm" leftIcon="download" onClick={downloadTemplate}>
                Baixar planilha modelo
              </Button>
            </>
          ) : (
            <>
              <div className="surface-inset flex items-center justify-between gap-3 rounded-xl px-4 py-3">
                <span className="flex min-w-0 items-center gap-2.5">
                  <Icon name="file-lines" size={15} className="shrink-0 text-brand" />
                  <span className="truncate text-sm font-medium text-foreground">{file.name}</span>
                </span>
                <Button variant="link" size="sm" onClick={reset}>
                  Trocar
                </Button>
              </div>

              {!preview ? (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Icon name="loader" size={14} className="animate-spin" />
                  Lendo a planilha
                </p>
              ) : (
                <>
                  <dl className="divide-y divide-border text-sm">
                    <Line label="Contatos novos" value={preview.willCreate} strong />
                    <Line label="Já estão na sua lista" hint="Não duplicam: só ganham esta origem" value={preview.willMerge} />
                    {preview.suppressed ? <Line label="Pediram pra sair ou estão bloqueados" hint="Entram, mas continuam sem receber" value={preview.suppressed} /> : null}
                    {problemTotal ? <Line label="Linhas ignoradas" hint={(Object.entries(preview.problems) as [CrmImportProblem, number][]).map(([k, n]) => `${n} ${PROBLEM_LABEL[k]}`).join(" · ")} value={problemTotal} /> : null}
                  </dl>

                  {preview.rows.length > 0 ? (
                    <div>
                      <Button variant="link" size="sm" onClick={() => setShowRows(!showRows)} aria-expanded={showRows}>
                        {showRows ? "Esconder as linhas" : `Conferir as linhas (${num(Math.min(preview.rows.length, importable))}${importable > preview.rows.length ? ` de ${num(importable)}` : ""})`}
                      </Button>
                      {showRows ? (
                        <div className="mt-2 max-h-[280px] overflow-auto rounded-xl border border-border">
                          <table className="w-full text-left text-caption">
                            <thead className="sticky top-0 bg-surface-2 text-micro uppercase tracking-wider text-subtle-foreground">
                              <tr>
                                <th scope="col" className="px-3 py-2 font-semibold">Linha</th>
                                <th scope="col" className="px-3 py-2 font-semibold">Nome</th>
                                <th scope="col" className="px-3 py-2 font-semibold">E-mail</th>
                                <th scope="col" className="px-3 py-2 font-semibold">Telefone</th>
                                <th scope="col" className="px-3 py-2 font-semibold">Situação</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                              {preview.rows.map((r) => (
                                <tr key={r.line}>
                                  <td className="px-3 py-2 text-muted-foreground tnum">{r.line}</td>
                                  <td className="max-w-[160px] truncate px-3 py-2 text-foreground">{r.name}</td>
                                  <td className="max-w-[200px] truncate px-3 py-2 text-muted-foreground">{r.email ?? "—"}</td>
                                  <td className="whitespace-nowrap px-3 py-2 text-muted-foreground tnum">{formatPhone(r.phone) || "—"}</td>
                                  <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">{r.status === "NEW" ? "Novo" : "Já na lista"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  {importable === 0 ? (
                    <Callout tone="danger">Nenhuma linha desta planilha pode ser importada. Confira as colunas e tente outro arquivo.</Callout>
                  ) : (
                    <form
                      className="space-y-4"
                      onSubmit={(e) => {
                        e.preventDefault();
                        commit.mutate();
                      }}
                    >
                      <Field label="De onde veio esta lista?" htmlFor="imp-origem" hint="Fica registrado junto com a importação.">
                        <Textarea id="imp-origem" value={origin} onChange={(e) => setOrigin(e.target.value)} maxLength={500} rows={2} placeholder="Ex.: inscritos na lista VIP do meu site em 2026" className="min-h-0" />
                      </Field>
                      <Field label="Pra que você vai usar estes contatos?" htmlFor="imp-uso">
                        <Input id="imp-uso" value={purpose} onChange={(e) => setPurpose(e.target.value)} maxLength={300} placeholder="Ex.: avisar dos próximos eventos" />
                      </Field>
                      <fieldset className="space-y-2">
                        <legend className="text-sm font-medium text-foreground">O que te permite falar com essas pessoas?</legend>
                        <Note>Importar a planilha não autoriza nenhum envio por si só. Escolha a opção que é verdade pra esta lista.</Note>
                        <div role="radiogroup" className="space-y-2 pt-1">
                          <ChoiceCard selected={basis === "CONSENT"} onSelect={() => setBasis("CONSENT")} title="Elas autorizaram receber mensagens minhas">
                            {basis === "CONSENT" ? (
                              <span className="mt-2 flex flex-wrap gap-4" onClick={(e) => e.stopPropagation()}>
                                <Check2 checked={consentEmail} onChange={setConsentEmail}>
                                  Por e-mail
                                </Check2>
                                <Check2 checked={consentWhatsapp} onChange={setConsentWhatsapp}>
                                  Por WhatsApp
                                </Check2>
                              </span>
                            ) : null}
                          </ChoiceCard>
                          <ChoiceCard selected={basis === "LEGITIMATE_INTEREST"} onSelect={() => setBasis("LEGITIMATE_INTEREST")} title="Já são meus clientes" description="Libera só e-mail, sempre com a opção de sair. WhatsApp exige autorização." />
                          <ChoiceCard selected={basis === "NONE"} onSelect={() => setBasis("NONE")} title="Nenhuma das duas" description="Os contatos entram na lista e não recebem nada até autorizarem." />
                        </div>
                      </fieldset>
                      <label className={cn("flex cursor-pointer items-start gap-3 rounded-xl border p-4 text-caption leading-relaxed transition-colors", legitimacy ? "border-brand-ring bg-brand-soft/60 text-foreground" : "surface-inset text-muted-foreground")}>
                        <Checkbox checked={legitimacy} onCheckedChange={(v) => setLegitimacy(Boolean(v))} className="mt-0.5 shrink-0" />
                        <span>Confirmo que tenho o direito de usar estes contatos pra essa finalidade e que as informações acima são verdadeiras. A confirmação fica registrada com o meu usuário e a data.</span>
                      </label>
                      <Button type="submit" leftIcon="upload" disabled={!ready} loading={commit.isPending} className="w-full sm:w-auto">
                        Importar {num(importable)} {importable === 1 ? "contato" : "contatos"}
                      </Button>
                    </form>
                  )}
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card className="fade-up" style={{ ["--i" as string]: 1 } as never} aria-label="Importações anteriores">
        <CardHeader>
          <CardTitle>Importações anteriores</CardTitle>
        </CardHeader>
        <CardContent className="pt-3">
          {history.isLoading ? (
            <RowsSkeleton rows={3} />
          ) : !history.data?.length ? (
            <EmptyState compact icon="upload" title="Nenhuma lista importada ainda" className="border-0" />
          ) : (
            <ul className="divide-y divide-border">
              {history.data.map((i) => (
                <li key={i.id} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{i.fileName}</p>
                    <p className="mt-0.5 text-caption leading-relaxed text-muted-foreground">
                      {i.originDescription}
                      {i.purpose ? ` · Uso: ${i.purpose}` : ""}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {i.consentEmail ? <StatusBadge tone="success">Autorizaram e-mail</StatusBadge> : null}
                      {i.consentWhatsapp ? <StatusBadge tone="success">Autorizaram WhatsApp</StatusBadge> : null}
                      {i.legalBasis === "LEGITIMATE_INTEREST" ? <StatusBadge tone="brand">Já eram clientes</StatusBadge> : null}
                      {!i.consentEmail && !i.consentWhatsapp && i.legalBasis !== "LEGITIMATE_INTEREST" ? <StatusBadge tone="neutral">Sem autorização declarada</StatusBadge> : null}
                    </div>
                  </div>
                  <div className="shrink-0 sm:text-right">
                    <p className="text-sm font-semibold text-foreground tnum">
                      {num(i.createdCount)} <span className="text-caption font-normal text-muted-foreground">novos</span>
                      {i.mergedCount ? (
                        <>
                          {" · "}
                          {num(i.mergedCount)} <span className="text-caption font-normal text-muted-foreground">já na lista</span>
                        </>
                      ) : null}
                    </p>
                    <p className="mt-0.5 text-caption text-muted-foreground tnum">{fmtDate(i.createdAt)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Line({ label, hint, value, strong = false }: { label: string; hint?: string; value: number; strong?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <dt>
        <span className={cn("block text-foreground", strong && "font-semibold")}>{label}</span>
        {hint ? <span className="block text-caption text-muted-foreground">{hint}</span> : null}
      </dt>
      <dd className={cn("shrink-0 text-foreground tnum", strong ? "text-lg font-semibold" : "font-semibold")}>{num(value)}</dd>
    </div>
  );
}

function Check2({ checked, onChange, children }: { checked: boolean; onChange: (value: boolean) => void; children: ReactNode }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
      <Checkbox checked={checked} onCheckedChange={(v) => onChange(Boolean(v))} />
      {children}
    </label>
  );
}
