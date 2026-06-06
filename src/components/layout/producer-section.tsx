import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function ProducerSection() {
  return (
    <section className="w-full mt-16">
      {/* Subtle warm tint — differentiates section without harsh divider */}
      <div className="bg-[#ECEAE7] py-16 sm:py-20">
        <div className="max-w-[680px] mx-auto px-4 sm:px-6 text-center">

          <p className="text-[11px] font-semibold tracking-[0.16em] uppercase text-[#7C3AED]/65 mb-4">
            Para produtores
          </p>

          <h2 className="text-[28px] sm:text-[34px] font-bold tracking-[-0.4px] leading-[1.18] text-gray-950 mb-5">
            A plataforma de quem<br />leva cultura a sério.
          </h2>

          <p className="text-[14.5px] text-gray-500 leading-relaxed mb-9 max-w-[420px] mx-auto">
            Venda ingressos, gerencie entradas e construa audiência — sem taxas ocultas e sem burocracia.
          </p>

          <div className="flex items-center justify-center gap-5">
            <Link
              href="/register?ctx=produtor"
              className="group inline-flex items-center gap-2 h-11 px-6 rounded-xl bg-[#7C3AED] text-[13.5px] font-semibold text-white transition-all hover:bg-[#6D28D9] hover:shadow-[0_4px_20px_rgba(124,58,237,0.30)] active:scale-[0.98]"
            >
              Criar conta gratuita
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/para-produtores"
              className="text-[13.5px] font-medium text-gray-500 transition-colors hover:text-gray-900 underline-offset-3 hover:underline"
            >
              Saiba mais
            </Link>
          </div>

        </div>
      </div>
    </section>
  );
}
