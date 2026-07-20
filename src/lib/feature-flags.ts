/**
 * Feature flags lidas em build-time (NEXT_PUBLIC_*). Só um lugar central
 * para não espalhar `process.env.NEXT_PUBLIC_X === "true"` pelo código —
 * ver docs/platform/unified-navigation.md.
 */
export function isUnifiedDashboardEnabled(): boolean {
  return process.env.NEXT_PUBLIC_UNIFIED_DASHBOARD_ENABLED === "true";
}
