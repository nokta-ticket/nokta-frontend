const KEY = "nokta_device_id";

/**
 * Identificador estável do dispositivo (uuid em localStorage) enviado no
 * header `X-Device-Fingerprint` do cadastro/confirmação de telefone — o
 * backend usa pra limitar tentativas por aparelho.
 */
export function getDeviceFingerprint(): string {
  if (typeof window === "undefined") return "ssr";
  try {
    let id = localStorage.getItem(KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return "unavailable";
  }
}

export const DEVICE_FINGERPRINT_HEADER = "X-Device-Fingerprint";
