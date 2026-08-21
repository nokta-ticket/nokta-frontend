import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { gzipSync } from "node:zlib";
import { createHash } from "node:crypto";

/**
 * Achado da auditoria de conectividade Hub (2026-08-20): downloadAndVerifySnapshot()
 * existia em sync.ts mas nunca era chamado em nenhuma tela — sem ele, o modo
 * offline nunca funcionava, mesmo com um único celular sem Hub nenhum. Este
 * teste cobre o caminho INTEIRO ponta a ponta, real, sem mockar nenhuma
 * camada do próprio código sob teste:
 *
 *   Cloud (fetch simulado com gzip real de verdade)
 *     -> downloadAndVerifySnapshot() (hash real via crypto.subtle,
 *        descompressão real via DecompressionStream)
 *     -> IndexedDB real (fake-indexeddb, não um mock de saveSnapshot/getSnapshot)
 *     -> "internet cai" (fetch passa a rejeitar)
 *     -> validateOffline() lê o snapshot do IndexedDB e decide sem rede
 *
 * Só o `fetch` global é mockado — é a única borda de rede real do sistema.
 */

const EVENT_ID = 777;
const VALID_CODE = "AAAA-BBBB-CCCC";
const USED_CODE = "DDDD-EEEE-FFFF";
const BLOCKED_CODE = "GGGG-HHHH-IIII";

function buildSnapshotResponse() {
  const file = {
    eventId: EVENT_ID,
    version: 1,
    isFreezeFinal: false,
    tickets: [
      { c: VALID_CODE, s: 1, t: 10 },
      { c: USED_CODE, s: 2, t: 10 },
      { c: BLOCKED_CODE, s: 3, t: 10 },
    ],
  };
  const gzipped = gzipSync(Buffer.from(JSON.stringify(file), "utf8"));
  const contentHash = createHash("sha256").update(gzipped).digest("hex");
  return { gzipped, contentHash };
}

describe("Nokta Access — fluxo offline real, ponta a ponta (Cloud -> IndexedDB -> validação sem rede)", () => {
  beforeEach(async () => {
    // Import dinâmico após "fake-indexeddb/auto" já ter rodado, e módulo
    // fresco a cada teste — dbPromise é module-level singleton em db.ts.
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("baixa o snapshot do Cloud, grava no IndexedDB de verdade, e valida offline sem nenhuma chamada de rede", async () => {
    const { gzipped, contentHash } = buildSnapshotResponse();

    const fetchSpy = vi.fn(async (url: string) => {
      expect(url).toContain("/access/devices/me/snapshot");
      return new Response(gzipped, {
        status: 200,
        headers: { "X-Access-Snapshot-Content-Hash": contentHash },
      });
    });
    vi.stubGlobal("fetch", fetchSpy);

    const { downloadAndVerifySnapshot } = await import("./sync");
    const { getSnapshot, saveDeviceConfig } = await import("./db");
    const { validateOffline } = await import("./validate-offline");

    const deviceConfig = {
      key: "self" as const,
      deviceId: 1,
      deviceToken: "test-token",
      label: "Portão A",
      eventId: EVENT_ID,
      pairedHubUrl: null,
    };
    await saveDeviceConfig(deviceConfig);

    // 1) Download real do "Cloud" (fetch mockado) -> grava no IndexedDB real.
    const snapshot = await downloadAndVerifySnapshot(deviceConfig);
    expect(snapshot.eventId).toBe(EVENT_ID);
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    // 2) Confirma que o snapshot está de fato no IndexedDB (não só em memória).
    const persisted = await getSnapshot(EVENT_ID);
    expect(persisted).toBeDefined();
    expect(persisted!.ticketIndex[VALID_CODE]).toBe(1);

    // 3) "Internet cai": qualquer fetch subsequente falha — se validateOffline
    // chamar rede por engano, o teste estoura aqui. Novo spy próprio (não o
    // `fetchSpy` do download, que ficaria com a chamada antiga registrada e
    // faria a asserção final mentir).
    const offlineFetchSpy = vi.fn(async () => {
      throw new Error("rede indisponível — não deveria ser chamada em modo offline");
    });
    vi.stubGlobal("fetch", offlineFetchSpy);

    // 4) Ingresso válido é aceito offline, sem nenhuma chamada de rede.
    const validResult = await validateOffline(EVENT_ID, VALID_CODE);
    expect(validResult.outcome).toBe("ACCEPTED");

    // 5) O MESMO código escaneado de novo no mesmo device já é pego
    // localmente (idempotência local, sem depender de sync com o Cloud).
    const dupResult = await validateOffline(EVENT_ID, VALID_CODE);
    expect(dupResult.outcome).toBe("REJECTED_ALREADY_USED");

    // 6) Ingresso já usado no snapshot original rejeita.
    const usedResult = await validateOffline(EVENT_ID, USED_CODE);
    expect(usedResult.outcome).toBe("REJECTED_ALREADY_USED");

    // 7) Ingresso bloqueado no snapshot rejeita.
    const blockedResult = await validateOffline(EVENT_ID, BLOCKED_CODE);
    expect(blockedResult.outcome).toBe("REJECTED_BLOCKED");

    // 8) Código nunca visto no snapshot rejeita como desconhecido.
    const unknownResult = await validateOffline(EVENT_ID, "ZZZZ-ZZZZ-ZZZZ");
    expect(unknownResult.outcome).toBe("REJECTED_UNKNOWN_CODE");

    expect(offlineFetchSpy).not.toHaveBeenCalled();
  });

  it("sem snapshot baixado ainda, validateOffline rejeita com mensagem clara — nunca finge sucesso", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("não deveria chamar rede");
      }),
    );

    const { validateOffline } = await import("./validate-offline");
    const result = await validateOffline(EVENT_ID + 1, VALID_CODE);
    expect(result.outcome).toBe("REJECTED_UNKNOWN_CODE");
    expect(result.message).toContain("Nenhum snapshot offline preparado");
  });

  it("hash adulterado (download corrompido) é rejeitado antes de gravar no IndexedDB", async () => {
    const { gzipped } = buildSnapshotResponse();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(gzipped, {
          status: 200,
          // Hash errado de propósito — simula download corrompido em trânsito.
          headers: { "X-Access-Snapshot-Content-Hash": "0".repeat(64) },
        }),
      ),
    );

    const { downloadAndVerifySnapshot } = await import("./sync");
    const { getSnapshot } = await import("./db");

    const deviceConfig = {
      key: "self" as const,
      deviceId: 2,
      deviceToken: "test-token-2",
      label: "Portão B",
      eventId: EVENT_ID + 2,
      pairedHubUrl: null,
    };

    await expect(downloadAndVerifySnapshot(deviceConfig)).rejects.toThrow(/não confere/);

    const persisted = await getSnapshot(EVENT_ID + 2);
    expect(persisted).toBeUndefined();
  });
});
