/**
 * Confete de sucesso nas cores do tema. Lê os tokens direto do CSS
 * (`--brand`, `--success`…) — nada de hex aqui — e carrega o canvas-confetti
 * só quando precisa. Respeita `prefers-reduced-motion`.
 */
export async function fireBrandConfetti(): Promise<void> {
  if (typeof window === "undefined") return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

  const { default: confetti } = await import("canvas-confetti");
  const css = getComputedStyle(document.documentElement);
  const token = (name: string) => css.getPropertyValue(name).trim();
  const colors = [token("--brand"), token("--brand-from"), token("--success"), token("--foreground")].filter(Boolean);

  const fire = (ratio: number, opts: Parameters<typeof confetti>[0]) => confetti({ origin: { y: 0.6 }, particleCount: Math.floor(200 * ratio), colors, ...opts });
  fire(0.25, { spread: 26, startVelocity: 55 });
  fire(0.2, { spread: 60 });
  fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
  fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
  fire(0.1, { spread: 120, startVelocity: 45 });
}
