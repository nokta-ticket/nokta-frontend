import { UtensilsCrossed } from "lucide-react";

/**
 * nokta.live/cardapio acessado sem nenhum slug (ex.: link quebrado, erro de
 * digitação). "fixed inset-0 z-50" cobre o header/footer do site de
 * ingressos herdado do Root Layout — mesmo padrão de [orgSlug]/page.tsx.
 */
export default function CardapioRaizPage() {
  return (
    <main className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 overflow-y-auto bg-[#faf9fd] px-6 text-center">
      <UtensilsCrossed size={40} className="text-black/20" />
      <h1 className="font-poppins text-xl font-semibold text-foreground">Cardápio Nokta</h1>
      <p className="max-w-xs text-sm text-muted-foreground">
        Acesse pelo link ou QR code do estabelecimento que você deseja visitar.
      </p>
    </main>
  );
}
