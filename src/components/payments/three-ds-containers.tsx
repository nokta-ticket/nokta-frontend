/**
 * Containers que o SDK 3DS da Stone preenche durante a autenticação do
 * cartão: o "method" (iframe invisível) e o desafio (iframe do banco).
 * Precisam existir no DOM quando `TDS.init` roda. O desafio cobre a tela
 * acima de qualquer diálogo (z-[80] > z-[70] do Dialog/Sheet).
 */
export function ThreeDsContainers() {
  return (
    <>
      <div id="tdsMethodContainer" className="hidden" />
      <div id="challengeContainer" className="pointer-events-none fixed inset-0 z-[80] flex items-center justify-center [&:not(:empty)]:pointer-events-auto [&:not(:empty)]:bg-black/60 [&:not(:empty)]:backdrop-blur-sm" />
    </>
  );
}
