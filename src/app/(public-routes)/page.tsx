import type { Metadata } from "next";
import { getAgenda } from "@/lib/agenda";
import { HomeClient } from "./_home/home-client";

export const metadata: Metadata = {
  title: "Nokta Tickets — os melhores eventos e festas",
  description: "Encontre os melhores rolês, compre ingressos com segurança e revenda quando não puder ir.",
};

// A agenda (eventos de outras plataformas) vem do servidor e é refeita a cada hora.
export const revalidate = 3600;

export default async function Home() {
  // Só os próximos: o retrato completo da agenda não vai pro navegador.
  const agenda = (await getAgenda()).slice(0, 12);
  return (
    <>
      <h1 className="sr-only">Nokta Tickets: ingressos para os melhores eventos</h1>
      <HomeClient agenda={agenda} />
    </>
  );
}
