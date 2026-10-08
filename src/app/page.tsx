import EventGrid from "@/components/layout/event-grid";
import Hero from "@/components/layout/hero";

export default function Home() {
  return (
    <>
    <h1 className="sr-only">Nokta Tickets: ingressos para os melhores eventos</h1>
    <Hero/>
    <EventGrid/>
    </>
  );
}
