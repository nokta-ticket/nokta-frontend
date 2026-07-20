import { describe, expect, it, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import {
  useActivateCapability,
  useCapabilities,
  useSaveBusinessProfile,
} from "./use-platform";

vi.mock("@/services/platform", () => ({
  platformApi: {
    getCapabilities: vi.fn((orgId: number) => Promise.resolve([{ key: "EVENTS", organizationId: orgId }])),
    activateCapability: vi.fn(() => Promise.resolve({ status: "ACTIVE" })),
    saveBusinessProfile: vi.fn(() => Promise.resolve({ exists: true })),
  },
}));

import { platformApi } from "@/services/platform";

function wrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useCapabilities", () => {
  it("busca as capacidades da organização informada — troca de orgId refaz a busca com o novo id", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { result, rerender } = renderHook(({ orgId }: { orgId: number | null }) => useCapabilities(orgId), {
      wrapper: wrapper(client),
      initialProps: { orgId: 1 },
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(platformApi.getCapabilities).toHaveBeenCalledWith(1);

    rerender({ orgId: 2 });
    await waitFor(() => expect(platformApi.getCapabilities).toHaveBeenCalledWith(2));
  });

  it("não busca quando orgId é null (nenhuma organização selecionada)", () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    renderHook(() => useCapabilities(null), { wrapper: wrapper(client) });
    expect(platformApi.getCapabilities).not.toHaveBeenCalled();
  });
});

describe("useActivateCapability", () => {
  it("ao ativar com sucesso, invalida capacidades, explore, recomendações, navegação e home — nunca refetch global", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidateSpy = vi.spyOn(client, "invalidateQueries");

    const { result } = renderHook(() => useActivateCapability(1), { wrapper: wrapper(client) });

    result.current.mutate("TABLES");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const invalidatedKeys = invalidateSpy.mock.calls.map((call) => (call[0] as { queryKey: unknown[] }).queryKey[2]);
    expect(invalidatedKeys).toEqual(expect.arrayContaining(["capabilities", "explore", "recommendations", "navigation", "home"]));
  });
});

describe("useSaveBusinessProfile", () => {
  it("ao salvar, invalida perfil, recomendações e explore — não mexe em capacidades nem navegação (perfil nunca ativa nada sozinho)", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidateSpy = vi.spyOn(client, "invalidateQueries");

    const { result } = renderHook(() => useSaveBusinessProfile(1), { wrapper: wrapper(client) });

    result.current.mutate({ hasPhysicalVenue: true });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const invalidatedKeys = invalidateSpy.mock.calls.map((call) => (call[0] as { queryKey: unknown[] }).queryKey[2]);
    expect(invalidatedKeys).toEqual(expect.arrayContaining(["business-profile", "recommendations", "explore"]));
    expect(invalidatedKeys).not.toContain("capabilities");
    expect(invalidatedKeys).not.toContain("navigation");
  });
});
