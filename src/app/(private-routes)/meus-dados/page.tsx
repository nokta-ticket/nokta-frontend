"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Check, CheckCircle2, Loader2, Lock, Pencil } from "lucide-react";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import api from "@/lib/axios";

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserMe {
  id: string;
  nome: string;
  sobrenome: string;
  email: string;
  cpf?: string | null;
  dataNascimento?: string | null;
  telefone?: string | null;
  genero?: number | null;
  ehEstudante?: boolean;
  faculdade?: string | null;
  endereco?: {
    cep?: string | null;
    logradouro?: string | null;
    numero?: string | null;
    bairro?: string | null;
    cidade?: string | null;
    uf?: string | null;
    complemento?: string | null;
  } | null;
}

function maskCep(value: string): string {
  const c = value.replace(/\D/g, "").slice(0, 8);
  return c.length > 5 ? `${c.slice(0, 5)}-${c.slice(5)}` : c;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCPF(cpf: string): string {
  const d = cpf.replace(/\D/g, "").padStart(11, "0");
  return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

function maskCPF(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

function maskPhone(value: string): string {
  const d = value.replace(/\D/g, "");
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7, 11)}`;
}

function formatBirthday(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("pt-BR");
  } catch {
    return iso;
  }
}

const GENERO_LABELS: Record<number, string> = { 0: "Masculino", 1: "Feminino", 2: "Prefiro não informar" };

function validateCPF(raw: string): boolean {
  const d = raw.replace(/\D/g, "");
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const calc = (n: number) => {
    let s = 0;
    for (let i = 0; i < n - 1; i++) s += parseInt(d[i]) * (n - i);
    const r = (s * 10) % 11;
    return r === 10 || r === 11 ? 0 : r;
  };
  return calc(10) === parseInt(d[9]) && calc(11) === parseInt(d[10]);
}

function validateEmail(e: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

function validateBirthdate(date: string): string {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "Data inválida";
  const ageMs = Date.now() - d.getTime();
  const age = ageMs / (365.25 * 24 * 3600 * 1000);
  if (age < 0) return "Data no futuro";
  if (age < 14) return "Você deve ter pelo menos 14 anos";
  if (age > 120) return "Data inválida";
  return "";
}

function validatePhone(raw: string): boolean {
  const d = raw.replace(/\D/g, "");
  return d.length >= 10 && d.length <= 11;
}

function InlineError({ msg }: { msg: string }) {
  if (!msg) return null;
  return (
    <p className="flex items-center gap-1 text-xs text-red-500 mt-1">
      <AlertCircle size={12} /> {msg}
    </p>
  );
}

function InlineOk({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <p className="flex items-center gap-1 text-xs text-green-600 mt-1">
      <CheckCircle2 size={12} /> Válido
    </p>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({
  title,
  children,
  onEdit,
  onSave,
  saving,
  saved,
  editing,
  editLabel = "Editar",
}: {
  title: string;
  children: React.ReactNode;
  onEdit?: () => void;
  onSave?: () => void;
  saving?: boolean;
  saved?: boolean;
  editing?: boolean;
  editLabel?: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">{title}</h2>
        {onEdit && !editing && (
          <button
            type="button"
            onClick={onEdit}
            className="flex items-center gap-1.5 text-sm font-medium text-violet-600 hover:text-violet-700"
          >
            <Pencil size={14} /> {editLabel}
          </button>
        )}
        {editing && onSave && (
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-60 transition-colors"
          >
            {saving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : saved ? (
              <Check size={14} />
            ) : null}
            {saving ? "Salvando…" : saved ? "Salvo!" : "Salvar"}
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

// ─── Read-only field ──────────────────────────────────────────────────────────

function ReadField({ label, value, icon }: { label: string; value?: string | null; icon?: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="flex items-center gap-1.5 text-xs font-medium text-gray-400 uppercase tracking-wide">
        {icon} {label}
      </p>
      <p className="text-sm font-medium text-gray-700">{value || <span className="text-gray-300 italic">Não informado</span>}</p>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function MeusDadosPage() {
  const [user, setUser] = useState<UserMe | null>(null);
  const [loading, setLoading] = useState(true);

  // Identification
  const [editIdent, setEditIdent] = useState(false);
  const [savingIdent, setSavingIdent] = useState(false);
  const [savedIdent, setSavedIdent] = useState(false);
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [nomeTouched, setNomeTouched] = useState(false);

  // Documents (CPF / birthday — editable only if empty)
  const [editDocs, setEditDocs] = useState(false);
  const [savingDocs, setSavingDocs] = useState(false);
  const [savedDocs, setSavedDocs] = useState(false);
  const [cpfInput, setCpfInput] = useState("");
  const [cpfTouched, setCpfTouched] = useState(false);
  const [dataNascimento, setDataNascimento] = useState("");
  const [dataTouched, setDataTouched] = useState(false);

  // Contact
  const [editContact, setEditContact] = useState(false);
  const [savingContact, setSavingContact] = useState(false);
  const [savedContact, setSavedContact] = useState(false);
  const [telefone, setTelefone] = useState("");
  const [telefoneTouched, setTelefoneTouched] = useState(false);

  // Address
  const [editEndereco, setEditEndereco] = useState(false);
  const [savingEndereco, setSavingEndereco] = useState(false);
  const [savedEndereco, setSavedEndereco] = useState(false);
  const [endCep, setEndCep] = useState("");
  const [endLogradouro, setEndLogradouro] = useState("");
  const [endNumero, setEndNumero] = useState("");
  const [endBairro, setEndBairro] = useState("");
  const [endCidade, setEndCidade] = useState("");
  const [endUf, setEndUf] = useState("");
  const [endComplemento, setEndComplemento] = useState("");

  // Preferences
  const [editPrefs, setEditPrefs] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [savedPrefs, setSavedPrefs] = useState(false);
  const [genero, setGenero] = useState<string>("");
  const [ehEstudante, setEhEstudante] = useState(false);
  const [faculdade, setFaculdade] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/auth/me");
        const data: UserMe = res.data;
        setUser(data);
        setNomeCompleto(`${data.nome}${data.sobrenome ? " " + data.sobrenome : ""}`);
        setEmail(data.email);
        setCpfInput(data.cpf ? formatCPF(data.cpf) : "");
        setDataNascimento(
          data.dataNascimento ? new Date(data.dataNascimento).toISOString().split("T")[0] : ""
        );
        setTelefone(data.telefone ?? "");
        setGenero(data.genero != null ? String(data.genero) : "");
        setEhEstudante(data.ehEstudante ?? false);
        setFaculdade(data.faculdade ?? "");
        const e = data.endereco;
        if (e) {
          setEndCep(e.cep ? maskCep(e.cep) : "");
          setEndLogradouro(e.logradouro ?? "");
          setEndNumero(e.numero ?? "");
          setEndBairro(e.bairro ?? "");
          setEndCidade(e.cidade ?? "");
          setEndUf(e.uf ?? "");
          setEndComplemento(e.complemento ?? "");
        }
      } catch (err: any) {
        toast.error(err.message ?? "Erro ao carregar dados");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const saveSection = async (
    payload: Record<string, unknown>,
    setSaving: (v: boolean) => void,
    setSaved: (v: boolean) => void,
    setEdit: (v: boolean) => void,
  ) => {
    setSaving(true);
    try {
      await api.put("/auth/me", payload);
      setSaved(true);
      setEdit(false);
      setTimeout(() => setSaved(false), 2000);
      toast.success("Dados atualizados!");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Erro ao salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  const saveIdent = () => {
    setNomeTouched(true);
    setEmailTouched(true);
    const parts = nomeCompleto.trim().split(/\s+/);
    if (parts.length < 2) { toast.error("Informe nome e sobrenome."); return; }
    if (!validateEmail(email)) { toast.error("E-mail inválido."); return; }
    const nome = parts[0] ?? "";
    const sobrenome = parts.slice(1).join(" ");
    saveSection({ nome, sobrenome, email }, setSavingIdent, setSavedIdent, setEditIdent);
  };

  const saveDocs = () => {
    setCpfTouched(true);
    setDataTouched(true);
    const cpfRaw = cpfInput.replace(/\D/g, "");
    if (!hasCpf && cpfRaw && !validateCPF(cpfRaw)) { toast.error("CPF inválido."); return; }
    const dateErr = !hasBirthday ? validateBirthdate(dataNascimento) : "";
    if (dateErr) { toast.error(dateErr); return; }
    saveSection({ cpf: cpfRaw || undefined, dataNascimento: dataNascimento || undefined }, setSavingDocs, setSavedDocs, setEditDocs);
  };

  const saveContact = () => {
    setTelefoneTouched(true);
    const raw = telefone.replace(/\D/g, "");
    if (raw && !validatePhone(telefone)) { toast.error("Telefone inválido."); return; }
    saveSection({ telefone }, setSavingContact, setSavedContact, setEditContact);
  };

  const savePrefs = () =>
    saveSection(
      { genero: genero !== "" ? parseInt(genero) : undefined, ehEstudante, faculdade },
      setSavingPrefs, setSavedPrefs, setEditPrefs,
    );

  const buscarCep = async (cepRaw: string) => {
    const cep = cepRaw.replace(/\D/g, "");
    if (cep.length !== 8) return;
    try {
      const r = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const d = await r.json();
      if (!d.erro) {
        setEndLogradouro(d.logradouro ?? "");
        setEndBairro(d.bairro ?? "");
        setEndCidade(d.localidade ?? "");
        setEndUf(d.uf ?? "");
      }
    } catch {}
  };

  const saveEndereco = () =>
    saveSection(
      {
        endereco: {
          cep: endCep.replace(/\D/g, ""),
          logradouro: endLogradouro,
          numero: endNumero,
          bairro: endBairro,
          cidade: endCidade,
          uf: endUf,
          complemento: endComplemento,
        },
      },
      setSavingEndereco, setSavedEndereco, setEditEndereco,
    );

  const hasCpf = !!user?.cpf;
  const hasBirthday = !!user?.dataNascimento;

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Meus Dados</h1>
        <p className="text-sm text-gray-500 mt-1">Gerencie suas informações pessoais</p>
      </div>

      {/* ── Identification ──────────────────────────────────────────────── */}
      <Section
        title="Identificação"
        editing={editIdent}
        onEdit={() => setEditIdent(true)}
        onSave={saveIdent}
        saving={savingIdent}
        saved={savedIdent}
      >
        {editIdent ? (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Nome completo</label>
              <Input
                value={nomeCompleto}
                onChange={(e) => setNomeCompleto(e.target.value)}
                onBlur={() => setNomeTouched(true)}
                className={`h-11 rounded-xl ${nomeTouched && nomeCompleto.trim().split(/\s+/).length < 2 ? "border-red-400" : ""}`}
                placeholder="Nome Sobrenome"
              />
              <InlineError msg={nomeTouched && nomeCompleto.trim().split(/\s+/).length < 2 ? "Informe nome e sobrenome" : ""} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">E-mail</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setEmailTouched(true)}
                className={`h-11 rounded-xl ${emailTouched && !validateEmail(email) ? "border-red-400" : emailTouched && validateEmail(email) ? "border-green-400" : ""}`}
              />
              <InlineError msg={emailTouched && !validateEmail(email) ? "E-mail inválido" : ""} />
              <InlineOk show={emailTouched && validateEmail(email)} />
            </div>
            <button type="button" onClick={() => { setEditIdent(false); setNomeTouched(false); setEmailTouched(false); }} className="text-sm text-gray-400 hover:text-gray-600">
              Cancelar
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ReadField label="Nome" value={nomeCompleto} />
            <ReadField label="E-mail" value={email} />
          </div>
        )}
      </Section>

      {/* ── Documents ───────────────────────────────────────────────────── */}
      <Section
        title="Documentos"
        editing={editDocs}
        onEdit={!hasCpf || !hasBirthday ? () => setEditDocs(true) : undefined}
        onSave={saveDocs}
        saving={savingDocs}
        saved={savedDocs}
        editLabel={hasCpf && hasBirthday ? undefined : "Preencher"}
      >
        {editDocs ? (
          <div className="space-y-3">
            {!hasCpf && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">CPF</label>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="000.000.000-00"
                  value={cpfInput}
                  onChange={(e) => setCpfInput(maskCPF(e.target.value))}
                  onBlur={() => setCpfTouched(true)}
                  maxLength={14}
                  className={`h-11 rounded-xl ${cpfTouched && cpfInput && !validateCPF(cpfInput.replace(/\D/g, "")) ? "border-red-400" : cpfTouched && validateCPF(cpfInput.replace(/\D/g, "")) ? "border-green-400" : ""}`}
                />
                <InlineError msg={
                  cpfTouched && cpfInput && cpfInput.replace(/\D/g, "").length < 11
                    ? "CPF incompleto"
                    : cpfTouched && cpfInput && !validateCPF(cpfInput.replace(/\D/g, ""))
                    ? "CPF inválido — verifique os dígitos"
                    : ""
                } />
                <InlineOk show={cpfTouched && validateCPF(cpfInput.replace(/\D/g, ""))} />
              </div>
            )}
            {!hasBirthday && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Data de nascimento</label>
                <Input
                  type="date"
                  value={dataNascimento}
                  onChange={(e) => setDataNascimento(e.target.value)}
                  onBlur={() => setDataTouched(true)}
                  max={new Date().toISOString().split("T")[0]}
                  className={`h-11 rounded-xl ${dataTouched && validateBirthdate(dataNascimento) ? "border-red-400" : dataTouched && dataNascimento && !validateBirthdate(dataNascimento) ? "border-green-400" : ""}`}
                />
                <InlineError msg={dataTouched ? validateBirthdate(dataNascimento) : ""} />
                <InlineOk show={dataTouched && !!dataNascimento && !validateBirthdate(dataNascimento)} />
              </div>
            )}
            <button type="button" onClick={() => { setEditDocs(false); setCpfTouched(false); setDataTouched(false); }} className="text-sm text-gray-400 hover:text-gray-600">
              Cancelar
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="flex items-center gap-1.5 text-xs font-medium text-gray-400 uppercase tracking-wide">
                {hasCpf && <Lock size={12} />} CPF
              </p>
              <p className="text-sm font-medium text-gray-700">
                {user.cpf ? formatCPF(user.cpf) : <span className="text-gray-400 italic">Não informado</span>}
              </p>
              {hasCpf && <p className="text-xs text-gray-300">Por segurança, o CPF não pode ser alterado após preenchido.</p>}
            </div>
            <div className="space-y-1">
              <p className="flex items-center gap-1.5 text-xs font-medium text-gray-400 uppercase tracking-wide">
                {hasBirthday && <Lock size={12} />} Data de nascimento
              </p>
              <p className="text-sm font-medium text-gray-700">
                {user.dataNascimento ? formatBirthday(user.dataNascimento) : <span className="text-gray-400 italic">Não informado</span>}
              </p>
            </div>
          </div>
        )}
      </Section>

      {/* ── Contact ─────────────────────────────────────────────────────── */}
      <Section
        title="Contato"
        editing={editContact}
        onEdit={() => setEditContact(true)}
        onSave={saveContact}
        saving={savingContact}
        saved={savedContact}
      >
        {editContact ? (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Telefone celular</label>
              <Input
                type="tel"
                placeholder="(11) 99999-9999"
                value={telefone}
                onChange={(e) => setTelefone(maskPhone(e.target.value))}
                onBlur={() => setTelefoneTouched(true)}
                maxLength={15}
                className={`h-11 rounded-xl ${telefoneTouched && telefone && !validatePhone(telefone) ? "border-red-400" : telefoneTouched && validatePhone(telefone) ? "border-green-400" : ""}`}
              />
              <InlineError msg={telefoneTouched && telefone && !validatePhone(telefone) ? "Telefone incompleto ou inválido" : ""} />
              <InlineOk show={telefoneTouched && validatePhone(telefone)} />
            </div>
            <button type="button" onClick={() => { setEditContact(false); setTelefoneTouched(false); }} className="text-sm text-gray-400 hover:text-gray-600">
              Cancelar
            </button>
          </div>
        ) : (
          <ReadField label="Telefone" value={telefone || null} />
        )}
      </Section>

      {/* ── Endereço ────────────────────────────────────────────────────── */}
      <Section
        title="Endereço de cobrança"
        editing={editEndereco}
        onEdit={() => setEditEndereco(true)}
        onSave={saveEndereco}
        saving={savingEndereco}
        saved={savedEndereco}
      >
        {editEndereco ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">CEP</label>
                <Input value={endCep} onChange={(e) => { const v = maskCep(e.target.value); setEndCep(v); buscarCep(v); }} maxLength={9} placeholder="00000-000" className="h-11 rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Número</label>
                <Input value={endNumero} onChange={(e) => setEndNumero(e.target.value)} className="h-11 rounded-xl" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Rua</label>
              <Input value={endLogradouro} onChange={(e) => setEndLogradouro(e.target.value)} className="h-11 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Bairro</label>
              <Input value={endBairro} onChange={(e) => setEndBairro(e.target.value)} className="h-11 rounded-xl" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Cidade</label>
                <Input value={endCidade} onChange={(e) => setEndCidade(e.target.value)} className="h-11 rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">UF</label>
                <Input value={endUf} onChange={(e) => setEndUf(e.target.value.toUpperCase())} maxLength={2} className="h-11 rounded-xl uppercase" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Complemento (opcional)</label>
              <Input value={endComplemento} onChange={(e) => setEndComplemento(e.target.value)} className="h-11 rounded-xl" />
            </div>
            <button type="button" onClick={() => setEditEndereco(false)} className="text-sm text-gray-400 hover:text-gray-600">
              Cancelar
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ReadField label="CEP" value={endCep || null} />
            <ReadField label="Número" value={endNumero || null} />
            <ReadField label="Rua" value={endLogradouro || null} />
            <ReadField label="Bairro" value={endBairro || null} />
            <ReadField label="Cidade" value={endCidade || null} />
            <ReadField label="UF" value={endUf || null} />
            <ReadField label="Complemento" value={endComplemento || null} />
          </div>
        )}
      </Section>

      {/* ── Preferences ─────────────────────────────────────────────────── */}
      <Section
        title="Preferências"
        editing={editPrefs}
        onEdit={() => setEditPrefs(true)}
        onSave={savePrefs}
        saving={savingPrefs}
        saved={savedPrefs}
      >
        {editPrefs ? (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Gênero</label>
              <Select value={genero} onValueChange={setGenero}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder="Selecionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Masculino</SelectItem>
                  <SelectItem value="1">Feminino</SelectItem>
                  <SelectItem value="2">Prefiro não informar</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                role="switch"
                aria-checked={ehEstudante}
                onClick={() => setEhEstudante((v) => !v)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${ehEstudante ? "bg-violet-600" : "bg-gray-200"}`}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${ehEstudante ? "translate-x-5" : "translate-x-0"}`}
                />
              </button>
              <label className="text-sm font-medium text-gray-700">Sou estudante universitário</label>
            </div>

            {ehEstudante && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Faculdade</label>
                <Input value={faculdade} onChange={(e) => setFaculdade(e.target.value)} placeholder="Nome da instituição" className="h-11 rounded-xl" />
              </div>
            )}

            <button type="button" onClick={() => setEditPrefs(false)} className="text-sm text-gray-400 hover:text-gray-600">
              Cancelar
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ReadField label="Gênero" value={genero !== "" ? GENERO_LABELS[parseInt(genero)] : null} />
            <ReadField label="Estudante" value={ehEstudante ? faculdade || "Sim" : "Não"} />
          </div>
        )}
      </Section>
    </div>
  );
}
