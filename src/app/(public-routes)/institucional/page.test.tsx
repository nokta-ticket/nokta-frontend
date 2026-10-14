import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { COMPANY } from "@/lib/company";
import InstitucionalPage, { metadata } from "./page";

/**
 * Fase 5.1, Etapa 4/6/13 — CTAs da LP institucional e canonical. Estático:
 * lê o `metadata` exportado de verdade (não um mock) e confere os destinos
 * via os mesmos helpers centrais que a página usa (lib/surfaces).
 */
describe("landing institucional — metadata e canonical", () => {
  it("canonical aponta pro próprio host institucional", () => {
    expect(metadata.alternates?.canonical).toBe("https://www.nokta.live");
  });

  it("openGraph.url também é o host institucional", () => {
    expect(metadata.openGraph?.url).toBe("https://www.nokta.live");
  });

  it("título e descrição não mencionam a Nokta como só bilheteria", () => {
    const title = String(metadata.title ?? "");
    const description = String(metadata.description ?? "");
    expect(title.toLowerCase()).not.toContain("nokta tickets");
    expect(description.toLowerCase()).not.toContain("nokta tickets");
  });
});

describe("landing institucional — destinos dos CTAs", () => {
  it("Entrar e Já tenho conta levam pro login empresarial em app.nokta.live", () => {
    render(<InstitucionalPage />);
    const links = screen.getAllByRole("link", { name: /^Entrar$|^Já tenho conta$/ });
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      expect(link.getAttribute("href")).toBe("https://app.nokta.live/login");
    }
  });

  it("Criar conta leva pro cadastro empresarial (register com ctx=produtor), nunca pro login público da bilheteria", () => {
    render(<InstitucionalPage />);
    const links = screen.getAllByRole("link", { name: /^Criar conta( grátis)?$/ });
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      expect(link.getAttribute("href")).toBe("https://app.nokta.live/register?ctx=produtor");
    }
  });

  it("Bilheteria e Ver eventos levam pro host público de ingressos", () => {
    render(<InstitucionalPage />);
    for (const name of ["Bilheteria", /^Ver eventos$/]) {
      const link = screen.getByRole("link", { name });
      expect(link.getAttribute("href")).toBe("https://www.noktatickets.com.br/");
    }
  });

  it("Contato no rodapé institucional usa o e-mail de suporte oficial (mailto), nunca um link morto", () => {
    render(<InstitucionalPage />);
    const contato = screen.getByRole("link", { name: "Contato" });
    expect(contato.getAttribute("href")).toBe(`mailto:${COMPANY.emails.support}`);
  });

  it("rodapé identifica a empresa com razão social e CNPJ oficiais", () => {
    render(<InstitucionalPage />);
    expect(screen.getAllByText(new RegExp(COMPANY.cnpj)).length).toBeGreaterThan(0);
    expect(screen.getAllByText(new RegExp(COMPANY.legalName.replace(".", "\\."))).length).toBeGreaterThan(0);
  });
});
