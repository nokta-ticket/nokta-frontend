import { appendCheckinLog, getSnapshot, saveSnapshot, CheckinLogEntry, CheckinOutcome, StoredSnapshot } from "./db";

export interface OfflineValidationResult {
  outcome: CheckinOutcome;
  message: string;
}

function uuid(): string {
  // crypto.randomUUID é suportado em todo navegador moderno (contexto
  // seguro/HTTPS, que o dashboard sempre é) — nenhuma lib extra necessária.
  return crypto.randomUUID();
}

/**
 * Réplica fiel (mas simplificada, porque o snapshot já vem pré-computado
 * pelo backend — ver AccessSnapshotService) da árvore de decisão de
 * TicketService.validateTicket: bloqueado → já usado → válido. Marca o
 * índice local como usado IMEDIATAMENTE após aceitar, o que já garante
 * idempotência no próprio aparelho: escanear o mesmo QR duas vezes no
 * MESMO dispositivo é pego aqui, antes de gerar um segundo evento — nunca
 * depende da sincronização para isso.
 */
export async function validateOffline(eventId: number, code: string): Promise<OfflineValidationResult> {
  const snapshot = await getSnapshot(eventId);
  if (!snapshot) {
    return { outcome: "REJECTED_UNKNOWN_CODE", message: "Nenhum snapshot offline preparado para este evento ainda." };
  }

  const status = snapshot.ticketIndex[code];
  const scannedAt = new Date().toISOString();
  const idempotencyKey = uuid();

  if (status === undefined) {
    await logEntry(eventId, code, "REJECTED_UNKNOWN_CODE", scannedAt, idempotencyKey);
    return {
      outcome: "REJECTED_UNKNOWN_CODE",
      message: "Código não encontrado no snapshot offline — pode ser inválido, ou o snapshot está desatualizado.",
    };
  }

  if (status === 3) {
    await logEntry(eventId, code, "REJECTED_BLOCKED", scannedAt, idempotencyKey);
    return { outcome: "REJECTED_BLOCKED", message: "Este ingresso está bloqueado." };
  }

  if (status === 4) {
    await logEntry(eventId, code, "REJECTED_IN_RESALE", scannedAt, idempotencyKey);
    return { outcome: "REJECTED_IN_RESALE", message: "Este ingresso está anunciado para revenda." };
  }

  if (status === 2) {
    await logEntry(eventId, code, "REJECTED_ALREADY_USED", scannedAt, idempotencyKey);
    return { outcome: "REJECTED_ALREADY_USED", message: "Este ingresso já foi utilizado." };
  }

  // status === 1 — válido. Aceita localmente e marca o índice como usado
  // ANTES de qualquer sincronização, para idempotência local imediata —
  // escanear o mesmo QR de novo no MESMO dispositivo já é pego na consulta
  // acima (status===2), sem depender de sync com o backend para isso.
  const mutatedSnapshot: StoredSnapshot = { ...snapshot, ticketIndex: { ...snapshot.ticketIndex, [code]: 2 } };
  await saveSnapshot(mutatedSnapshot);
  await logEntry(eventId, code, "ACCEPTED", scannedAt, idempotencyKey);
  return { outcome: "ACCEPTED", message: "Ingresso válido — entrada liberada." };
}

async function logEntry(eventId: number, code: string, outcome: CheckinOutcome, scannedAt: string, idempotencyKey: string): Promise<void> {
  const entry: CheckinLogEntry = { idempotencyKey, eventId, code, outcome, scannedAt, synced: 0 };
  await appendCheckinLog(entry);
}
