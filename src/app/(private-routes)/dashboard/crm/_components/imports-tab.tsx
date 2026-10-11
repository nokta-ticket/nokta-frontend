"use client";

import { useRef, useState, type DragEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, FileSpreadsheet, Loader2, Upload } from "lucide-react";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { crmApi, crmKeys, type CrmImportLegalBasis, type CrmImportPreview, type CrmImportProblem } from "@/services/crm";
import { BlockSkeleton } from "../../_components/states/loading-state";
import { Pill, PRESSABLE, SURFACE, fmtDate } from "../../financeiro/_components/finance-ui";
import { BTN_PRIMARY, BTN_SECONDARY, FIELD, LINK, formatPhone, num } from "./crm-ui";

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
    <div className="grid items-start gap-4 2xl:grid-cols-[minmax(0,5fr)_minmax(0,9fr)]">
      <section className={cn(SURFACE, "p-5 sm:p-6")}>
        <h2 className="text-[16px] font-semibold text-[#1c1a24]">Trazer uma lista sua</h2>

        {result ? (
          <div className="mt-4">
            <p className="flex items-center gap-2 text-[15px] font-semibold text-emerald-800">
              <Check size={18} strokeWidth={2.2} aria-hidden="true" />
              Lista importada
            </p>
            <p className="mt-2 text-[14px] leading-relaxed text-[#3a3746]">
              {num(result.willCreate)} {result.willCreate === 1 ? "contato novo" : "contatos novos"}
              {result.willMerge ? ` e ${num(result.willMerge)} que já estavam na sua lista` : ""}.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <button type="button" onClick={onDone} className={cn(BTN_PRIMARY, PRESSABLE)}>
                Ver contatos importados
              </button>
              <button type="button" onClick={reset} className={cn(BTN_SECONDARY, PRESSABLE)}>
                Importar outra
              </button>
            </div>
          </div>
        ) : !file ? (
          <>
            <p className="mt-1.5 text-[14px] leading-relaxed text-[#5f5c6b]">Arquivo CSV com as colunas nome, email e telefone. Cada linha precisa de pelo menos um e-mail ou um telefone.</p>
            <input ref={inputRef} type="file" accept=".csv,text/csv" className="sr-only" id="crm-import-file" onChange={(e) => pick(e.target.files?.[0])} />
            <label
              htmlFor="crm-import-file"
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              className={cn(
                "mt-4 flex cursor-pointer flex-col items-center gap-2 rounded-[16px] border border-dashed px-6 py-10 text-center transition-colors focus-within:border-[#7c3aed]",
                dragging ? "border-[#7c3aed] bg-[#f7f3ff]" : "border-[#cfc8e2] bg-[#fbfaff] hover:border-[#7c3aed] hover:bg-[#f7f3ff]",
              )}
            >
              <Upload size={22} strokeWidth={1.8} className="text-[#7c3aed]" aria-hidden="true" />
              <span className="text-[15px] font-semibold text-[#1c1a24]">Escolher arquivo</span>
              <span className="text-[13px] text-[#6b6878]">ou arraste a planilha para cá · até 10 mil linhas</span>
            </label>
            <button type="button" onClick={downloadTemplate} className={cn(LINK, "mt-3", PRESSABLE)}>
              Baixar planilha modelo
            </button>
          </>
        ) : (
          <div className="mt-4 space-y-5">
            <div className="flex items-center justify-between gap-3 rounded-[12px] bg-[#fbfaff] px-4 py-3">
              <span className="flex min-w-0 items-center gap-2.5">
                <FileSpreadsheet size={18} strokeWidth={1.8} className="shrink-0 text-[#7c3aed]" aria-hidden="true" />
                <span className="truncate font-medium">{file.name}</span>
              </span>
              <button type="button" onClick={reset} className={cn(LINK, "shrink-0", PRESSABLE)}>
                Trocar
              </button>
            </div>

            {!preview ? (
              <p className="flex items-center gap-2 text-[14px] text-[#5f5c6b]">
                <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                Lendo a planilha
              </p>
            ) : (
              <>
                <dl className="divide-y divide-[#f2f0f7] text-[14px]">
                  <Line label="Contatos novos" value={preview.willCreate} strong />
                  <Line label="Já estão na sua lista" hint="Não duplicam: só ganham esta origem" value={preview.willMerge} />
                  {preview.suppressed ? <Line label="Pediram para sair ou estão bloqueados" hint="Entram, mas continuam sem receber" value={preview.suppressed} /> : null}
                  {problemTotal ? (
                    <Line
                      label="Linhas ignoradas"
                      hint={(Object.entries(preview.problems) as [CrmImportProblem, number][]).map(([k, n]) => `${n} ${PROBLEM_LABEL[k]}`).join(" · ")}
                      value={problemTotal}
                    />
                  ) : null}
                </dl>

                {preview.rows.length > 0 ? (
                  <div>
                    <button type="button" onClick={() => setShowRows(!showRows)} aria-expanded={showRows} className={cn(LINK, PRESSABLE)}>
                      {showRows ? "Esconder as linhas" : `Conferir as linhas (${num(Math.min(preview.rows.length, importable))}${importable > preview.rows.length ? ` de ${num(importable)}` : ""})`}
                    </button>
                    {showRows ? (
                      <div className="mt-2 max-h-[280px] overflow-auto rounded-[12px] border border-[#ebe8f2]">
                        <table className="w-full text-left text-[13px]">
                          <thead className="sticky top-0 bg-[#fbfaff] text-[12.5px] text-[#5f5c6b]">
                            <tr>
                              <th scope="col" className="px-3 py-2 font-semibold">Linha</th>
                              <th scope="col" className="px-3 py-2 font-semibold">Nome</th>
                              <th scope="col" className="px-3 py-2 font-semibold">E-mail</th>
                              <th scope="col" className="px-3 py-2 font-semibold">Telefone</th>
                              <th scope="col" className="px-3 py-2 font-semibold">Situação</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#f2f0f7]">
                            {preview.rows.map((r) => (
                              <tr key={r.line}>
                                <td className="px-3 py-2 font-poppins tabular-nums text-[#6b6878]">{r.line}</td>
                                <td className="max-w-[160px] truncate px-3 py-2">{r.name}</td>
                                <td className="max-w-[200px] truncate px-3 py-2 text-[#3a3746]">{r.email ?? "—"}</td>
                                <td className="whitespace-nowrap px-3 py-2 font-poppins tabular-nums text-[#3a3746]">{formatPhone(r.phone) || "—"}</td>
                                <td className="whitespace-nowrap px-3 py-2 text-[#5f5c6b]">{r.status === "NEW" ? "Novo" : "Já na lista"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {importable === 0 ? (
                  <p className="rounded-[12px] bg-[#fcf5f6] px-4 py-3 text-[13.5px] text-[#9b1c35]">Nenhuma linha desta planilha pode ser importada. Confira as colunas e tente outro arquivo.</p>
                ) : (
                  <form
                    className="space-y-4"
                    onSubmit={(e) => {
                      e.preventDefault();
                      commit.mutate();
                    }}
                  >
                    <label className="block">
                      <span className="block text-[14px] font-semibold">De onde veio esta lista?</span>
                      <span className="mb-1.5 block text-[13px] text-[#6b6878]">Fica registrado junto com a importação.</span>
                      <textarea
                        value={origin}
                        onChange={(e) => setOrigin(e.target.value)}
                        maxLength={500}
                        rows={2}
                        placeholder="Ex.: inscritos na lista VIP do meu site em 2026"
                        className={cn(FIELD, "h-auto w-full resize-none px-3.5 py-2.5 leading-relaxed")}
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-[14px] font-semibold">Para que você vai usar estes contatos?</span>
                      <input value={purpose} onChange={(e) => setPurpose(e.target.value)} maxLength={300} placeholder="Ex.: avisar dos próximos eventos" className={cn(FIELD, "w-full px-3.5")} />
                    </label>
                    <fieldset>
                      <legend className="text-[14px] font-semibold">O que te permite falar com essas pessoas?</legend>
                      <p className="mb-2 text-[13px] leading-relaxed text-[#6b6878]">Importar a planilha não autoriza nenhum envio por si só. Escolha a opção que é verdade para esta lista.</p>
                      <Radio checked={basis === "CONSENT"} onChange={() => setBasis("CONSENT")} title="Elas autorizaram receber mensagens minhas">
                        {basis === "CONSENT" ? (
                          <span className="mt-1 block">
                            <Check2 checked={consentEmail} onChange={setConsentEmail}>
                              Por e-mail
                            </Check2>
                            <Check2 checked={consentWhatsapp} onChange={setConsentWhatsapp}>
                              Por WhatsApp
                            </Check2>
                          </span>
                        ) : null}
                      </Radio>
                      <Radio checked={basis === "LEGITIMATE_INTEREST"} onChange={() => setBasis("LEGITIMATE_INTEREST")} title="Já são meus clientes" hint="Libera só e-mail, sempre com a opção de sair. WhatsApp exige autorização." />
                      <Radio checked={basis === "NONE"} onChange={() => setBasis("NONE")} title="Nenhuma das duas" hint="Os contatos entram na lista e não recebem nada até autorizarem." />
                    </fieldset>
                    <label className="flex cursor-pointer items-start gap-3 rounded-[12px] bg-[#fbfaff] px-4 py-3 text-[13.5px] leading-relaxed text-[#3a3746]">
                      <input type="checkbox" checked={legitimacy} onChange={(e) => setLegitimacy(e.target.checked)} className="mt-0.5 h-[18px] w-[18px] shrink-0 cursor-pointer rounded accent-[#7c3aed]" />
                      <span>Confirmo que tenho o direito de usar estes contatos para essa finalidade e que as informações acima são verdadeiras. A confirmação fica registrada com o meu usuário e a data.</span>
                    </label>
                    <button type="submit" disabled={!ready || commit.isPending} className={cn(BTN_PRIMARY, "w-full sm:w-auto", PRESSABLE)}>
                      {commit.isPending ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : null}
                      Importar {num(importable)} {importable === 1 ? "contato" : "contatos"}
                    </button>
                  </form>
                )}
              </>
            )}
          </div>
        )}
      </section>

      <section className={cn(SURFACE, "overflow-hidden")} aria-label="Importações anteriores">
        <h2 className="border-b border-[#ebe8f2] px-5 py-4 text-[16px] font-semibold text-[#1c1a24]">Importações anteriores</h2>
        {history.isLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <BlockSkeleton key={i} className="h-12" />
            ))}
          </div>
        ) : !history.data?.length ? (
          <p className="px-6 py-12 text-center text-[14px] text-[#5f5c6b]">Nenhuma lista importada ainda.</p>
        ) : (
          <ul className="divide-y divide-[#f2f0f7]">
            {history.data.map((i) => (
              <li key={i.id} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                <div className="min-w-0">
                  <p className="truncate font-medium text-[#1c1a24]">{i.fileName}</p>
                  <p className="mt-0.5 text-[13.5px] leading-relaxed text-[#5f5c6b]">
                    {i.originDescription}
                    {i.purpose ? ` · Uso: ${i.purpose}` : ""}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {i.consentEmail ? <Pill tone="success">Autorizaram e-mail</Pill> : null}
                    {i.consentWhatsapp ? <Pill tone="success">Autorizaram WhatsApp</Pill> : null}
                    {i.legalBasis === "LEGITIMATE_INTEREST" ? <Pill tone="violet">Já eram clientes</Pill> : null}
                    {!i.consentEmail && !i.consentWhatsapp && i.legalBasis !== "LEGITIMATE_INTEREST" ? <Pill tone="neutral">Sem autorização declarada</Pill> : null}
                  </div>
                </div>
                <div className="shrink-0 sm:text-right">
                  <p className="font-poppins text-[15px] font-semibold tabular-nums">
                    {num(i.createdCount)} <span className="font-sans text-[13px] font-normal text-[#6b6878]">novos</span>
                    {i.mergedCount ? (
                      <>
                        {" · "}
                        {num(i.mergedCount)} <span className="font-sans text-[13px] font-normal text-[#6b6878]">já na lista</span>
                      </>
                    ) : null}
                  </p>
                  <p className="mt-0.5 font-poppins text-[13px] tabular-nums text-[#6b6878]">{fmtDate(i.createdAt)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Line({ label, hint, value, strong = false }: { label: string; hint?: string; value: number; strong?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <dt>
        <span className={cn("block", strong && "font-semibold")}>{label}</span>
        {hint ? <span className="block text-[13px] text-[#6b6878]">{hint}</span> : null}
      </dt>
      <dd className={cn("shrink-0 font-poppins tabular-nums", strong ? "text-[18px] font-bold" : "font-semibold")}>{num(value)}</dd>
    </div>
  );
}

function Radio({ checked, onChange, title, hint, children }: { checked: boolean; onChange: () => void; title: string; hint?: string; children?: React.ReactNode }) {
  return (
    <div className="py-1.5">
      <label className="flex cursor-pointer items-start gap-3 text-[14px]">
        <input type="radio" name="crm-import-basis" checked={checked} onChange={onChange} className="mt-0.5 h-[18px] w-[18px] shrink-0 cursor-pointer accent-[#7c3aed]" />
        <span>
          <span className="block">{title}</span>
          {hint ? <span className="block text-[13px] leading-relaxed text-[#6b6878]">{hint}</span> : null}
        </span>
      </label>
      {children ? <div className="pl-[30px]">{children}</div> : null}
    </div>
  );
}

function Check2({ checked, onChange, children }: { checked: boolean; onChange: (value: boolean) => void; children: React.ReactNode }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 py-1.5 text-[14px]">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-[18px] w-[18px] shrink-0 cursor-pointer rounded accent-[#7c3aed]" />
      {children}
    </label>
  );
}
