import { beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { CrmChannelState, CrmContact } from "@/services/crm";

vi.mock("@/services/crm-marketing", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/services/crm-marketing")>();
  return {
    ...original,
    crmMarketingApi: {
      listTemplates: vi.fn(() => Promise.resolve([{ id: 7, channel: "EMAIL", name: "Abertura de vendas", status: "APPROVED", content: { subject: "Oi", blocks: [] }, problems: [], rejectionReason: null, submitted: false, statusSyncedAt: null, updatedAt: "2026-10-12T00:00:00Z" }])),
      previewTemplate: vi.fn(() => Promise.resolve({ channel: "EMAIL", subject: "Oi, Ana", html: "<p>Oi</p>", text: "Oi", problems: [] })),
      estimate: vi.fn(() =>
        Promise.resolve({
          audience: { total: 1, eligible: 1, recentlyContacted: 0, willReceive: 1 },
          cost: { channel: "EMAIL", recipients: 1, unitCostMicros: 10000, totalCostMicros: 0, chargedBy: "NOKTA", credits: { needed: 1, fromFree: 1, fromPaid: 0, missing: 0, balance: { freeMonthly: 500, freeUsed: 0, freeRemaining: 500, paidBalance: 0, available: 500, creditPriceMicros: 10000 } }, ratesCheckedAt: null },
          blockers: [],
        }),
      ),
      sendIndividual: vi.fn(() => Promise.resolve({ campaign: {}, recipient: { status: "SENT" } })),
    },
  };
});

import { crmMarketingApi } from "@/services/crm-marketing";
import { ChannelDialog } from "./channel-dialog";

const eligible: CrmChannelState = { eligible: true, reason: null, legalBasis: "LEGITIMATE_INTEREST", preference: "NOT_ASKED", suppressionReason: null };
const noConsent: CrmChannelState = { eligible: false, reason: "NO_CONSENT", legalBasis: null, preference: "NOT_ASKED", suppressionReason: null };
const contact: CrmContact = {
  id: 42, hasAccount: true, name: "Ana Lima", email: "ana@exemplo.com", phone: "+5511999998888", createdAt: "2026-01-01T00:00:00Z", sources: ["PURCHASE"],
  ordersCount: 1, eventsCount: 1, spentCents: 5000, firstPurchaseAt: null, lastPurchaseAt: null, channels: { EMAIL: eligible, WHATSAPP: noConsent, PUSH: noConsent },
};

function open(channel: "EMAIL" | "WHATSAPP", canSend = true) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <ChannelDialog orgId={1} target={{ contact, channel }} onClose={() => {}} onOpenContact={() => {}} onGoTo={() => {}} canSend={canSend} />
    </QueryClientProvider>,
  );
}

beforeEach(() => vi.clearAllMocks());

describe("janela de canal do contato", () => {
  it("abrir a janela e escolher um modelo não envia nada: o envio só sai depois de revisar e confirmar", async () => {
    open("EMAIL");
    const select = await screen.findByRole("combobox");
    expect(crmMarketingApi.sendIndividual).not.toHaveBeenCalled();

    fireEvent.change(select, { target: { value: "7" } });
    const review = await screen.findByRole("button", { name: "Revisei, quero enviar" });
    await waitFor(() => expect(review).not.toBeDisabled());
    expect(screen.getByText("Incluído no plano")).toBeInTheDocument();
    expect(crmMarketingApi.sendIndividual).not.toHaveBeenCalled();

    fireEvent.click(review);
    expect(await screen.findByText("Enviar agora para Ana?")).toBeInTheDocument();
    expect(crmMarketingApi.sendIndividual).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Enviar" }));
    await waitFor(() => expect(crmMarketingApi.sendIndividual).toHaveBeenCalledTimes(1));
    expect(crmMarketingApi.sendIndividual).toHaveBeenCalledWith(1, 42, { channel: "EMAIL", templateId: 7 });
  });

  it("contato que não pode receber: explica o motivo e não oferece modelo nem envio", async () => {
    open("WHATSAPP");
    expect(await screen.findByText("Este contato não recebe WhatsApp seu.")).toBeInTheDocument();
    expect(screen.getByText("Ainda não autorizou")).toBeInTheDocument();
    expect(screen.queryByRole("combobox")).toBeNull();
    expect(screen.queryByRole("button", { name: "Revisei, quero enviar" })).toBeNull();
    expect(crmMarketingApi.listTemplates).not.toHaveBeenCalled();
    expect(crmMarketingApi.sendIndividual).not.toHaveBeenCalled();
  });

  it("sem permissão de campanhas a janela só informa", async () => {
    open("EMAIL", false);
    expect(await screen.findByText(/Enviar mensagens depende de permissão/)).toBeInTheDocument();
    expect(screen.queryByRole("combobox")).toBeNull();
    expect(crmMarketingApi.listTemplates).not.toHaveBeenCalled();
    expect(crmMarketingApi.estimate).not.toHaveBeenCalled();
  });
});
