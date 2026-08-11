import Link from "next/link";
import { Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Estado vazio real da home pública (0 eventos elegíveis) — nunca mock,
 * skeleton, banner temporário ou carrossel/seção vazia. Ocupa o espaço
 * entre header e footer (flex-1, ver comentário em EventGrid) e fica
 * centralizado nele, tanto em telas grandes quanto pequenas — o próprio
 * <main flex flex-1 flex-col> do layout raiz já empurra o footer pro fim
 * da viewport quando o conteúdo é curto, então nada aqui precisa forçar
 * altura de tela cheia.
 */
export default function EmptyEventsState() {
  return (
    <section className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-50">
        <Ticket className="h-6 w-6 text-violet-600" strokeWidth={1.75} />
      </div>

      <h1 className="mt-5 text-[19px] font-bold text-[#181d27]">
        Novos eventos em breve
      </h1>
      <p className="mt-2 max-w-[280px] text-[14px] leading-relaxed text-[#535862]">
        No momento não temos eventos disponíveis. Fique de olho — novidades estão chegando.
      </p>

      <div className="mt-8 flex flex-col items-center gap-2">
        <p className="text-[13px] text-[#717680]">Você produz eventos?</p>
        <Button asChild className="bg-violet-600 px-6 text-white hover:bg-violet-700">
          <Link href="/para-produtores">Vender pela Nokta</Link>
        </Button>
      </div>
    </section>
  );
}
