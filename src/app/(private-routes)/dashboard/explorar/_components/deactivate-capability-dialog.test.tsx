import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DeactivateCapabilityDialog } from "./deactivate-capability-dialog";

describe("DeactivateCapabilityDialog", () => {
  it("não chama onConfirm sozinho — só depois do clique explícito em Desativar", () => {
    const onConfirm = vi.fn();
    const onOpenChange = vi.fn();

    render(<DeactivateCapabilityDialog open={true} onOpenChange={onOpenChange} capabilityName="Estoque" onConfirm={onConfirm} />);

    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.getByText(/Desativar “Estoque”\?|Desativar "Estoque"\?/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("chama onConfirm ao clicar no botão destrutivo de confirmação", () => {
    const onConfirm = vi.fn();
    render(<DeactivateCapabilityDialog open={true} onOpenChange={vi.fn()} capabilityName="Estoque" onConfirm={onConfirm} />);

    fireEvent.click(screen.getByRole("button", { name: "Desativar" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("não renderiza o conteúdo do diálogo quando fechado", () => {
    render(<DeactivateCapabilityDialog open={false} onOpenChange={vi.fn()} capabilityName="Estoque" onConfirm={vi.fn()} />);
    expect(screen.queryByRole("button", { name: "Desativar" })).not.toBeInTheDocument();
  });
});
