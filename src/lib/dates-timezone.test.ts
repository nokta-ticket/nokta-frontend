import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";
import { formatInstantDateBR, formatInstantTimeBR, todayInBrasilia, weekdayInBrasilia } from "./format";

/**
 * Datas sempre no horário de Brasília (regras em `format.ts`). O servidor da
 * Vercel roda em UTC e parte dos clientes pode estar com o celular em outro
 * fuso: data de instante formatada sem `timeZone`, ou "hoje" tirado de
 * `toISOString()`, mostra o dia errado depois das 21h.
 */
const SRC = join(__dirname, "..");

// Datas montadas a partir de dia/mês/ano locais (sem instante envolvido).
const ALLOWED = new Set(["lib/formatarData.ts", "components/marketing/content.tsx"]);

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return name === "mocks" ? [] : sourceFiles(full);
    return /\.(ts|tsx)$/.test(name) && !/\.test\.tsx?$/.test(name) ? [full] : [];
  });
}

/** Trecho da chamada até o primeiro ")" (as opções de data não têm parênteses). */
function callsWithoutTimeZone(text: string, pattern: RegExp, isDate: (call: string) => boolean): string[] {
  const out: string[] = [];
  for (const m of text.matchAll(pattern)) {
    const start = m.index ?? 0;
    const end = text.indexOf(")", start + m[0].length);
    const call = text.slice(start, end === -1 ? start + 200 : end + 1);
    if (isDate(call) && !call.includes("timeZone")) out.push(call.replace(/\s+/g, " ").slice(0, 120));
  }
  return out;
}

describe("datas no horário de Brasília", () => {
  it("nenhuma data é formatada sem timeZone nem 'hoje' sai de toISOString", () => {
    const problems: string[] = [];
    for (const file of sourceFiles(SRC)) {
      const rel = relative(SRC, file).split(sep).join("/");
      if (ALLOWED.has(rel)) continue;
      const text = readFileSync(file, "utf-8");
      const found = [
        ...callsWithoutTimeZone(text, /\.toLocale(Date|Time)String\(/g, () => true),
        ...callsWithoutTimeZone(text, /\.toLocaleString\(\s*["']pt-BR["']\s*,\s*\{/g, (c) => /\b(day|month|year|hour|minute|weekday)\s*:/.test(c)),
        ...callsWithoutTimeZone(text, /new Intl\.DateTimeFormat\(/g, () => true),
        ...[...text.matchAll(/new Date\(\)\.toISOString\(\)\.(slice\(0,\s*10\)|split\(["']T["']\))/g)].map((m) => m[0]),
      ];
      problems.push(...found.map((f) => `${rel}: ${f}`));
    }
    expect(problems).toEqual([]);
  });

  it("depois das 21h de Brasília, ainda é o mesmo dia", () => {
    const lateNight = new Date("2026-10-16T01:30:00.000Z"); // 15/10 às 22:30 em Brasília
    expect(todayInBrasilia(lateNight)).toBe("2026-10-15");
    expect(weekdayInBrasilia(lateNight)).toBe(4); // quinta-feira
    expect(formatInstantDateBR(lateNight.toISOString())).toBe("15/10/2026");
    expect(formatInstantTimeBR(lateNight.toISOString())).toBe("22:30");
  });
});
