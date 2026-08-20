import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// next/font só funciona pelo compilador do Next — no Vitest, qualquer
// import de fonte (ex.: Instrument_Sans na LP institucional) viraria
// "is not a function". Proxy genérico: qualquer fonte importada devolve um
// objeto com o shape esperado, sem depender de listar cada fonte usada.
// jsdom não implementa matchMedia nem IntersectionObserver — componentes com
// efeitos de scroll/motion (ex.: scroll-effects.tsx da LP institucional)
// quebrariam ao montar. Stubs mínimos, só o shape que os efeitos consultam.
if (typeof window !== "undefined") {
  if (!window.matchMedia) {
    window.matchMedia = ((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    })) as typeof window.matchMedia;
  }
  if (!("IntersectionObserver" in window)) {
    class FakeIntersectionObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() { return []; }
    }
    // @ts-expect-error — stub de teste
    window.IntersectionObserver = FakeIntersectionObserver;
    // @ts-expect-error — stub de teste
    globalThis.IntersectionObserver = FakeIntersectionObserver;
  }
}

vi.mock("next/font/google", () => {
  const fakeFont = () => ({ className: "font-mock", style: { fontFamily: "font-mock" }, variable: "--font-mock" });
  // O interop de módulo do Vitest exige exports NOMEADOS reais (Proxy com
  // trap `get`/`has` não passa na checagem "No export is defined") — listar
  // aqui cada fonte que o código importa de next/font/google.
  return {
    Poppins: fakeFont,
    Space_Grotesk: fakeFont,
    Instrument_Sans: fakeFont,
    Geist_Mono: fakeFont,
    Bricolage_Grotesque: fakeFont,
    Caveat: fakeFont,
  };
});
