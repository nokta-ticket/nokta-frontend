import api from "@/lib/axios";
import { getApiBaseUrl } from "@/lib/surfaces";

/**
 * Notificações no celular (Web Push). No app Android da Nokta Tickets (TWA)
 * o pedido de permissão vira o pedido do próprio app e a notificação aparece
 * com o nome e o ícone dele. Fora do app, funciona no Chrome/Edge/Firefox e
 * no iPhone só com o site na tela de início.
 *
 * O service worker é `public/sw.js` (só notificações, sem cache).
 */

const ENDPOINT_KEY = "nk_push_endpoint";

export type PushSupport = "supported" | "unsupported" | "ios-needs-install";

export function pushSupport(): PushSupport {
  if (typeof window === "undefined") return "unsupported";
  const hasApis = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
  if (hasApis) return "supported";
  // iPhone: Web Push só existe com o site adicionado à tela de início.
  if (/iPad|iPhone|iPod/.test(navigator.userAgent)) return "ios-needs-install";
  return "unsupported";
}

export function pushPermission(): NotificationPermission | "unsupported" {
  return pushSupport() === "supported" ? Notification.permission : "unsupported";
}

function base64UrlToUint8Array(base64: string): Uint8Array {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(padded);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

async function registration(): Promise<ServiceWorkerRegistration> {
  const swUrl = `/sw.js?api=${encodeURIComponent(getApiBaseUrl())}`;
  const existing = await navigator.serviceWorker.getRegistration("/");
  if (existing?.active?.scriptURL.includes("/sw.js?api=")) return existing;
  await navigator.serviceWorker.register(swUrl, { scope: "/" });
  return navigator.serviceWorker.ready;
}

async function publicKey(): Promise<string | null> {
  const { data } = await api.get<{ publicKey: string | null }>("/push/public-key");
  return data.publicKey;
}

function rememberEndpoint(endpoint: string | null) {
  try {
    if (endpoint) localStorage.setItem(ENDPOINT_KEY, endpoint);
    else localStorage.removeItem(ENDPOINT_KEY);
  } catch {
    /* navegador sem armazenamento: só perde a remoção no logout */
  }
}

/**
 * Inscreve este aparelho para a conta logada. Com `ask`, pede a permissão
 * (só chame a partir de um toque da pessoa). Devolve o estado final.
 */
export async function enablePush({ ask }: { ask: boolean }): Promise<"enabled" | "denied" | "unavailable"> {
  if (pushSupport() !== "supported") return "unavailable";
  let permission = Notification.permission;
  if (permission === "default" && ask) permission = await Notification.requestPermission();
  if (permission !== "granted") return permission === "denied" ? "denied" : "unavailable";

  const key = await publicKey().catch(() => null);
  if (!key) return "unavailable";
  const reg = await registration();
  let subscription = await reg.pushManager.getSubscription();
  // Chave do servidor trocou: a inscrição antiga não recebe mais nada.
  const currentKey = subscription?.options.applicationServerKey;
  if (subscription && currentKey && btoa(String.fromCharCode(...new Uint8Array(currentKey))).replace(/=+$/, "") !== btoa(String.fromCharCode(...base64UrlToUint8Array(key))).replace(/=+$/, "")) {
    await subscription.unsubscribe().catch(() => undefined);
    subscription = null;
  }
  if (!subscription) {
    subscription = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: base64UrlToUint8Array(key) as BufferSource });
  }
  const json = subscription.toJSON();
  await api.post("/push/subscriptions", { endpoint: json.endpoint, keys: json.keys });
  rememberEndpoint(json.endpoint ?? null);
  return "enabled";
}

/** Tira este aparelho da conta (logout). Não mexe na permissão do navegador. */
export async function detachPushFromAccount(): Promise<void> {
  let endpoint: string | null = null;
  try {
    endpoint = localStorage.getItem(ENDPOINT_KEY);
  } catch {
    endpoint = null;
  }
  if (!endpoint) return;
  rememberEndpoint(null);
  await api.post("/push/subscriptions/remove", { endpoint }).catch(() => undefined);
}

export interface PushPreferences {
  available: boolean;
  marketing: boolean;
  hasDevice: boolean;
}

export async function getPushPreferences(): Promise<PushPreferences> {
  const { data } = await api.get<PushPreferences>("/push/preferences");
  return data;
}

export async function setPushMarketing(marketing: boolean): Promise<void> {
  await api.put("/push/preferences", { marketing });
}
