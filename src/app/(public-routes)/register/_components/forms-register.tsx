"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { getCountryCallingCode, type Country } from "react-phone-number-input";
import api, { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { useAuth } from "@/context/AuthContext";
import { toNameCase } from "@/lib/name-case";
import { isSafeInternalRedirect } from "@/lib/safe-redirect";
import { useSurface } from "@/lib/use-surface";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Field } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { OtpInput } from "@/components/ui/otp-input";
import { PasswordInput } from "@/components/ui/password-input";
import { PhoneField } from "@/components/ui/phone-field";
import { validatePhone } from "@/components/ui/phone-input";
import { AuthDivider } from "@/components/auth/auth-screen";
import { SocialAuthButtons } from "@/components/auth/social-auth-buttons";
import { useResendCooldown } from "@/components/auth/use-resend-cooldown";
import { DEVICE_FINGERPRINT_HEADER, getDeviceFingerprint } from "@/components/auth/device-fingerprint";

// Fase 5.1: alternar entre /login e /register nunca deve perder o `ctx`
// (ex.: "produtor", vindo do CTA de cadastro empresarial da LP) — só
// `redirect` era preservado antes, o que jogava quem clicasse em "Entrar"
// de volta pro fluxo de comprador comum.
function buildLoginQuery(ctx: string, redirectTo: string): string {
  const params = new URLSearchParams();
  if (ctx) params.set("ctx", ctx);
  if (redirectTo) params.set("redirect", redirectTo);
  const query = params.toString();
  return query ? `?${query}` : "";
}

// ─── helpers ────────────────────────────────────────────────────────────────

// O campo exibe o nome em maiúsculas só visualmente (CSS); o valor salvo passa
// por toNameCase — é assim que aparece no perfil, e-mails e menu.
function splitName(full: string): { nome: string; sobrenome: string } {
  const parts = toNameCase(full).split(/\s+/);
  if (parts.length === 1) return { nome: parts[0], sobrenome: parts[0] };
  return { nome: parts[0], sobrenome: parts.slice(1).join(" ") };
}

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(senha: string): { valid: boolean; errors: string[] } {
  const errs: string[] = [];
  if (senha.length < 8) errs.push("Mínimo de 8 caracteres");
  if (!/[A-Za-z]/.test(senha)) errs.push("Ao menos uma letra");
  if (!/\d/.test(senha)) errs.push("Ao menos um número");
  if (!/[^A-Za-z\d]/.test(senha)) errs.push("Ao menos um caractere especial");
  return { valid: errs.length === 0, errors: errs };
}

function passwordStrength(senha: string): 0 | 1 | 2 | 3 {
  if (senha.length === 0) return 0;
  let score = 0;
  if (senha.length >= 8) score++;
  if (/[A-Za-z]/.test(senha) && /\d/.test(senha)) score++;
  if (/[^A-Za-z\d]/.test(senha)) score++;
  return score as 0 | 1 | 2 | 3;
}

// ─── Sugestão de e-mail ──────────────────────────────────────────────────────

const KNOWN_DOMAINS = ["gmail.com", "hotmail.com", "yahoo.com", "outlook.com", "live.com", "icloud.com", "uol.com.br", "bol.com.br", "terra.com.br", "yahoo.com.br", "ig.com.br", "hotmail.com.br", "msn.com"];

const TYPO_MAP: Record<string, string> = {
  "gail.com": "gmail.com",
  "gnail.com": "gmail.com",
  "gmai.com": "gmail.com",
  "gmial.com": "gmail.com",
  "gmil.com": "gmail.com",
  "gamil.com": "gmail.com",
  "gimail.com": "gmail.com",
  "gmail.com.br": "gmail.com",
  "gmail.con": "gmail.com",
  "hotmal.com": "hotmail.com",
  "hotmail.com.br": "hotmail.com",
  "hotmial.com": "hotmail.com",
  "homail.com": "hotmail.com",
  "hotmali.com": "hotmail.com",
  "yaho.com": "yahoo.com",
  "yahooo.com": "yahoo.com",
  "outlok.com": "outlook.com",
  "outllok.com": "outlook.com",
  "oulook.com": "outlook.com",
};

function levenshtein(a: string, b: string): number {
  const m = a.length,
    n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) => Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)));
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
  return dp[m][n];
}

function suggestEmail(email: string): string | null {
  const atIdx = email.lastIndexOf("@");
  if (atIdx < 1) return null;
  const local = email.slice(0, atIdx);
  const domain = email.slice(atIdx + 1).toLowerCase();
  if (!domain.includes(".")) return null;
  if (TYPO_MAP[domain]) return `${local}@${TYPO_MAP[domain]}`;
  if (KNOWN_DOMAINS.includes(domain)) return null;
  let best = "",
    bestDist = Infinity;
  for (const known of KNOWN_DOMAINS) {
    const dist = levenshtein(domain, known);
    if (dist < bestDist) {
      bestDist = dist;
      best = known;
    }
  }
  if (bestDist > 0 && bestDist <= 2) return `${local}@${best}`;
  return null;
}

// ─── Força da senha ──────────────────────────────────────────────────────────

const STRENGTH = [
  { label: "", bar: "", text: "" },
  { label: "Fraca", bar: "bg-danger", text: "text-danger" },
  { label: "Média", bar: "bg-warning", text: "text-warning" },
  { label: "Forte", bar: "bg-success", text: "text-success" },
];

function PasswordStrengthBar({ senha }: { senha: string }) {
  const strength = passwordStrength(senha);
  if (!senha) return null;
  const meta = STRENGTH[strength];
  return (
    <div className="mt-2 space-y-1">
      <div className="flex gap-1">
        {[1, 2, 3].map((i) => (
          <div key={i} className={cn("h-1 flex-1 rounded-full transition-colors", i <= strength ? meta.bar : "bg-surface-3")} />
        ))}
      </div>
      <p className={cn("text-micro font-semibold uppercase tracking-wider", meta.text)}>{meta.label}</p>
    </div>
  );
}

// ─── Formulário ──────────────────────────────────────────────────────────────

type Step = "form" | "otp" | "done";

const fingerprintHeaders = () => ({ [DEVICE_FINGERPRINT_HEADER]: getDeviceFingerprint() });

export function RegisterForm() {
  const router = useRouter();
  const surface = useSurface();
  const searchParams = useSearchParams();
  // Em PLATFORM (app.nokta.live) todo cadastro é sobre virar
  // gestor/produtor — não só quando veio do CTA "Começar agora" da LP
  // institucional (que explicitamente passa ?ctx=produtor). Sem isso,
  // cadastro direto em app.nokta.live/register (sem esse parâmetro) caía
  // no fallback "/", nunca no onboarding — usuário ficava sem workspace.
  const ctx = searchParams.get("ctx") || (surface === "PLATFORM" ? "produtor" : "");
  const redirectParam = searchParams.get("redirect") || "";
  const redirectTo = isSafeInternalRedirect(redirectParam) ? redirectParam : "";
  const { signIn } = useAuth();

  const [step, setStep] = useState<Step>("form");
  const [loading, setLoading] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const submittingRef = useRef(false);

  const [phoneCode, setPhoneCode] = useState("");
  const [phoneE164, setPhoneE164] = useState("");

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState(() => searchParams.get("email") || "");
  const [telefone, setTelefone] = useState("");
  const [telefoneCountry, setTelefoneCountry] = useState<Country>("BR");
  const [senha, setSenha] = useState("");

  const [emailSuggestion, setEmailSuggestion] = useState<string | null>(null);
  const [emailTaken, setEmailTaken] = useState(false);
  const [touched, setTouched] = useState({ nome: false, email: false, telefone: false, senha: false });

  const phoneResend = useResendCooldown(60);

  const handleEmailBlur = () => {
    setTouched((t) => ({ ...t, email: true }));
    if (validateEmail(email)) setEmailSuggestion(suggestEmail(email));
  };

  const applySuggestion = () => {
    if (emailSuggestion) {
      setEmail(emailSuggestion);
      setEmailSuggestion(null);
    }
  };

  const pwValidation = validatePassword(senha);

  const errors = {
    nome: touched.nome && nome.trim().split(/\s+/).length < 2 ? "Digite nome e sobrenome" : "",
    email: touched.email && !validateEmail(email) ? "E-mail inválido" : "",
    telefone: touched.telefone && !validatePhone(telefone, telefoneCountry) ? "Telefone inválido" : "",
    senha: touched.senha && !pwValidation.valid ? pwValidation.errors[0] : "",
  };

  const isValid = nome.trim().split(/\s+/).length >= 2 && validateEmail(email) && validatePhone(telefone, telefoneCountry) && pwValidation.valid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current) return;
    setTouched({ nome: true, email: true, telefone: true, senha: true });
    if (!isValid) return;

    submittingRef.current = true;
    setLoading(true);
    const { nome: firstName, sobrenome } = splitName(nome);
    const localDigits = telefone.replace(/\D/g, "");
    const e164 = `+${getCountryCallingCode(telefoneCountry)}${localDigits}`;
    setPhoneE164(e164);

    try {
      await api.post("/auth/register", { nome: firstName, sobrenome, email, senha, telefone: e164 }, { headers: fingerprintHeaders() });
      setStep("otp");
      phoneResend.reset();
    } catch (err) {
      // Conta ativa com este e-mail: mostra o aviso fixo com os links de
      // login/recuperação em vez de um toast que some.
      if (axios.isAxiosError(err) && err.response?.data?.code === "EMAIL_ALREADY_REGISTERED") {
        setEmailTaken(true);
        return;
      }
      toast.error(getErrorMessage(err, "Erro ao criar conta. Tente novamente."));
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (phoneCode.length < 6) return;
    setConfirmLoading(true);
    try {
      const res = await api.post("/auth/confirmar-telefone", { token: phoneCode, phone: phoneE164 }, { headers: fingerprintHeaders() });
      const { user } = res.data;
      signIn(user);
      setStep("done");
      setTimeout(() => {
        if (redirectTo) {
          router.push(redirectTo);
        } else if (ctx === "produtor") {
          // Sempre onboarding — ver mesmo comentário em login-form.tsx.
          router.push("/dashboard/onboarding");
        } else {
          // Navegação forçada — ver login-form.tsx.
          window.location.href = "/";
        }
      }, 1200);
    } catch (err) {
      toast.error(getErrorMessage(err, "Código inválido. Verifique seu WhatsApp e tente novamente."));
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleResendPhone = async () => {
    if (!phoneResend.canResend) return;
    try {
      await api.post("/auth/reenviar-confirmacao", { email }, { headers: fingerprintHeaders() });
      toast.success("Código reenviado no WhatsApp!");
      phoneResend.startCooldown(phoneResend.sendCount + 1);
    } catch (err) {
      toast.error(getErrorMessage(err, "Erro ao reenviar o código."));
    }
  };

  // ── Pronto ──────────────────────────────────────────────────────────────
  if (step === "done") {
    return (
      <div className="scale-in flex flex-col items-center gap-3 py-8 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-success-bg text-success ring-1 ring-inset ring-success-ring">
          <Icon name="check" size={22} />
        </span>
        <h2 className="text-title font-semibold tracking-tight text-foreground">Conta criada!</h2>
        <p className="text-body text-muted-foreground">Te levando pro rolê…</p>
      </div>
    );
  }

  // ── OTP ─────────────────────────────────────────────────────────────────
  if (step === "otp") {
    const phoneDone = phoneCode.length === 6;
    return (
      <div className="space-y-6">
        <button type="button" onClick={() => setStep("form")} className="inline-flex items-center gap-1.5 text-caption font-medium text-muted-foreground transition-colors hover:text-foreground">
          <Icon name="arrow-left" size={12} /> Voltar ao cadastro
        </button>

        <div className="flex flex-col items-center text-center">
          <Icon name="whatsapp" size={34} className="text-success" />
          <h2 className="mt-3 text-title font-semibold tracking-tight text-foreground">Confirma seu número</h2>
          <p className="mt-1.5 text-body text-muted-foreground">Mandamos um código de 6 dígitos no WhatsApp pra</p>
          <span className="tnum mt-2 inline-flex items-center gap-2 rounded-pill bg-surface-2 px-3.5 py-1.5 text-sm font-semibold text-foreground">
            {phoneE164}
            {phoneDone ? <Icon name="check" size={12} className="text-success" /> : null}
          </span>
        </div>

        <div className="space-y-3">
          <OtpInput value={phoneCode} onChange={setPhoneCode} disabled={confirmLoading} autoFocus />
          <p className="flex min-h-5 items-center justify-center text-center text-caption text-muted-foreground">
            {phoneResend.secondsLeft > 0 ? (
              <>
                Reenviar em&nbsp;<span className="tnum font-semibold text-foreground">{phoneResend.formatTime(phoneResend.secondsLeft)}</span>
              </>
            ) : (
              <button type="button" onClick={handleResendPhone} className="font-semibold text-brand underline-offset-4 hover:underline">
                Reenviar código no WhatsApp
              </button>
            )}
          </p>
        </div>

        <div className="space-y-3">
          <Button type="button" size="full" disabled={!phoneDone} loading={confirmLoading} onClick={handleConfirm}>
            {confirmLoading ? "Verificando…" : "Confirmar conta"}
          </Button>
          <p className="text-center text-caption text-muted-foreground">
            Número errado?{" "}
            <button type="button" onClick={() => setStep("form")} className="font-semibold text-brand underline-offset-4 hover:underline">
              Voltar e corrigir
            </button>
          </p>
        </div>
      </div>
    );
  }

  // ── Formulário ──────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      <SocialAuthButtons ctx={ctx} mode="register" />
      <AuthDivider />

      <form onSubmit={handleSubmit} noValidate className="space-y-3.5">
        <Field label="Nome completo" htmlFor="reg-nome" error={errors.nome}>
          <Input
            id="reg-nome"
            type="text"
            leftIcon="user"
            placeholder="Como no seu documento"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, nome: true }))}
            autoComplete="name"
            aria-invalid={errors.nome ? true : undefined}
            className="[&_input]:uppercase [&_input]:placeholder:normal-case"
          />
        </Field>

        <Field
          label="E-mail"
          htmlFor="reg-email"
          error={
            errors.email ? (
              errors.email
            ) : emailTaken ? (
              <>
                Este e-mail já tem uma conta.{" "}
                <Link href={`/login${buildLoginQuery(ctx, redirectTo)}`} className="font-semibold underline underline-offset-2">
                  Fazer login
                </Link>{" "}
                ou{" "}
                <Link href="/recuperar-senha" className="font-semibold underline underline-offset-2">
                  recuperar senha
                </Link>
                .
              </>
            ) : undefined
          }
        >
          <Input
            id="reg-email"
            type="email"
            leftIcon="mail"
            placeholder="voce@email.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setEmailSuggestion(null);
              setEmailTaken(false);
            }}
            onBlur={handleEmailBlur}
            autoComplete="email"
            aria-invalid={errors.email || emailTaken ? true : undefined}
          />
        </Field>

        {emailSuggestion && !errors.email ? (
          <Callout
            tone="warning"
            action={
              <button type="button" onClick={() => setEmailSuggestion(null)} aria-label="Ignorar sugestão" className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-surface-2 hover:text-foreground">
                <Icon name="close" size={12} />
              </button>
            }
          >
            Você quis dizer{" "}
            <button type="button" onClick={applySuggestion} className="font-semibold text-foreground underline underline-offset-2">
              {emailSuggestion}
            </button>
            ?
          </Callout>
        ) : null}

        <Field label="WhatsApp" htmlFor="reg-telefone" hint={errors.telefone ? undefined : "Você recebe o código de confirmação nele."} error={errors.telefone}>
          <PhoneField
            id="reg-telefone"
            value={telefone}
            country={telefoneCountry}
            onChange={(display, country) => {
              setTelefone(display);
              setTelefoneCountry(country);
            }}
            onBlur={() => setTouched((t) => ({ ...t, telefone: true }))}
            invalid={!!errors.telefone}
          />
        </Field>

        <Field label="Senha" htmlFor="reg-senha" hint={touched.senha || senha ? undefined : "8+ caracteres, com letra, número e símbolo."}>
          <PasswordInput
            id="reg-senha"
            leftIcon="lock"
            placeholder="Crie uma senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, senha: true }))}
            autoComplete="new-password"
            aria-invalid={touched.senha && !pwValidation.valid && senha.length > 0 ? true : undefined}
          />
          {senha ? <PasswordStrengthBar senha={senha} /> : null}
          {touched.senha && !pwValidation.valid && senha.length > 0 ? (
            <ul className="mt-1 space-y-0.5">
              {pwValidation.errors.map((e) => (
                <li key={e} className="flex items-center gap-1.5 text-caption text-danger">
                  <Icon name="exclamation-circle" size={11} /> {e}
                </li>
              ))}
            </ul>
          ) : null}
        </Field>

        <Button type="submit" size="full" loading={loading} className="mt-1">
          {loading ? "Criando conta…" : "Criar conta"}
        </Button>
      </form>

      <p className="text-center text-caption leading-relaxed text-subtle-foreground">
        Ao criar sua conta, você aceita nossos{" "}
        <Link href="/termos" className="text-muted-foreground underline underline-offset-2 hover:text-foreground">
          Termos
        </Link>{" "}
        e a{" "}
        <Link href="/privacidade" className="text-muted-foreground underline underline-offset-2 hover:text-foreground">
          Política de Privacidade
        </Link>
        .
      </p>

      <p className="text-center text-sm text-muted-foreground">
        Já tem uma conta?{" "}
        <Link href={`/login${buildLoginQuery(ctx, redirectTo)}`} className="font-semibold text-brand underline-offset-4 hover:underline">
          Entrar
        </Link>
      </p>
    </div>
  );
}
