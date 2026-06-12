"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, ArrowLeft, CheckCircle2, AlertCircle, Mail, User, Lock, Check } from "lucide-react";
import { toast } from "@/lib/toast";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/axios";
import { PhoneInput, validatePhone } from "@/components/ui/phone-input";
import { getCountryCallingCode, type Country } from "react-phone-number-input";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// ─── WhatsApp icon ──────────────────────────────────────────────────────────

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className={className} aria-hidden>
      <path fill="#fff" d="M4.868,43.303l2.694-9.835C5.9,30.59,5.026,27.324,5.027,23.979C5.032,13.514,13.548,5,24.014,5c5.079,0.002,9.845,1.979,13.43,5.566c3.584,3.588,5.558,8.356,5.556,13.428c-0.004,10.465-8.522,18.98-18.986,18.98c-0.001,0,0,0,0,0h-0.008c-3.177-0.001-6.3-0.798-9.073-2.311L4.868,43.303z"/>
      <path fill="#fff" d="M4.868,43.803c-0.132,0-0.26-0.052-0.355-0.148c-0.125-0.127-0.174-0.312-0.127-0.483l2.639-9.636c-1.636-2.906-2.499-6.206-2.497-9.556C4.532,13.238,13.273,4.5,24.014,4.5c5.21,0.002,10.105,2.031,13.784,5.713c3.679,3.683,5.704,8.577,5.702,13.781c-0.004,10.741-8.746,19.48-19.486,19.48c-3.189-0.001-6.344-0.788-9.144-2.277l-9.875,2.589C4.953,43.798,4.911,43.803,4.868,43.803z"/>
      <path fill="#cfd8dc" d="M24.014,5c5.079,0.002,9.845,1.979,13.43,5.566c3.584,3.588,5.558,8.356,5.556,13.428c-0.004,10.465-8.522,18.98-18.986,18.98h-0.008c-3.177-0.001-6.3-0.798-9.073-2.311L4.868,43.303l2.694-9.835C5.9,30.59,5.026,27.324,5.027,23.979C5.032,13.514,13.548,5,24.014,5 M24.014,42.974C24.014,42.974,24.014,42.974,24.014,42.974C24.014,42.974,24.014,42.974,24.014,42.974 M24.014,42.974C24.014,42.974,24.014,42.974,24.014,42.974C24.014,42.974,24.014,42.974,24.014,42.974 M24.014,4C24.014,4,24.014,4,24.014,4C12.998,4,4.032,12.962,4.027,23.979c-0.001,3.367,0.849,6.685,2.461,9.622l-2.585,9.439c-0.094,0.345,0.002,0.713,0.254,0.967c0.19,0.192,0.447,0.297,0.711,0.297c0.085,0,0.17-0.011,0.254-0.033l9.687-2.54c2.828,1.468,5.998,2.243,9.197,2.244c11.024,0,19.99-8.963,19.995-19.98c0.002-5.339-2.075-10.359-5.848-14.135C34.378,6.083,29.357,4.002,24.014,4L24.014,4z"/>
      <path fill="#40c351" d="M35.176,12.832c-2.98-2.982-6.941-4.625-11.157-4.626c-8.704,0-15.783,7.076-15.787,15.774c-0.001,2.981,0.833,5.883,2.413,8.396l0.376,0.597l-1.595,5.821l5.973-1.566l0.577,0.342c2.422,1.438,5.2,2.198,8.032,2.199h0.006c8.698,0,15.777-7.077,15.78-15.776C39.795,19.778,38.156,15.814,35.176,12.832z"/>
      <path fill="#fff" fillRule="evenodd" d="M19.268,16.045c-0.355-0.79-0.729-0.806-1.068-0.82c-0.277-0.012-0.593-0.011-0.909-0.011c-0.316,0-0.83,0.119-1.265,0.594c-0.435,0.475-1.661,1.622-1.661,3.956c0,2.334,1.7,4.59,1.937,4.906c0.237,0.316,3.282,5.259,8.104,7.161c4.007,1.58,4.823,1.266,5.693,1.187c0.87-0.079,2.807-1.147,3.202-2.255c0.395-1.108,0.395-2.057,0.277-2.255c-0.119-0.198-0.435-0.316-0.909-0.554s-2.807-1.385-3.242-1.543c-0.435-0.158-0.751-0.237-1.068,0.238c-0.316,0.474-1.225,1.543-1.502,1.859c-0.277,0.317-0.554,0.357-1.028,0.119c-0.474-0.238-2.002-0.738-3.815-2.354c-1.41-1.257-2.362-2.81-2.639-3.285c-0.277-0.474-0.03-0.731,0.208-0.968c0.213-0.213,0.474-0.554,0.712-0.831c0.237-0.277,0.316-0.475,0.474-0.791c0.158-0.317,0.079-0.594-0.04-0.831C20.612,19.329,19.69,16.983,19.268,16.045z" clipRule="evenodd"/>
    </svg>
  );
}

// ─── Device fingerprint ──────────────────────────────────────────────────────

function getDeviceFingerprint(): string {
  if (typeof window === 'undefined') return 'ssr';
  const key = 'nokta_device_id';
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

// ─── helpers ────────────────────────────────────────────────────────────────

function splitName(full: string): { nome: string; sobrenome: string } {
  const parts = full.trim().split(/\s+/);
  if (parts.length === 1) return { nome: parts[0], sobrenome: parts[0] };
  return { nome: parts[0], sobrenome: parts.slice(1).join(" ") };
}

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}


function validatePassword(senha: string): { valid: boolean; errors: string[] } {
  const errs: string[] = [];
  if (senha.length < 8)          errs.push("Mínimo de 8 caracteres");
  if (!/[A-Za-z]/.test(senha))   errs.push("Ao menos uma letra");
  if (!/\d/.test(senha))         errs.push("Ao menos um número");
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

// ─── Email suggestion ────────────────────────────────────────────────────────

const KNOWN_DOMAINS = [
  "gmail.com","hotmail.com","yahoo.com","outlook.com","live.com",
  "icloud.com","uol.com.br","bol.com.br","terra.com.br",
  "yahoo.com.br","ig.com.br","hotmail.com.br","msn.com",
];

const TYPO_MAP: Record<string, string> = {
  "gail.com":"gmail.com","gnail.com":"gmail.com","gmai.com":"gmail.com",
  "gmial.com":"gmail.com","gmil.com":"gmail.com","gamil.com":"gmail.com",
  "gimail.com":"gmail.com","gmail.com.br":"gmail.com","gmail.con":"gmail.com",
  "hotmal.com":"hotmail.com","hotmail.com.br":"hotmail.com","hotmial.com":"hotmail.com",
  "homail.com":"hotmail.com","hotmali.com":"hotmail.com",
  "yaho.com":"yahoo.com","yahooo.com":"yahoo.com",
  "outlok.com":"outlook.com","outllok.com":"outlook.com","oulook.com":"outlook.com",
};

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1]
        ? dp[i-1][j-1]
        : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
  return dp[m][n];
}

function suggestEmail(email: string): string | null {
  const atIdx = email.lastIndexOf("@");
  if (atIdx < 1) return null;
  const local  = email.slice(0, atIdx);
  const domain = email.slice(atIdx + 1).toLowerCase();
  if (!domain.includes("."))      return null;
  if (TYPO_MAP[domain])           return `${local}@${TYPO_MAP[domain]}`;
  if (KNOWN_DOMAINS.includes(domain)) return null;
  let best = "", bestDist = Infinity;
  for (const known of KNOWN_DOMAINS) {
    const dist = levenshtein(domain, known);
    if (dist < bestDist) { bestDist = dist; best = known; }
  }
  if (bestDist > 0 && bestDist <= 2) return `${local}@${best}`;
  return null;
}

// ─── Input base ──────────────────────────────────────────────────────────────

const inputBase =
  "h-[42px] w-full rounded-xl border border-gray-200 bg-gray-50/60 text-[16px] sm:text-[13px] text-gray-900 placeholder:text-gray-500 outline-none transition-all duration-200 focus:border-violet-400/80 focus:bg-white focus:ring-2 focus:ring-violet-500/10 focus:shadow-[0_0_0_3px_rgba(139,92,246,0.07)]";

// ─── OAuth buttons ──────────────────────────────────────────────────────────

function OAuthButtons({ ctx }: { ctx: string }) {
  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => { window.location.href = `${API_URL}/auth/google?state=${ctx}`; }}
        className="group flex h-[42px] w-full items-center justify-center gap-2.5 rounded-xl border border-gray-200 bg-white px-4 text-[13px] font-medium text-gray-700 transition-all duration-150 hover:border-gray-300 hover:bg-gray-50/80 hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] active:scale-[0.99]"
      >
        <svg width="17" height="17" viewBox="0 0 18 18" aria-hidden className="shrink-0">
          <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
          <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
          <path fill="#FBBC05" d="M3.964 10.707C3.784 10.167 3.682 9.59 3.682 9s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.548 0 9s.347 2.825.957 4.039l3.007-2.332z"/>
          <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"/>
        </svg>
        Cadastrar com Google
      </button>

      <button
        type="button"
        onClick={() => { window.location.href = `${API_URL}/auth/apple?state=${ctx}`; }}
        className="group flex h-[42px] w-full items-center justify-center gap-2.5 rounded-xl border border-gray-200 bg-white px-4 text-[13px] font-medium text-gray-700 transition-all duration-150 hover:border-gray-300 hover:bg-gray-50/80 hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] active:scale-[0.99]"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden className="shrink-0">
          <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.54 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.029 1.52-.065 2.09-.987 3.925-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/>
        </svg>
        Cadastrar com Apple
      </button>

      <div className="relative py-0.5">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-gray-100" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-3 text-[11px] font-medium uppercase tracking-[0.08em] text-gray-400">
            ou
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── OTP input ──────────────────────────────────────────────────────────────

function OtpInput({
  onChange,
  disabled,
  autoFocus = false,
  completed = false,
}: {
  onChange: (code: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  completed?: boolean;
}) {
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const r0 = useRef<HTMLInputElement>(null);
  const r1 = useRef<HTMLInputElement>(null);
  const r2 = useRef<HTMLInputElement>(null);
  const r3 = useRef<HTMLInputElement>(null);
  const r4 = useRef<HTMLInputElement>(null);
  const r5 = useRef<HTMLInputElement>(null);
  const refs = [r0, r1, r2, r3, r4, r5];

  useEffect(() => { if (autoFocus) refs[0].current?.focus(); }, []);

  const handleChange = (idx: number, val: string) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[idx] = digit;
    setDigits(next);
    if (digit && idx < 5) refs[idx + 1].current?.focus();
    onChange(next.join(""));
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!digits[idx] && idx > 0) {
        refs[idx - 1].current?.focus();
      } else {
        const next = [...digits];
        next[idx] = "";
        setDigits(next);
        onChange(next.join(""));
        e.preventDefault();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      const next = pasted.split("");
      setDigits(next);
      refs[5].current?.focus();
      onChange(pasted);
    }
    e.preventDefault();
  };

  const isDone = digits.every((d) => d !== "");

  return (
    <div className="flex gap-[10px] justify-center" onPaste={handlePaste}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={refs[i]}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          disabled={disabled}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className={[
            "h-[52px] w-[44px] rounded-[14px] border-[1.5px] text-center text-[18px] font-semibold outline-none transition-all duration-200 ease-out",
            "focus:scale-[1.03] focus:shadow-[0_0_0_3.5px_rgba(139,92,246,0.09),_0_1px_3px_rgba(0,0,0,0.06)]",
            "disabled:cursor-not-allowed disabled:opacity-40",
            isDone && !disabled
              ? "border-green-400/50 bg-green-50/25 text-green-700 focus:border-green-500/50 focus:shadow-[0_0_0_3.5px_rgba(74,222,128,0.08)]"
              : d
              ? "border-violet-300/50 bg-white text-gray-950 focus:border-violet-400/70 focus:shadow-[0_0_0_3.5px_rgba(139,92,246,0.09),_0_1px_3px_rgba(0,0,0,0.06)]"
              : "border-gray-200 bg-gray-50/60 text-gray-900 focus:border-violet-400/60 focus:bg-white",
          ].join(" ")}
        />
      ))}
    </div>
  );
}

// ─── Password strength bar ───────────────────────────────────────────────────

function PasswordStrengthBar({ senha }: { senha: string }) {
  const strength = passwordStrength(senha);
  if (!senha) return null;
  const labels     = ["","Fraca","Média","Forte"];
  const colors     = ["","bg-red-400","bg-amber-400","bg-green-500"];
  const textColors = ["","text-red-500","text-amber-500","text-green-600"];
  return (
    <div className="space-y-1 mt-1.5">
      <div className="flex gap-1">
        {[1,2,3].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all ${i <= strength ? colors[strength] : "bg-gray-200"}`}
          />
        ))}
      </div>
      <p className={`text-[11px] font-medium ${textColors[strength]}`}>{labels[strength]}</p>
    </div>
  );
}

// ─── Resend cooldown ─────────────────────────────────────────────────────────

function useResendCooldown() {
  const [sendCount, setSendCount] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(60);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) { clearInterval(timerRef.current!); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const startCooldown = (nextCount: number) => {
    const secs = nextCount * 300;
    setSecondsLeft(secs);
    setSendCount(nextCount);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) { clearInterval(timerRef.current!); return 0; }
        return s - 1;
      });
    }, 1000);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}m ${sec.toString().padStart(2,"0")}s` : `${s}s`;
  };

  return { sendCount, secondsLeft, canResend: secondsLeft === 0, startCooldown, formatTime };
}

// ─── Main form ───────────────────────────────────────────────────────────────

type Step = "form" | "otp" | "done";

export function RegisterForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const ctx          = searchParams.get("ctx") || "";
  const { signIn }   = useAuth();

  const [step,           setStep]          = useState<Step>("form");
  const [loading,        setLoading]       = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [showPw,         setShowPw]        = useState(false);

  const [phoneCode,  setPhoneCode]  = useState("");
  const [phoneE164,  setPhoneE164]  = useState("");

  const [nome,            setNome]           = useState("");
  const [email,           setEmail]          = useState("");
  const [telefone,        setTelefone]       = useState("");
  const [telefoneCountry, setTelefoneCountry] = useState<Country>("BR");
  const [senha,           setSenha]          = useState("");

  const [emailSuggestion, setEmailSuggestion] = useState<string | null>(null);
  const [touched, setTouched] = useState({ nome: false, email: false, telefone: false, senha: false });

  const phoneResend = useResendCooldown();

  const handleEmailBlur = () => {
    setTouched((t) => ({ ...t, email: true }));
    if (validateEmail(email)) setEmailSuggestion(suggestEmail(email));
  };

  const applySuggestion = () => {
    if (emailSuggestion) { setEmail(emailSuggestion); setEmailSuggestion(null); }
  };

  const pwValidation = validatePassword(senha);

  const errors = {
    nome:     touched.nome     && nome.trim().split(/\s+/).length < 2    ? "Digite nome e sobrenome" : "",
    email:    touched.email    && !validateEmail(email)                   ? "E-mail inválido"         : "",
    telefone: touched.telefone && !validatePhone(telefone, telefoneCountry) ? "Telefone inválido"     : "",
    senha:    touched.senha    && !pwValidation.valid                     ? pwValidation.errors[0]    : "",
  };

  const isValid =
    nome.trim().split(/\s+/).length >= 2 &&
    validateEmail(email) &&
    validatePhone(telefone, telefoneCountry) &&
    pwValidation.valid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ nome: true, email: true, telefone: true, senha: true });
    if (!isValid) return;

    setLoading(true);
    const { nome: firstName, sobrenome } = splitName(nome);
    const localDigits = telefone.replace(/\D/g, "");
    const e164 = `+${getCountryCallingCode(telefoneCountry)}${localDigits}`;
    setPhoneE164(e164);

    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
          "X-Device-Fingerprint": getDeviceFingerprint(),
        },
        body: JSON.stringify({ nome: firstName, sobrenome, email, senha, telefone: e164 }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Erro ao criar conta");
      }
      setStep("otp");
    } catch (err: any) {
      toast.error(err.message || "Erro ao criar conta. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (phoneCode.length < 6) return;
    setConfirmLoading(true);
    try {
      const res = await api.post(
        "/auth/confirmar-telefone",
        { token: phoneCode, phone: phoneE164 },
        { headers: { "X-Device-Fingerprint": getDeviceFingerprint() } },
      );
      const { token, user } = res.data;
      signIn(token, user);
      setStep("done");
      setTimeout(() => {
        if (ctx === "produtor") {
          router.push(user.role === "PRODUTOR" ? "/produtor/eventos" : "/produtor/onboarding");
        } else {
          router.push("/");
        }
      }, 1200);
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Código inválido. Verifique seu WhatsApp e tente novamente.";
      toast.error(msg);
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleResendPhone = async () => {
    if (!phoneResend.canResend) return;
    try {
      const res = await fetch(`${API_URL}/auth/reenviar-confirmacao`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
          "X-Device-Fingerprint": getDeviceFingerprint(),
        },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Erro ao reenviar o código.");
      }
      toast.success("Código reenviado no WhatsApp!");
      phoneResend.startCooldown(phoneResend.sendCount + 1);
    } catch (err: any) {
      toast.error(err.message || "Erro ao reenviar o código.");
    }
  };

  // ── Done ─────────────────────────────────────────────────────────────────
  if (step === "done") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-10 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
          <CheckCircle2 className="h-7 w-7 text-green-500" />
        </div>
        <h2 className="text-[19px] font-bold tracking-[-0.3px] text-gray-900">Conta criada!</h2>
        <p className="text-[13px] text-gray-500">Redirecionando…</p>
      </div>
    );
  }

  // ── OTP ──────────────────────────────────────────────────────────────────
  if (step === "otp") {
    const phoneDone  = phoneCode.length === 6;
    const canConfirm = phoneDone && !confirmLoading;

    return (
      <div className="space-y-6">

        {/* Back */}
        <button
          type="button"
          onClick={() => setStep("form")}
          className="flex items-center gap-1.5 text-[12.5px] text-gray-400 hover:text-gray-600 transition-colors"
        >
          <ArrowLeft size={13} /> Voltar ao cadastro
        </button>

        {/* Header */}
        <div className="text-center space-y-1.5">
          <div className="flex justify-center mb-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50">
              <WhatsAppIcon className="h-8 w-8" />
            </div>
          </div>
          <h2 className="text-[20px] font-bold tracking-[-0.4px] text-gray-950">
            Verificação de telefone
          </h2>
          <p className="text-[13px] text-gray-500">
            Enviamos um código de 6 dígitos para
          </p>
          <div className="inline-flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50/70 px-3 py-1.5">
            <WhatsAppIcon className="h-[14px] w-[14px] shrink-0" />
            <span className="text-[13px] font-medium text-gray-700">{phoneE164}</span>
            {phoneDone && <Check size={13} className="shrink-0 text-green-500" />}
          </div>
          <p className="text-[11px] text-gray-400">Enviamos um código de confirmação para o seu WhatsApp.</p>
          <p className="text-[11px] text-gray-400">Digite o código recebido para ativar sua conta.</p>
        </div>

        {/* OTP */}
        <div className="space-y-3">
          <OtpInput
            onChange={setPhoneCode}
            disabled={confirmLoading}
            autoFocus
            completed={phoneDone}
          />
          <div className="flex justify-center">
            {phoneResend.secondsLeft > 0 ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100/80 px-3 py-1 text-[11.5px] text-gray-500">
                <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-pulse" />
                Reenviar em{" "}
                <span className="font-semibold tabular-nums text-gray-700">
                  {phoneResend.formatTime(phoneResend.secondsLeft)}
                </span>
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResendPhone}
                className="text-[12px] text-gray-500 underline underline-offset-2 decoration-gray-300 hover:text-gray-700 hover:decoration-gray-400 transition-colors"
              >
                Reenviar código no WhatsApp
              </button>
            )}
          </div>
        </div>

        {/* Confirm button */}
        <div className="space-y-3 pt-1">
          <button
            type="button"
            disabled={!canConfirm}
            onClick={handleConfirm}
            className="h-[50px] w-full rounded-xl bg-gradient-to-br from-[#6D28D9] to-[#5B21B6] text-[13.5px] font-semibold tracking-[0.02em] text-white shadow-[0_2px_4px_rgba(0,0,0,0.10),_0_4px_16px_rgba(91,33,182,0.30)] transition-all duration-200 hover:from-[#5B21B6] hover:to-[#4C1D95] hover:shadow-[0_4px_20px_rgba(91,33,182,0.36)] active:scale-[0.99] active:shadow-[0_1px_4px_rgba(91,33,182,0.20)] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
          >
            {confirmLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-[14px] w-[14px] rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Verificando…
              </span>
            ) : (
              "Confirmar conta"
            )}
          </button>

          <p className="text-center text-[11px] text-gray-400">
            Número errado?{" "}
            <button
              type="button"
              onClick={() => setStep("form")}
              className="text-violet-600 underline underline-offset-2 hover:text-violet-700 transition-colors"
            >
              Voltar e corrigir
            </button>
          </p>
        </div>

      </div>
    );
  }

  // ── Form ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-3">

      {/* Título */}
      <div className="text-center space-y-0.5">
        <h1 className="text-[20px] font-bold tracking-[-0.4px] text-gray-950">Crie sua conta</h1>
        <p className="text-[12px] text-gray-500">Rápido, gratuito e seguro</p>
      </div>

      <OAuthButtons ctx={ctx} />

      <form onSubmit={handleSubmit} noValidate className="space-y-2">

        {/* Nome */}
        <div className="space-y-1">
          <div className="relative">
            <User size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Nome completo"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, nome: true }))}
              autoComplete="name"
              className={`${inputBase} pl-[38px] pr-4 ${errors.nome ? "border-red-300 focus:border-red-400 focus:ring-red-400/10" : ""}`}
            />
          </div>
          {errors.nome && <p className="text-[11.5px] text-red-500 pl-1">{errors.nome}</p>}
        </div>

        {/* Email */}
        <div className="space-y-1">
          <div className="relative">
            <Mail size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="email"
              placeholder="E-mail"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setEmailSuggestion(null); }}
              onBlur={handleEmailBlur}
              autoComplete="email"
              className={`${inputBase} pl-[38px] pr-4 ${errors.email ? "border-red-300 focus:border-red-400 focus:ring-red-400/10" : ""}`}
            />
          </div>
          {errors.email && <p className="text-[11.5px] text-red-500 pl-1">{errors.email}</p>}
          {emailSuggestion && !errors.email && (
            <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-[12px]">
              <span className="text-amber-700">
                Você quis dizer{" "}
                <button type="button" onClick={applySuggestion}
                  className="font-semibold text-amber-900 underline underline-offset-2 hover:text-amber-700">
                  {emailSuggestion}
                </button>?
              </span>
              <button type="button" onClick={() => setEmailSuggestion(null)}
                className="ml-auto text-amber-500 hover:text-amber-700">✕</button>
            </div>
          )}
        </div>

        {/* Telefone */}
        <div className="space-y-1">
          <PhoneInput
            value={telefone}
            country={telefoneCountry}
            onChange={(display, country) => {
              setTelefone(display);
              setTelefoneCountry(country);
            }}
            onBlur={() => setTouched((t) => ({ ...t, telefone: true }))}
            error={!!errors.telefone}
          />
          {errors.telefone && <p className="text-[11.5px] text-red-500 pl-1">{errors.telefone}</p>}
        </div>

        {/* Senha */}
        <div className="space-y-1">
          <div className="relative">
            <Lock size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type={showPw ? "text" : "password"}
              placeholder="Senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, senha: true }))}
              autoComplete="new-password"
              className={`${inputBase} pl-[38px] pr-10 ${
                touched.senha && !pwValidation.valid && senha.length > 0
                  ? "border-red-300 focus:border-red-400 focus:ring-red-400/10"
                  : touched.senha && pwValidation.valid
                  ? "border-green-400/60 focus:border-green-500/60 focus:ring-green-400/10"
                  : ""
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPw((p) => !p)}
              aria-label="Mostrar/ocultar senha"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {senha && <PasswordStrengthBar senha={senha} />}
          {touched.senha && !pwValidation.valid && senha.length > 0 && (
            <ul className="space-y-0.5 mt-0.5">
              {pwValidation.errors.map((e) => (
                <li key={e} className="flex items-center gap-1 text-[11.5px] text-red-500">
                  <AlertCircle size={11} /> {e}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="mt-1 h-[46px] w-full rounded-xl bg-[#5B21B6] text-[13.5px] font-semibold tracking-[0.02em] text-white/95 shadow-[0_1px_2px_rgba(0,0,0,0.08),_0_2px_10px_rgba(91,33,182,0.18)] transition-all duration-200 hover:bg-[#4C1D95] hover:shadow-[0_4px_14px_rgba(91,33,182,0.24)] active:scale-[0.99] active:shadow-none disabled:cursor-not-allowed disabled:opacity-55"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-[14px] w-[14px] rounded-full border-2 border-white/30 border-t-white animate-spin" />
              Criando conta…
            </span>
          ) : (
            "Criar conta"
          )}
        </button>

      </form>

      <p className="mt-2 text-center text-[11px] leading-relaxed text-gray-400">
        Ao criar sua conta, você aceita nossos{" "}
        <Link href="/termos" className="text-gray-500 underline underline-offset-2 decoration-gray-300 hover:text-gray-700 hover:decoration-gray-400 transition-colors">Termos</Link>
        {" "}e{" "}
        <Link href="/privacidade" className="text-gray-500 underline underline-offset-2 decoration-gray-300 hover:text-gray-700 hover:decoration-gray-400 transition-colors">Política de Privacidade</Link>.
      </p>

      <p className="mt-1.5 text-center text-[13px] text-gray-500">
        Já tem uma conta?{" "}
        <Link
          href="/login"
          className="font-medium text-violet-700 underline-offset-2 transition-colors hover:text-violet-800 hover:underline"
        >
          Entrar
        </Link>
      </p>

    </div>
  );
}
