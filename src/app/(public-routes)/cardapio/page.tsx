import { EmptyState } from "@/components/ui/empty-state";

/** nokta.live/cardapio sem slug (link quebrado, erro de digitação). */
export default function CardapioRaizPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-6 py-16">
      <EmptyState icon="qr" title="Cardápio Nokta" description="Acesse pelo link ou pelo QR code do estabelecimento que você quer visitar." className="w-full max-w-md" />
    </main>
  );
}
