import { describe, expect, it } from "vitest";
import { formatPhone, validatePhone } from "./phone-input";

// Regressão: o autofill do celular inseria o número com o código do país e a
// máscara BR transformava +55 11 99999-8888 em +5555119999988 (outro número
// válido, DDD 55), burlando a checagem de telefone duplicado no cadastro.
const e164 = (value: string) => `+55${formatPhone(value, "BR").replace(/\D/g, "")}`;

describe("formatPhone (BR)", () => {
  it("digitado à mão continua igual", () => {
    expect(formatPhone("11999998888", "BR")).toBe("(11) 99999-8888");
    expect(e164("11999998888")).toBe("+5511999998888");
  });

  it("autofill do celular com +55 não gera outro número", () => {
    expect(formatPhone("+55 11 99999-8888", "BR")).toBe("(11) 99999-8888");
    expect(e164("+55 11 99999-8888")).toBe("+5511999998888");
  });

  it("autofill com 55 sem o sinal de +", () => {
    expect(e164("5511999998888")).toBe("+5511999998888");
  });

  it("remove o 0 de discagem antes do DDD", () => {
    expect(e164("011999998888")).toBe("+5511999998888");
    expect(e164("(011) 3333-4444")).toBe("+551133334444");
  });

  it("não mexe em número real com DDD 55 (RS)", () => {
    expect(e164("55999998888")).toBe("+5555999998888");
    expect(e164("+55 55 99999-8888")).toBe("+5555999998888");
  });

  it("digitar dígito a dígito até o fim chega ao número certo", () => {
    let shown = "";
    for (const ch of "5511999998888") shown = formatPhone(shown + ch, "BR");
    expect(shown).toBe("(11) 99999-8888");
    expect(validatePhone(shown, "BR")).toBe(true);
  });

  it("fixo de 10 dígitos continua válido", () => {
    // A máscara BR é de celular; o fixo aparece como "(11) 33334-444" — só visual.
    expect(e164("1133334444")).toBe("+551133334444");
    expect(validatePhone(formatPhone("1133334444", "BR"), "BR")).toBe(true);
  });
});
