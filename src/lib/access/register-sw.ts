/**
 * Registra o service worker do Nokta Access com escopo restrito a
 * /dashboard/check-in/ — nunca deve ser chamado fora dessa página. O
 * `scope` explícito garante que o navegador rejeita registrar caso algo
 * mude e este código seja chamado de outro lugar por engano (browsers
 * recusam um SW cujo escopo não contém o caminho do próprio arquivo, mas o
 * scope aqui é adicionalmente restrito para nunca abranger o site inteiro).
 */
export async function registerAccessServiceWorker(): Promise<void> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  try {
    await navigator.serviceWorker.register("/access-sw.js", { scope: "/dashboard/check-in/" });
  } catch {
    // Falha de registro nunca deve quebrar a tela — o app funciona sem SW
    // (só perde o cache do app shell para reload 100% offline); a
    // validação local via IndexedDB continua funcionando de qualquer jeito.
  }
}
