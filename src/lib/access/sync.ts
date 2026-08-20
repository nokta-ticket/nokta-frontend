import { getApiBaseUrl } from "@/lib/surfaces";
import { CheckinLogEntry, DeviceConfig, StoredSnapshot, getDeviceConfig, getPendingCheckins, markCheckinsSynced, saveSnapshot } from "./db";

/**
 * Cliente HTTP dos endpoints de dispositivo do Nokta Access
 * (X-Device-Token, nunca cookie de sessão de usuário — o scanner opera por
 * horas sem depender de ninguém logado). Fala com o backend Cloud
 * diretamente, ou com um Access Hub local se `pairedHubUrl` estiver
 * configurado (mesmo protocolo — ver nokta-access-hub/README.md).
 */

function resolveBaseUrl(config: DeviceConfig): string {
  return config.pairedHubUrl || getApiBaseUrl();
}

export async function downloadAndVerifySnapshot(config: DeviceConfig): Promise<StoredSnapshot> {
  const res = await fetch(`${resolveBaseUrl(config)}/access/devices/me/snapshot`, {
    headers: { "X-Device-Token": config.deviceToken },
  });
  if (!res.ok) {
    throw new Error(`Falha ao baixar snapshot (HTTP ${res.status})`);
  }

  const contentHash = res.headers.get("X-Access-Snapshot-Content-Hash") ?? "";

  const gzipped = new Uint8Array(await res.arrayBuffer());

  // Integridade do download (hash), antes de qualquer coisa. Verificação da
  // ASSINATURA Ed25519 em si acontece no Access Hub (que já verificou antes
  // de servir este mesmo conteúdo ao scanner) ou, quando o scanner fala
  // direto com o Cloud, é delegada ao HTTPS + este hash — a chave pública
  // embutida no build do scanner web fica reservada para uma camada de
  // verificação adicional se o app evoluir para nativo/PWA instalável com
  // acesso a WebCrypto Ed25519 (suporte de navegador ainda inconsistente
  // hoje; SubtleCrypto não padronizou Ed25519 universalmente em todos os
  // engines no momento desta entrega — decisão consciente de não bloquear
  // a Fase 1-3 nisso).
  const hashBuffer = await crypto.subtle.digest("SHA-256", gzipped);
  const actualHash = Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, "0")).join("");
  if (actualHash !== contentHash) {
    throw new Error("Hash do snapshot baixado não confere — download corrompido, tente novamente.");
  }

  const jsonText = await new Response(gzipped).arrayBuffer().then((buf) => decompressGzip(buf));
  const file = JSON.parse(jsonText) as {
    eventId: number;
    version: number;
    isFreezeFinal: boolean;
    tickets: { c: string; s: 1 | 2 | 3 | 4; t: number }[];
  };

  const ticketIndex: Record<string, 1 | 2 | 3 | 4> = {};
  for (const t of file.tickets) ticketIndex[t.c] = t.s;

  const snapshot: StoredSnapshot = {
    eventId: file.eventId,
    version: file.version,
    isFreezeFinal: file.isFreezeFinal,
    downloadedAt: new Date().toISOString(),
    ticketIndex,
  };

  await saveSnapshot(snapshot);
  return snapshot;
}

async function decompressGzip(buffer: ArrayBuffer): Promise<string> {
  // DecompressionStream("gzip") é suportado nos navegadores modernos
  // (Chrome/Edge/Safari/Firefox recentes) — evita trazer uma lib de gzip
  // extra só para isso.
  const stream = new Response(buffer).body!.pipeThrough(new DecompressionStream("gzip"));
  const decompressed = await new Response(stream).arrayBuffer();
  return new TextDecoder().decode(decompressed);
}

export async function syncPendingCheckins(eventId: number): Promise<{ sent: number; conflicts: number }> {
  const config = await getDeviceConfig();
  if (!config) return { sent: 0, conflicts: 0 };

  const pending = await getPendingCheckins(eventId);
  if (pending.length === 0) return { sent: 0, conflicts: 0 };

  const items = pending.map((p: CheckinLogEntry) => ({
    idempotencyKey: p.idempotencyKey,
    code: p.code,
    outcome: p.outcome,
    scannedAt: p.scannedAt,
  }));

  const res = await fetch(`${resolveBaseUrl(config)}/access/devices/me/sync`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Device-Token": config.deviceToken },
    body: JSON.stringify({ items }),
  });
  if (!res.ok) {
    throw new Error(`Falha ao sincronizar check-ins (HTTP ${res.status})`);
  }

  const { results } = (await res.json()) as { results: { idempotencyKey: string; finalOutcome: CheckinLogEntry["outcome"] }[] };
  await markCheckinsSynced(results.map((r) => ({ idempotencyKey: r.idempotencyKey, serverOutcome: r.finalOutcome })));

  const conflicts = results.filter((r) => r.finalOutcome === "CONFLICT_LOST").length;
  return { sent: results.length, conflicts };
}

export async function redeemPairingCode(code: string): Promise<DeviceConfig> {
  const res = await fetch(`${getApiBaseUrl()}/access/pairing/redeem`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.message || `Código de pareamento inválido (HTTP ${res.status})`);
  }
  const data = (await res.json()) as { id: number; deviceToken: string; kind: string; label: string; eventId: number };
  return { key: "self", deviceId: data.id, deviceToken: data.deviceToken, label: data.label, eventId: data.eventId, pairedHubUrl: null };
}
