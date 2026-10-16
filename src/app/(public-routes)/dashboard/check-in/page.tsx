"use client";

import { useState } from "react";
import Link from "next/link";
import { IDetectedBarcode, Scanner } from "@yudiel/react-qr-scanner";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import { getApiBaseUrl } from "@/lib/surfaces";
import { toast } from "@/lib/toast";

type ScanEntry = {
  codigo: string;
  outcome: "válido" | "inválido";
  mensagem: string;
  at: number;
};

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
        toast.success(`Ingresso válido — ${mensagem}`);
        setScans((prev) => [{ codigo: code, outcome: "válido", mensagem, at: Date.now() }, ...prev]);
        setCodigo("");
        return;
      }

      const body = await res.json().catch(() => ({}));
      const mensagem = body?.message ?? "Ingresso inválido.";
      toast.error(mensagem);
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
          <section role="status" aria-live="polite" className={cn("hairline-top relative flex items-center gap-4 rounded-card border p-5 slide-up", last.outcome === "válido" ? "bg-callout-success border-success-ring [--hairline-color:var(--success)]" : "bg-callout-danger border-danger-ring [--hairline-color:var(--danger)]")}>
            <span className={cn("pulse-ring flex size-14 shrink-0 items-center justify-center rounded-full", last.outcome === "válido" ? "bg-success text-white [--pulse-color:var(--success)]" : "bg-danger text-white [--pulse-color:var(--danger)]")}>
              <Icon name={last.outcome === "válido" ? "check" : "close"} size={26} />
            </span>
            <div className="min-w-0 flex-1">
              <p className={cn("text-title font-semibold tracking-tight", last.outcome === "válido" ? "text-success" : "text-danger")}>{last.outcome === "válido" ? "Ingresso válido" : "Ingresso inválido"}</p>
              <p className="mt-0.5 truncate text-body text-foreground">{last.mensagem}</p>
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
                const ok = scan.outcome === "válido";
                return (
                  <li key={`${scan.codigo}-${scan.at}-${idx}`} className="row-in flex items-center gap-3 px-4 py-3" style={{ ["--i" as string]: idx } as never}>
                    <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full", ok ? "bg-success-bg text-success" : "bg-danger-bg text-danger")}>
                      <Icon name={ok ? "check" : "close"} size={13} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{scan.mensagem}</p>
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
