"use client";

import { useState } from "react";

export interface CepLookupResult {
  street: string;
  neighborhood: string;
  city: string;
  state: string;
}

/** Busca de endereço por CEP via ViaCEP — mesmo padrão usado em outras telas do dashboard (ex.: SectionInformacoes.tsx), sem wrapper compartilhado ainda. */
export function useCepLookup() {
  const [loading, setLoading] = useState(false);

  async function lookup(cep: string): Promise<CepLookupResult | null> {
    const digits = cep.replace(/\D/g, "");
    if (digits.length !== 8) return null;

    setLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (data.erro) return null;
      return {
        street: data.logradouro ?? "",
        neighborhood: data.bairro ?? "",
        city: data.localidade ?? "",
        state: data.uf ?? "",
      };
    } catch {
      return null;
    } finally {
      setLoading(false);
    }
  }

  return { lookup, loading };
}
