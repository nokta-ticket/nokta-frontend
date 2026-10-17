"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { IDetectedBarcode, Scanner } from "@yudiel/react-qr-scanner";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import { getApiBaseUrl } from "@/lib/surfaces";
import { toast } from "@/lib/toast";

// "erro" = a leitura não chegou a ser verificada (sessão expirada, limite de
// requisições, servidor fora): nunca é motivo pra barrar ninguém.
type ScanEntry = {
  codigo: string;
  outcome: "válido" | "inválido" | "erro";
  mensagem: string;
  at: number;
};

const OUTCOME_UI = {
  válido: { title: "Ingresso válido", icon: "check", card: "bg-callout-success border-success-ring [--hairline-color:var(--success)]", dot: "bg-success text-white [--pulse-color:var(--success)]", text: "text-success", soft: "bg-success-bg text-success" },
  inválido: { title: "Ingresso inválido", icon: "close", card: "bg-callout-danger border-danger-ring [--hairline-color:var(--danger)]", dot: "bg-danger text-white [--pulse-color:var(--danger)]", text: "text-danger", soft: "bg-danger-bg text-danger" },
  erro: { title: "Não verificado", icon: "warning", card: "bg-callout-warning border-warning-ring [--hairline-color:var(--warning)]", dot: "bg-warning text-white [--pulse-color:var(--warning)]", text: "text-warning", soft: "bg-warning-bg text-warning" },
} as const;

const LOGIN_DE_VOLTA = `/login?redirect=${encodeURIComponent("/dashboard/check-in")}`;

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" });
}

/**
 * Tela de check-in — valida ingressos contra a API (POST /tickets/validar)
 * usando a sessão do operador logado. Roda no celular do porteiro: sempre
 * escura (shell público força o tema), câmera no topo, resultado grande e
 * alvos de toque generosos. Fica em (public-routes) porque historicamente
 * também servia um fluxo offline sem sessão (Nokta Access, desativado em
 * 2026-08-21); o código do modo offline/Hub (src/lib/access/*) continua no
 * repositório, só removido desta tela.
 */
export default function ValidarIngressoPage() {
  const [codigo, setCodigo] = useState("");
  const [scans, setScans] = useState<ScanEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const resultRef = useRef<HTMLElement>(null);

  // Confere a sessão ao abrir e quando o celular volta do bloqueio: se ela
  // caiu (remoção do workspace, 12h vencidas), o aviso aparece antes da
  // próxima leitura em vez de virar "não verificado" no meio da fila.
  useEffect(() => {
    const check = () => {
      fetch(`${getApiBaseUrl()}/auth/me`, { credentials: "include" })
        .then((res) => {
          if (res.status === 401) setSessionExpired(true);
          else if (res.ok) setSessionExpired(false);
        })
        .catch(() => {});
    };
    check();
    const onVisible = () => {
      if (document.visibilityState === "visible") check();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  // No celular o resultado fica abaixo da área da câmera: rola até ele a cada
  // leitura, pra o porteiro ver na hora se entra ou não.
  const lastAt = scans[0]?.at;
  useEffect(() => {
    if (lastAt) resultRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [lastAt]);

  const validarIngresso = async (code: string) => {
    if (!code.trim()) {
      toast.error("Digite o código do ingresso");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/tickets/validar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ code }),
      });

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        const mensagem = data.eventName ?? "Validado";
        toast.success("Ingresso válido", { description: mensagem });
        setScans((prev) => [{ codigo: code, outcome: "válido", mensagem, at: Date.now() }, ...prev]);
        setCodigo("");
        setSessionExpired(false);
        return;
      }

      // 401, 429 e 5xx não dizem nada sobre o ingresso — antes todos viravam
      // "Ingresso inválido" e o porteiro barrava quem tinha ingresso bom. O
      // código fica no campo pra ler de novo.
      if (res.status === 401) {
        setSessionExpired(true);
        setIsScanning(false);
        const mensagem = "Sua sessão expirou. O ingresso não foi verificado: entre de novo e leia outra vez.";
        toast.warning("Sessão expirada", { description: "Ingresso NÃO verificado. Entre de novo para continuar." });
        setScans((prev) => [{ codigo: code, outcome: "erro", mensagem, at: Date.now() }, ...prev]);
        return;
      }
      if (res.status === 429 || res.status >= 500) {
        const mensagem =
          res.status === 429
            ? "Muitas leituras seguidas. O ingresso não foi verificado: espere alguns segundos e leia outra vez."
            : "O servidor não respondeu. O ingresso não foi verificado: leia outra vez.";
        toast.warning("Não verificado", { description: mensagem });
        setScans((prev) => [{ codigo: code, outcome: "erro", mensagem, at: Date.now() }, ...prev]);
        return;
      }

      const body = await res.json().catch(() => ({}));
      const mensagem = body?.message ?? "Ingresso inválido.";
      toast.error("Ingresso inválido", { description: mensagem });
      setScans((prev) => [{ codigo: code, outcome: "inválido", mensagem, at: Date.now() }, ...prev]);
      setCodigo("");
    } catch {
      toast.error("Sem conexão com o servidor — tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleToogleScan = () => {
    setIsScanning((prev) => !prev);
  };

  function handleScanError(error: unknown) {
    // Sem isso, permissão de câmera negada / sem câmera disponível falhava
    // completamente em silêncio — a tela ficava com a área do scanner
    // parada, sem nenhum indício do que deu errado.
    setIsScanning(false);
    const message = error instanceof Error ? error.message : "Não foi possível acessar a câmera.";
    toast.error(`Câmera indisponível — ${message}`);
  }

  async function scanResult(result: IDetectedBarcode[]) {
    if (result[0]) {
      const rawValue = result[0].rawValue;
      setIsScanning(false);
      validarIngresso(rawValue);
    }
  }

  const last = scans[0] ?? null;
  const validCount = scans.filter((s) => s.outcome === "válido").length;

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <header className="flex h-14 shrink-0 items-center gap-2 px-4 pt-safe">
        <Link href="/dashboard/inicio" aria-label="Voltar ao painel" className="flex size-11 items-center justify-center rounded-full text-foreground transition-colors hover:bg-surface-2">
          <Icon name="arrow-left" size={18} />
        </Link>
        <h1 className="flex-1 truncate text-base font-semibold">Check-in</h1>
        <span className="inline-flex items-center gap-1.5 rounded-pill bg-surface-2 px-2.5 py-1 text-caption font-medium text-muted-foreground tnum">
          <Icon name="check-double" size={11} className="text-success" />
          {validCount} {validCount === 1 ? "entrada" : "entradas"}
        </span>
      </header>

      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-5 px-4 pb-10">
        {sessionExpired ? (
          <section role="alert" className="flex items-start gap-3 rounded-card border border-warning-ring bg-callout-warning p-4">
            <Icon name="warning" size={18} className="mt-0.5 shrink-0 text-warning" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-foreground">Sua sessão expirou</p>
              <p className="mt-0.5 text-sm text-muted-foreground">Os ingressos não estão sendo verificados. Entre de novo pra continuar — você volta direto pra cá.</p>
              <Button size="sm" shape="pill" className="mt-3" onClick={() => window.location.assign(LOGIN_DE_VOLTA)}>
                Entrar de novo
              </Button>
            </div>
          </section>
        ) : null}

        {/* Câmera */}
        <section className={cn("relative aspect-square w-full overflow-hidden rounded-[24px] border border-border bg-surface shadow-card", isScanning && "pulse-ring [--pulse-size:10px]")}>
          {isScanning ? (
            <>
              <Scanner sound={false} onScan={scanResult} onError={handleScanError} styles={{ container: { width: "100%", height: "100%" } }} />
              <div aria-hidden className="pointer-events-none absolute inset-6 rounded-[20px] border-2 border-brand/70" />
              <button type="button" onClick={handleToogleScan} className="absolute bottom-4 left-1/2 flex h-11 -translate-x-1/2 items-center gap-2 rounded-pill bg-foreground/90 px-5 text-sm font-semibold text-background backdrop-blur">
                <Icon name="close" size={14} />
                Fechar câmera
              </button>
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-5 p-6 text-center">
              <span className="flex size-20 items-center justify-center rounded-full bg-brand-soft text-brand">
                <Icon name="qr" size={34} />
              </span>
              <div>
                <p className="text-lg font-semibold">Aponte pro QR do ingresso</p>
                <p className="mt-1 text-body text-muted-foreground">A validação acontece na hora, com a sua sessão.</p>
              </div>
              <Button size="lg" shape="pill" onClick={handleToogleScan} leftIcon="camera" className="h-14 px-8 text-base">
                Abrir câmera
              </Button>
            </div>
          )}
        </section>

        {/* Último resultado — grande, pra ler de longe */}
        {last ? (
          <section ref={resultRef} role="status" aria-live="polite" className={cn("hairline-top relative flex scroll-mt-4 items-start gap-4 rounded-card border p-5 slide-up", OUTCOME_UI[last.outcome].card)}>
            <span className={cn("pulse-ring flex size-14 shrink-0 items-center justify-center rounded-full", OUTCOME_UI[last.outcome].dot)}>
              <Icon name={OUTCOME_UI[last.outcome].icon} size={26} />
            </span>
            <div className="min-w-0 flex-1">
              <p className={cn("text-title font-semibold tracking-tight", OUTCOME_UI[last.outcome].text)}>{OUTCOME_UI[last.outcome].title}</p>
              {/* Mensagem inteira, quebrando linha: no celular o truncate cortava o motivo. */}
              <p className="mt-1 break-words text-base font-medium leading-snug text-foreground">{last.mensagem}</p>
              <p className="truncate font-mono text-caption text-muted-foreground">{last.codigo}</p>
            </div>
          </section>
        ) : null}

        {/* Código manual */}
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void validarIngresso(codigo);
          }}
        >
          <Input aria-label="Código do ingresso" placeholder="Ou digite o código" value={codigo} onChange={(e) => setCodigo(e.target.value)} className="h-12 font-mono md:h-12" autoCapitalize="characters" autoCorrect="off" leftIcon="barcode" />
          <Button type="submit" loading={loading} className="h-12 shrink-0 px-5" disabled={!codigo.trim()}>
            Validar
          </Button>
        </form>

        {/* Histórico */}
        {scans.length > 0 ? (
          <section className="space-y-2">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <Icon name="history" size={13} />
              Últimas leituras
            </h2>
            <ul className="divide-y divide-border overflow-hidden rounded-card border border-border bg-surface">
              {scans.map((scan, idx) => {
                const ui = OUTCOME_UI[scan.outcome];
                return (
                  <li key={`${scan.codigo}-${scan.at}-${idx}`} className="row-in flex items-start gap-3 px-4 py-3" style={{ ["--i" as string]: idx } as never}>
                    <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full", ui.soft)}>
                      <Icon name={ui.icon} size={13} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="break-words text-sm font-medium text-foreground">{scan.mensagem}</p>
                      <p className="truncate font-mono text-caption text-muted-foreground">{scan.codigo}</p>
                    </div>
                    <span className="shrink-0 text-caption text-subtle-foreground tnum">{formatTime(scan.at)}</span>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}
      </main>
    </div>
  );
}
