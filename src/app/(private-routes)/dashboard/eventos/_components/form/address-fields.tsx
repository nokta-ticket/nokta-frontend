"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export interface EnderecoForm {
  cep: string;
  logradouro: string;
  bairro: string;
  localidade: string;
  numero: string;
  uf: string;
}

/** Busca o endereço no ViaCEP e devolve só os campos que ele preenche. */
export function useCepLookup() {
  const [loading, setLoading] = useState(false);

  const buscar = async (rawCep: string): Promise<Partial<EnderecoForm> | null> => {
    const cep = rawCep.replace(/\D/g, "");
    if (cep.length < 8) {
      toast.error("Digite o CEP completo (8 números).");
      return null;
    }
    setLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();
      if (data.erro) {
        toast.error("CEP não encontrado. Confere os números?");
        return null;
      }
      return { logradouro: data.logradouro || "", bairro: data.bairro || "", localidade: data.localidade || "", uf: data.uf || "" };
    } catch {
      toast.error("Não deu pra buscar o endereço agora. Tenta de novo.");
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { buscar, loading };
}

/**
 * CEP + endereço (preenchido pelo CEP, só o número é editável). Usado no
 * wizard de criação e na seção Informações do editor.
 */
export function AddressFields({ value, onChange, idPrefix = "end" }: { value: EnderecoForm; onChange: (patch: Partial<EnderecoForm>) => void; idPrefix?: string }) {
  const { buscar, loading } = useCepLookup();
  const hasAddress = Boolean(value.logradouro);

  const handleBuscar = async () => {
    const found = await buscar(value.cep);
    if (found) onChange(found);
  };

  return (
    <div className="space-y-4">
      <Field label="CEP" htmlFor={`${idPrefix}-cep`} required hint="Digite o CEP e busque: rua, bairro e cidade vêm sozinhos.">
        <div className="flex gap-2">
          <Input
            id={`${idPrefix}-cep`}
            placeholder="00000-000"
            inputMode="numeric"
            maxLength={9}
            value={value.cep}
            onChange={(e) => onChange({ cep: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void handleBuscar();
              }
            }}
            className="max-w-[180px]"
          />
          <Button type="button" variant="outline" leftIcon="search" loading={loading} onClick={handleBuscar} className="h-11 md:h-10">
            Buscar CEP
          </Button>
        </div>
      </Field>

      <div className={cn("transition-opacity duration-300", hasAddress ? "opacity-100" : "opacity-50")}>
        <FieldGroup columns={2}>
          <Field label="Rua" htmlFor={`${idPrefix}-rua`} className="sm:col-span-2">
            <Input id={`${idPrefix}-rua`} value={value.logradouro} readOnly placeholder="Preenchido pelo CEP" />
          </Field>
          <Field label="Número" htmlFor={`${idPrefix}-numero`} required>
            <Input id={`${idPrefix}-numero`} placeholder="Ex.: 123" value={value.numero} onChange={(e) => onChange({ numero: e.target.value })} />
          </Field>
          <Field label="Bairro" htmlFor={`${idPrefix}-bairro`}>
            <Input id={`${idPrefix}-bairro`} value={value.bairro} readOnly placeholder="Preenchido pelo CEP" />
          </Field>
          <Field label="Cidade" htmlFor={`${idPrefix}-cidade`}>
            <Input id={`${idPrefix}-cidade`} value={value.localidade} readOnly placeholder="Preenchido pelo CEP" />
          </Field>
          <Field label="Estado" htmlFor={`${idPrefix}-uf`}>
            <Input id={`${idPrefix}-uf`} value={value.uf} readOnly placeholder="UF" />
          </Field>
        </FieldGroup>
      </div>
    </div>
  );
}
