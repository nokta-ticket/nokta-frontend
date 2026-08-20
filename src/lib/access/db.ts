import { openDB, DBSchema, IDBPDatabase } from "idb";

/**
 * IndexedDB do scanner do Nokta Access — a primeira infraestrutura offline
 * real do projeto (antes disso: sem PWA, sem IndexedDB em uso, sem cache
 * de rede; `public/sw.js` era só um anti-service-worker que se
 * desregistrava). Um banco por dispositivo (não por evento), permitindo
 * múltiplos eventos preparados no mesmo aparelho.
 */

export type CompactStatus = 1 | 2 | 3 | 4; // 1=válido, 2=já usado, 3=bloqueado, 4=em revenda

export interface StoredSnapshot {
  eventId: number;
  version: number;
  isFreezeFinal: boolean;
  downloadedAt: string;
  ticketIndex: Record<string, CompactStatus>; // code -> status compacto
}

export type CheckinOutcome =
  | "ACCEPTED"
  | "REJECTED_ALREADY_USED"
  | "REJECTED_BLOCKED"
  | "REJECTED_UNKNOWN_CODE"
  | "REJECTED_IN_RESALE"
  | "CONFLICT_LOST";

export interface CheckinLogEntry {
  idempotencyKey: string;
  eventId: number;
  code: string;
  outcome: CheckinOutcome;
  scannedAt: string; // ISO
  synced: 0 | 1; // IndexedDB não indexa boolean de forma portátil — 0/1
  syncedAt?: string;
  serverOutcome?: CheckinOutcome;
}

export interface DeviceConfig {
  key: "self";
  deviceId: number;
  deviceToken: string;
  label: string;
  eventId: number;
  pairedHubUrl?: string | null;
}

interface NoktaAccessDB extends DBSchema {
  snapshots: {
    key: number; // eventId
    value: StoredSnapshot;
  };
  checkinLog: {
    key: string; // idempotencyKey
    value: CheckinLogEntry;
    indexes: { "by-event-synced": [number, number]; "by-event-scannedAt": [number, string] };
  };
  deviceConfig: {
    key: string; // "self"
    value: DeviceConfig;
  };
}

const DB_NAME = "nokta-access";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<NoktaAccessDB>> | null = null;

export function getAccessDb(): Promise<IDBPDatabase<NoktaAccessDB>> {
  if (!dbPromise) {
    dbPromise = openDB<NoktaAccessDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        db.createObjectStore("snapshots", { keyPath: "eventId" });

        const checkinStore = db.createObjectStore("checkinLog", { keyPath: "idempotencyKey" });
        checkinStore.createIndex("by-event-synced", ["eventId", "synced"]);
        checkinStore.createIndex("by-event-scannedAt", ["eventId", "scannedAt"]);

        db.createObjectStore("deviceConfig", { keyPath: "key" });
      },
    });
  }
  return dbPromise;
}

export async function saveSnapshot(snapshot: StoredSnapshot): Promise<void> {
  const db = await getAccessDb();
  await db.put("snapshots", snapshot);
}

export async function getSnapshot(eventId: number): Promise<StoredSnapshot | undefined> {
  const db = await getAccessDb();
  return db.get("snapshots", eventId);
}

export async function saveDeviceConfig(config: DeviceConfig): Promise<void> {
  const db = await getAccessDb();
  await db.put("deviceConfig", config);
}

export async function getDeviceConfig(): Promise<DeviceConfig | undefined> {
  const db = await getAccessDb();
  return db.get("deviceConfig", "self");
}

export async function appendCheckinLog(entry: CheckinLogEntry): Promise<void> {
  const db = await getAccessDb();
  await db.put("checkinLog", entry);
}

export async function getPendingCheckins(eventId: number): Promise<CheckinLogEntry[]> {
  const db = await getAccessDb();
  return db.getAllFromIndex("checkinLog", "by-event-synced", [eventId, 0]);
}

export async function markCheckinsSynced(entries: { idempotencyKey: string; serverOutcome: CheckinOutcome }[]): Promise<void> {
  const db = await getAccessDb();
  const tx = db.transaction("checkinLog", "readwrite");
  for (const { idempotencyKey, serverOutcome } of entries) {
    const existing = await tx.store.get(idempotencyKey);
    if (!existing) continue;
    await tx.store.put({ ...existing, synced: 1, syncedAt: new Date().toISOString(), serverOutcome });
  }
  await tx.done;
}

export async function getSessionCheckins(eventId: number, limit = 50): Promise<CheckinLogEntry[]> {
  const db = await getAccessDb();
  const all = await db.getAllFromIndex("checkinLog", "by-event-scannedAt", IDBKeyRange.bound([eventId, ""], [eventId, "￿"]));
  return all.reverse().slice(0, limit);
}
