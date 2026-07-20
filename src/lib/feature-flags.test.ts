import { afterEach, describe, expect, it, vi } from "vitest";

describe("isUnifiedDashboardEnabled", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('retorna true só quando a env var é exatamente "true"', async () => {
    vi.stubEnv("NEXT_PUBLIC_UNIFIED_DASHBOARD_ENABLED", "true");
    const { isUnifiedDashboardEnabled } = await import("./feature-flags");
    expect(isUnifiedDashboardEnabled()).toBe(true);
  });

  it("retorna false quando a env var não está definida (padrão seguro: navegação antiga)", async () => {
    vi.stubEnv("NEXT_PUBLIC_UNIFIED_DASHBOARD_ENABLED", undefined);
    const { isUnifiedDashboardEnabled } = await import("./feature-flags");
    expect(isUnifiedDashboardEnabled()).toBe(false);
  });

  it('retorna false para "false" — kill switch real, sem precisar de novo deploy', async () => {
    vi.stubEnv("NEXT_PUBLIC_UNIFIED_DASHBOARD_ENABLED", "false");
    const { isUnifiedDashboardEnabled } = await import("./feature-flags");
    expect(isUnifiedDashboardEnabled()).toBe(false);
  });

  it("retorna false para qualquer valor que não seja a string exata 'true' (evita truthy acidental)", async () => {
    vi.stubEnv("NEXT_PUBLIC_UNIFIED_DASHBOARD_ENABLED", "1");
    const { isUnifiedDashboardEnabled } = await import("./feature-flags");
    expect(isUnifiedDashboardEnabled()).toBe(false);
  });
});
