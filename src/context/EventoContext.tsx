"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { toast } from "@/lib/toast";
import { usePathname, useRouter } from "next/navigation";
import api from "@/lib/axios";
import { AxiosError } from "axios";

type TipoContato = 0 | 1 | 2;
type TipoIngresso = 0 | 1 | 2 | 3 | 4;

export interface IngressoLote {
  id?: number;
  tipo: TipoIngresso;
  nome: string;
  lote: number;
  quantidade: number;
  valor: number;
  dataLimite: string;
  disponivelParaVenda: boolean;
  sold?: number;
}

interface Thumbnail {
  url: string;
}

interface EventoPayload {
  id?: number;
  nome: string;
  descricao: string;
  data: string;
  horario: string;
  local: string;
  atracoes: string;
  programacao: string;
  politicaMeiaEntrada: string;
  politicaCancelamento: string;
  classificacaoEtaria: string;
  tipoContato: TipoContato;
  contatoSuporte: string;
  tipoIngresso: 0 | 1;
  ingressos: IngressoLote[];
  endereco: {
    cep: string;
    numero: string;
    logradouro: string;
    bairro: string;
    localidade: string;
    uf: string;
  };
  whatsapp: string;
  email: string;
  instagram: string;
}

interface CriarEventoContextType {
  data: EventoPayload;
  setData: (d: Partial<EventoPayload>) => void;
  lotes: IngressoLote[];
  setLotes: (l: IngressoLote[]) => void;
  thumbnails: string[];
  setThumbnails: (f: string[]) => void;
  submit: () => Promise<void>;
}

const EventoContext = createContext<CriarEventoContextType | null>(null);

const initialData: EventoPayload = {
  nome: "",
  descricao: "",
  data: "",
  horario: "",
  local: "",
  atracoes: "",
  programacao: "",
  politicaMeiaEntrada: "",
  politicaCancelamento: "",
  classificacaoEtaria: "",
  tipoContato: 0,
  contatoSuporte: "",
  tipoIngresso: 1,
  ingressos: [],
  whatsapp: "",
  email: "",
  instagram: "",
  endereco: {
    cep: "",
    numero: "",
    logradouro: "",
    bairro: "",
    localidade: "",
    uf: "",
  },
};

export function EventoProvider({ children }: { children: React.ReactNode }) {
  const [data, setDataRaw] = useState<EventoPayload>(initialData);
  const [lotes, setLotes] = useState<IngressoLote[]>([]);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname.startsWith("/produtor/eventos/editar"))
      setDataRaw(initialData);
  }, [pathname]);

  const setData = (d: Partial<EventoPayload>) => {
    setDataRaw((prev) => {
      const next = { ...prev, ...d };
      const same = JSON.stringify(prev) === JSON.stringify(next);
      return same ? prev : next;
    });
  };

  const submit = async () => {
    try {
      const body = {
        nome: data.nome,
        descricao: data.descricao,
        data: data.data,
        horario: data.horario,
        atracoes: data.atracoes,
        programacao: data.programacao,
        politicaMeiaEntrada: data.politicaMeiaEntrada,
        politicaCancelamento: data.politicaCancelamento,
        classificacaoEtaria: data.classificacaoEtaria,
        email: data.email,
        whatsapp: data.whatsapp,
        instagram: data.instagram,
        endereco: data.endereco,
        thumbnails,
        ingressos: lotes.map((element) => ({
          ...(element.id ? { id: element.id } : {}),
          nome: element.nome,
          lote: element.lote,
          quantidade: Number(element.quantidade),
          valor: Number(element.valor),
          tipo: Number(element.tipo),
          dataLimite: element.dataLimite,
          disponivelParaVenda: element.disponivelParaVenda,
        })),
      };

      if (data.id) {
        const res = await api.put("/produtor/eventos/" + data.id, body);
        toast.success("Evento editado com sucesso!");
      } else {
        const res = await api.post("/produtor/eventos", body);
        toast.success("Evento criado com sucesso!");
      }

      router.push("/produtor/eventos");
    } catch (err: any) {
      console.error(err);
      if (err instanceof AxiosError) {
        const msg = err.response?.data?.message;
        const text = Array.isArray(msg) ? msg[0] : (msg || "Erro ao salvar evento.");
        toast.error(text);
      } else {
        toast.error(err.message || "Erro ao criar evento.");
      }
    }
  };

  return (
    <EventoContext.Provider
      value={{
        data,
        setData,
        lotes,
        setLotes,
        thumbnails,
        setThumbnails,
        submit,
      }}
    >
      {children}
    </EventoContext.Provider>
  );
}

export const useEvento = () => {
  const ctx = useContext(EventoContext);
  if (!ctx) throw new Error("useEvento must be inside provider");
  return ctx;
};
