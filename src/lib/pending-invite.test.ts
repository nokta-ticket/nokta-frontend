import { afterEach, describe, expect, it } from "vitest";
import { clearPendingInvite, pendingInvitePath, readPendingInvite, savePendingInvite } from "./pending-invite";

const TOKEN = "a".repeat(64);
const OTHER = "b".repeat(64);

describe("pending-invite", () => {
  afterEach(() => window.localStorage.clear());

  it("guarda o convite e devolve o caminho pra voltar a ele", () => {
    savePendingInvite(TOKEN);
    expect(readPendingInvite()).toBe(TOKEN);
    expect(pendingInvitePath()).toBe(`/convites/${TOKEN}`);
  });

  it("ignora o que não tem formato de token (nunca vira redirecionamento arbitrário)", () => {
    savePendingInvite("../../login");
    expect(pendingInvitePath()).toBeNull();
    window.localStorage.setItem("nokta:convite-pendente", JSON.stringify({ token: "//evil.com", at: Date.now() }));
    expect(pendingInvitePath()).toBeNull();
  });

  it("expira junto com o convite (7 dias)", () => {
    savePendingInvite(TOKEN);
    const eightDays = Date.now() + 8 * 24 * 60 * 60 * 1000;
    expect(readPendingInvite(eightDays)).toBeNull();
    expect(readPendingInvite()).toBeNull();
  });

  it("limpar com token só apaga se for o mesmo convite", () => {
    savePendingInvite(TOKEN);
    clearPendingInvite(OTHER);
    expect(readPendingInvite()).toBe(TOKEN);
    clearPendingInvite(TOKEN);
    expect(readPendingInvite()).toBeNull();
  });
});
