import api from "@/lib/axios";

/** Mesmo catálogo fixo do backend (VENUE_AMENITY_CATALOG) — nunca diverge, ver src/venue/menu/common/venue-amenity-catalog.ts. */
export const VENUE_AMENITY_KEYS = [
  "VALET",
  "PARKING",
  "PAYMENT_METHODS",
  "WIFI",
  "OUTDOOR_AREA",
  "ACCESSIBILITY",
  "PET_FRIENDLY",
  "LIVE_MUSIC",
  "AIR_CONDITIONING",
] as const;
export type VenueAmenityKey = (typeof VENUE_AMENITY_KEYS)[number];

export const VENUE_AMENITY_LABEL: Record<VenueAmenityKey, string> = {
  VALET: "Valet",
  PARKING: "Estacionamento",
  PAYMENT_METHODS: "Formas de pagamento",
  WIFI: "Wi-Fi",
  OUTDOOR_AREA: "Área externa",
  ACCESSIBILITY: "Acessibilidade",
  PET_FRIENDLY: "Pet friendly",
  LIVE_MUSIC: "Música ao vivo",
  AIR_CONDITIONING: "Ar condicionado",
};

export interface VenueHomeAmenity {
  key: string;
  label: string;
  value: string | null;
}

export interface VenueHomeWeekHourEntry {
  dayOfWeek: number;
  label: string;
  hours: string | null;
}

export interface VenueHomePageData {
  organizationName: string;
  profile: {
    logoUrl: string | null;
    bannerUrl: string | null;
    address: string | null;
    instagramUrl: string | null;
    whatsappNumber: string | null;
  };
  isOpenNow: boolean | null;
  todayHoursLabel: string | null;
  weekHours: VenueHomeWeekHourEntry[];
  amenities: VenueHomeAmenity[];
}

export const venueHomePublicApi = {
  getPageData: (orgSlug: string) =>
    api.get<VenueHomePageData>(`/inicio-publica/${orgSlug}`).then((r) => r.data),
};
