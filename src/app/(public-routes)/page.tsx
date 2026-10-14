import type { Metadata } from "next";
import { HomeClient } from "./_home/home-client";

export const metadata: Metadata = {
  title: "Nokta Tickets — os melhores eventos e festas",
  description: "Encontre os melhores rolês, compre ingressos com segurança e revenda quando não puder ir.",
};

export default function Home() {
  return (
    <>
      <h1 className="sr-only">Nokta Tickets: ingressos para os melhores eventos</h1>
      <HomeClient />
    </>
  );
}
