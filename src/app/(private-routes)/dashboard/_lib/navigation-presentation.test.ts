import { describe, expect, it } from "vitest";
import { buildFullCatalogPreview, buildUnifiedNavigation, DISPLAY_GROUP_ORDER } from "./navigation-presentation";
import type { NavigationItem } from "@/services/platform";

function item(overrides: Partial<NavigationItem>): NavigationItem {
  return { key: "X", label: "X", route: "/dashboard/x", group: "CORE", ...overrides };
}

describe("buildUnifiedNavigation", () => {
  it("organização somente Tickets recebe Início + Eventos + Gestão (sem Operação/Produtos/Relacionamento)", () => {
    const items: NavigationItem[] = [
      item({ key: "PLATFORM_HOME", label: "Início", route: "/dashboard/inicio", group: "CORE" }),
      item({ key: "EVENTS", label: "Eventos", route: "/dashboard/eventos", group: "EVENTS" }),
      item({ key: "TICKETING", label: "Eventos e ingressos", route: "/dashboard/ingressos", group: "EVENTS" }),
      item({ key: "FINANCE", label: "Financeiro", route: "/dashboard/financeiro", group: "MANAGEMENT" }),
      item({ key: "TEAM", label: "Equipe", route: "/dashboard/equipe", group: "CORE" }),
      item({ key: "SETTINGS", label: "Configurações", route: "/dashboard/configuracoes", group: "CORE" }),
    ];

    const groups = buildUnifiedNavigation(items);
    expect(groups.map((g) => g.group)).toEqual(["INICIO", "EVENTOS", "GESTAO"]);
    expect(groups.find((g) => g.group === "EVENTOS")?.items).toHaveLength(1); // EVENTS e TICKETING colapsam na mesma rota
  });

  it("organização somente Venue recebe Início + Relacionamento + Operação + Produtos + Gestão (sem Eventos)", () => {
    const items: NavigationItem[] = [
      item({ key: "PLATFORM_HOME", group: "CORE", route: "/dashboard/inicio" }),
      item({ key: "RESERVATIONS", label: "Reservas", route: "/dashboard/reservas", group: "RELATIONSHIP" }),
      item({ key: "TABLES", label: "Mesas", route: "/dashboard/operacao?tab=mesas", group: "OPERATION" }),
      item({ key: "MENUS", label: "Cardápios", route: "/dashboard/cardapio", group: "PRODUCTS" }),
      item({ key: "FINANCE", label: "Financeiro", route: "/dashboard/financeiro", group: "MANAGEMENT" }),
    ];

    const groups = buildUnifiedNavigation(items);
    expect(groups.map((g) => g.group)).toEqual(["INICIO", "RELACIONAMENTO", "OPERACAO", "PRODUTOS", "GESTAO"]);
    expect(groups.some((g) => g.group === "EVENTOS")).toBe(false);
  });

  it("grupo vazio nunca aparece no resultado", () => {
    const groups = buildUnifiedNavigation([item({ key: "PLATFORM_HOME", group: "CORE" })]);
    expect(groups).toHaveLength(1);
    expect(groups[0].group).toBe("INICIO");
  });

  it("LOCATIONS nunca vira item de navegação de topo", () => {
    const groups = buildUnifiedNavigation([item({ key: "LOCATIONS", group: "CORE", route: "/dashboard/configuracoes/unidades" })]);
    expect(groups).toHaveLength(0);
  });

  it("PREPARATION e VENUE_PAYMENTS colapsam em Pedidos/Caixa — não criam item novo em Operação", () => {
    const items: NavigationItem[] = [
      item({ key: "ORDERS", label: "Pedidos", route: "/dashboard/operacao?tab=pedidos", group: "OPERATION" }),
      item({ key: "PREPARATION", label: "Preparo", route: "/dashboard/operacao?tab=preparo", group: "OPERATION" }),
      item({ key: "CASH_REGISTER", label: "Caixa", route: "/dashboard/operacao?tab=caixa", group: "OPERATION" }),
      item({ key: "VENUE_PAYMENTS", label: "Pagamentos", route: "/dashboard/operacao?tab=pagamentos", group: "OPERATION" }),
    ];
    const groups = buildUnifiedNavigation(items);
    expect(groups.find((g) => g.group === "OPERACAO")?.items.map((i) => i.route)).toEqual([
      "/dashboard/operacao/pedidos",
      "/dashboard/operacao/caixa",
    ]);
  });

  it("Promotores é secundário e vem depois de Eventos no mesmo grupo, mesmo entrando primeiro do backend", () => {
    const items: NavigationItem[] = [
      item({ key: "PROMOTERS", label: "Promotores", route: "/dashboard/promotores", group: "EVENTS" }),
      item({ key: "EVENTS", label: "Eventos", route: "/dashboard/eventos", group: "EVENTS" }),
    ];
    const groups = buildUnifiedNavigation(items);
    const eventosGroup = groups.find((g) => g.group === "EVENTOS")!;
    expect(eventosGroup.items.map((i) => i.key)).toEqual(["EVENTS", "PROMOTERS"]);
    expect(eventosGroup.items.find((i) => i.key === "EVENTS")?.secondary).toBe(false);
    expect(eventosGroup.items.find((i) => i.key === "PROMOTERS")?.secondary).toBe(true);
  });

  it("preserva a ordem de exibição dos grupos independente da ordem de entrada", () => {
    const items: NavigationItem[] = [
      item({ key: "FINANCE", group: "MANAGEMENT", route: "/dashboard/financeiro" }),
      item({ key: "PLATFORM_HOME", group: "CORE", route: "/dashboard/inicio" }),
      item({ key: "EVENTS", group: "EVENTS", route: "/dashboard/eventos" }),
    ];
    const groups = buildUnifiedNavigation(items);
    expect(groups.map((g) => g.group)).toEqual(DISPLAY_GROUP_ORDER.filter((g) => groups.some((x) => x.group === g)));
    expect(groups.map((g) => g.group)).toEqual(["INICIO", "EVENTOS", "GESTAO"]);
  });
});

// Nome do item = nome da página que ele abre, nunca da capacidade que "chegou
// primeiro" no dedupe por rota — senão o mesmo destino aparecia com nomes
// diferentes conforme o que cada organização tinha ativo.
describe("nomenclatura da sidebar", () => {
  const labelsOf = (items: NavigationItem[]) =>
    buildUnifiedNavigation(items).flatMap((g) => g.items.map((i) => i.label));

  it("Pagamentos sem Caixa ainda aparece como Caixa", () => {
    expect(labelsOf([item({ key: "VENUE_PAYMENTS", label: "Pagamentos", route: "/dashboard/operacao?tab=pagamentos", group: "OPERATION" })])).toEqual(["Caixa"]);
  });

  it("Produtos/Adicionais sem Cardápios aparecem como Cardápio", () => {
    expect(labelsOf([item({ key: "PRODUCTS", label: "Produtos", route: "/dashboard/cardapio?tab=produtos", group: "PRODUCTS" })])).toEqual(["Cardápio"]);
  });

  it("Fornecedores sem Estoque aparece como Estoque", () => {
    expect(labelsOf([item({ key: "SUPPLIERS", label: "Fornecedores", route: "/dashboard/estoque?tab=fornecedores", group: "PRODUCTS" })])).toEqual(["Estoque"]);
  });

  it("Mesas/Comandas aparecem como Mesas e comandas, sem repetir o nome da seção Operação", () => {
    expect(labelsOf([item({ key: "TABS", label: "Comandas", route: "/dashboard/operacao?tab=comandas", group: "OPERATION" })])).toEqual(["Mesas e comandas"]);
  });

  it("sidebar completa: nomes e ordem finais", () => {
    const layout = buildFullCatalogPreview().map((g) => [g.groupLabel, g.items.map((i) => i.label)]);
    expect(layout).toEqual([
      ["Início", ["Início"]],
      ["Eventos", ["Eventos", "Check-in", "Promotores"]],
      ["Relacionamento", ["Reservas", "Fila de espera", "Convidados", "Avaliações"]],
      ["Operação", ["Mesas e comandas", "Pedidos", "Caixa"]],
      ["Produtos", ["Cardápio", "Estoque"]],
      ["Gestão", ["Financeiro", "Insights", "Exportações", "Equipe", "Configurações"]],
    ]);
  });
});
