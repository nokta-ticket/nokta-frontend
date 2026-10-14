import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon, type IconName } from "@/components/ui/icon";

const FEATURE_TILES: { icon: IconName; title: string; description: string }[] = [
  { icon: "ticket", title: "Venda mais e melhor", description: "Eventos, ingressos, check-in e filas." },
  { icon: "chair", title: "Opere com eficiência", description: "Mesas, comandas, pedidos e estoque." },
  { icon: "wallet", title: "Tenha controle total", description: "Financeiro, relatórios e indicadores." },
  { icon: "shield", title: "Trabalhe com segurança", description: "Permissões, acessos e auditoria." },
];

/**
 * Preenche a área abaixo do card principal do onboarding, que ficava vazia
 * enquanto o usuário ainda não tem organização. "Central de ajuda" abre
 * /ajuda em nova guia.
 */
export function OnboardingExtras() {
  return (
    <div className="grid w-full grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
      <Card className="p-5 sm:p-6">
        <h2 className="text-base font-semibold text-foreground">A Nokta cuida do que importa pra você</h2>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {FEATURE_TILES.map((tile, i) => (
            <div key={tile.title} className="surface-inset fade-up flex items-start gap-3 rounded-xl p-3.5" style={{ ["--i" as string]: i } as never}>
              <Icon name={tile.icon} size={16} className="mt-0.5 shrink-0 text-brand" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{tile.title}</p>
                <p className="mt-0.5 text-caption text-muted-foreground">{tile.description}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <p className="text-body text-muted-foreground">Conecte pessoas, processos e dados pra focar no que importa: fazer o seu evento acontecer.</p>
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/explorar">
              Ver a plataforma inteira
              <Icon name="arrow-right" size={12} />
            </Link>
          </Button>
        </div>
      </Card>

      <Card accent className="p-5 sm:p-6">
        <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
          <Icon name="question" size={16} className="text-brand" />
          Precisa de ajuda?
        </h2>
        <p className="mt-2 text-body text-muted-foreground">Nossa central de ajuda tem guias rápidos, vídeos e artigos pra te ajudar em cada etapa.</p>
        <Button asChild variant="secondary" size="sm" className="mt-4 w-fit">
          <a href="/ajuda" target="_blank" rel="noopener noreferrer">
            Acessar central de ajuda
            <Icon name="external" size={11} />
          </a>
        </Button>
      </Card>
    </div>
  );
}
