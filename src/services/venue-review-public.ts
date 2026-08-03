import api from "@/lib/axios";

/** Mesma lista fixa do backend (SubmitVenueReviewDto) — nunca diverge, ver src/venue/reviews/dto/submit-venue-review.dto.ts. */
export const VENUE_REVIEW_COMPLAINT_CATEGORIES = [
  "ATENDIMENTO",
  "DEMORA_ATENDIMENTO",
  "PRODUTO",
  "PRECO",
  "AMBIENTE",
  "COBRANCA",
  "OUTRO",
] as const;
export type VenueReviewComplaintCategory = (typeof VENUE_REVIEW_COMPLAINT_CATEGORIES)[number];

export const VENUE_REVIEW_COMPLAINT_LABEL: Record<VenueReviewComplaintCategory, string> = {
  ATENDIMENTO: "Atendimento",
  DEMORA_ATENDIMENTO: "Demora no atendimento",
  PRODUTO: "Produto / Comida ou bebida",
  PRECO: "Preço",
  AMBIENTE: "Ambiente",
  COBRANCA: "Cobrança / Conta",
  OUTRO: "Outro motivo",
};

export interface VenueReviewPageData {
  organizationName: string;
  profile: {
    logoUrl: string | null;
    bannerUrl: string | null;
    instagramUrl: string | null;
  };
}

export interface SubmitVenueReviewPayload {
  liked: boolean;
  priceRating?: number;
  productsRating?: number;
  serviceRating?: number;
  ambienceRating?: number;
  complaintCategory?: VenueReviewComplaintCategory;
  comment?: string;
  reviewerName: string;
  reviewerWhatsapp: string;
  reviewerBirthDate: string;
  marketingOptIn?: boolean;
}

export const venueReviewPublicApi = {
  getPageData: (orgSlug: string) =>
    api.get<VenueReviewPageData>(`/avaliacao-publica/${orgSlug}`).then((r) => r.data),
  submit: (orgSlug: string, payload: SubmitVenueReviewPayload) =>
    api.post<{ id: number }>(`/avaliacao-publica/${orgSlug}`, payload).then((r) => r.data),
};
