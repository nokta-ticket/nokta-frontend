import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  // postcss.config.mjs usa a forma de string ("@tailwindcss/postcss"), que o
  // Next aceita mas o Vite/Vitest não sabe resolver ("Invalid PostCSS
  // Plugin") — qualquer teste que importe um componente com CSS próprio
  // (ex.: institucional/page.test.tsx) quebrava no transform. Nos testes,
  // CSS não precisa ser processado de verdade: plugins vazios aqui fazem o
  // Vitest ignorar o postcss.config.mjs do projeto.
  css: { postcss: { plugins: [] } },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
