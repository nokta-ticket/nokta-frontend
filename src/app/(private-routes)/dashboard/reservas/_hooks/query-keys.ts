/** Query keys do domínio Reservas — sempre incluem organizationId/locationId (isolamento de cache). */
export const resKeys = {
  reservations: (orgId: number, locationId: number, filters: Record<string, unknown>) =>
    ["res", orgId, "reservations", locationId, filters] as const,
  reservation: (orgId: number, reservationId: number) => ["res", orgId, "reservation", reservationId] as const,
  availability: (orgId: number, params: Record<string, unknown>) =>
    ["res", orgId, "availability", params] as const,
  summary: (orgId: number, locationId: number, date: string) => ["res", orgId, "summary", locationId, date] as const,
  waitlist: (orgId: number, locationId: number, filters: Record<string, unknown>) =>
    ["res", orgId, "waitlist", locationId, filters] as const,
  waitlistEntry: (orgId: number, entryId: number) => ["res", orgId, "waitlistEntry", entryId] as const,
};
