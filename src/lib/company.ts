/**
 * Dados cadastrais da empresa (Receita Federal, CNPJ 59.386.582/0001-39,
 * consultado em 2026-10-14). Fonte única pra rodapé, páginas legais,
 * institucional e e-mails — nunca repetir esses valores em outro lugar.
 * Sócios não são expostos na interface de propósito (dado pessoal).
 */
export const COMPANY = {
  brand: "Nokta",
  tradeName: "Nokta Tickets",
  legalName: "Nokta Tecnologia Ltda.",
  cnpj: "59.386.582/0001-39",
  cnpjDigits: "59386582000139",
  foundedYear: 2025,
  address: {
    street: "Av. Paulista",
    number: "1471",
    complement: "Conj. 1110",
    district: "Bela Vista",
    city: "São Paulo",
    state: "SP",
    zip: "01311-927",
  },
  /** "Av. Paulista, 1471, Conj. 1110 – Bela Vista, São Paulo/SP, CEP 01311-927" */
  addressLine: "Av. Paulista, 1471, Conj. 1110 – Bela Vista, São Paulo/SP, CEP 01311-927",
  phone: { display: "(11) 1331-3212", e164: "+551113313212" },
  emails: {
    support: "suporte@noktatickets.com.br",
  },
  sites: {
    tickets: "https://www.noktatickets.com.br",
    platform: "https://app.nokta.live",
    marketing: "https://www.nokta.live",
  },
  // TODO(user): confirmar handles reais das redes sociais.
  social: {
    instagram: "https://instagram.com/noktatickets",
    whatsapp: "https://wa.me/551113313212",
  },
  /** Atividade econômica principal + secundárias (CNAE), em linguagem de gente. */
  activities: ["Intermediação e agenciamento de serviços e negócios", "Desenvolvimento e licenciamento de software", "Promoção de vendas e marketing direto", "Serviços de reservas"],
} as const;

/** Linha legal do rodapé. */
export const LEGAL_LINE = `${COMPANY.legalName} · CNPJ ${COMPANY.cnpj} · ${COMPANY.addressLine}`;
