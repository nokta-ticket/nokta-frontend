import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RecommendationsPanel } from "./recommendations-panel";
import type { Recommendation } from "@/services/platform";

const REC: Recommendation = {
  capabilityKey: "TABLES",
  label: "Mesas",
  priority: 1,
  reason: "Você aceita reservas — organize a ocupação com Mesas.",
  route: "/dashboard/operacao?tab=mesas",
  dismissible: true,
};

describe("RecommendationsPanel", () => {
  it("não renderiza nada quando não há recomendações", () => {
    const { container } = render(<RecommendationsPanel recommendations={[]} onDismiss={vi.fn()} dismissingKey={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("mostra o motivo exatamente como veio do backend — nunca texto inventado no frontend", () => {
    render(<RecommendationsPanel recommendations={[REC]} onDismiss={vi.fn()} dismissingKey={null} />);
    expect(screen.getByText(REC.reason)).toBeInTheDocument();
  });

  it("dispensar chama onDismiss com a capabilityKey correta", () => {
    const onDismiss = vi.fn();
    render(<RecommendationsPanel recommendations={[REC]} onDismiss={onDismiss} dismissingKey={null} />);

    fireEvent.click(screen.getByRole("button", { name: /Dispensar recomendação de Mesas/ }));
    expect(onDismiss).toHaveBeenCalledWith("TABLES");
  });
});
