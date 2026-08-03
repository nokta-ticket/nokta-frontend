import api from "@/lib/axios";
import type { VenueReviewComplaintCategory } from "./venue-review-public";

export interface VenueReview {
  id: number;
  organizationId: number;
  liked: boolean;
  priceRating: number | null;
  productsRating: number | null;
  serviceRating: number | null;
  ambienceRating: number | null;
  complaintCategory: VenueReviewComplaintCategory | null;
  comment: string | null;
  reviewerName: string;
  reviewerWhatsapp: string;
  reviewerBirthDate: string | null;
  marketingOptIn: boolean;
  resolvedAt: string | null;
  createdAt: string;
}

export interface Paginated<T> {
  data: T[];
  paginate: { page: number; limit: number; total: number };
}

export interface VenueReviewQuery {
  liked?: boolean;
  resolution?: "PENDING" | "RESOLVED";
  page?: number;
  limit?: number;
}

const base = (organizationId: number) => `/organizations/${organizationId}/venue/reviews`;

export const venueReviewsApi = {
  list: (organizationId: number, query: VenueReviewQuery) =>
    api
      .get<Paginated<VenueReview>>(base(organizationId), {
        params: {
          liked: query.liked === undefined ? undefined : String(query.liked),
          resolution: query.resolution,
          page: query.page,
          limit: query.limit,
        },
      })
      .then((r) => r.data),
  markResolved: (organizationId: number, reviewId: number) =>
    api.patch<VenueReview>(`${base(organizationId)}/${reviewId}/resolver`).then((r) => r.data),
  unmarkResolved: (organizationId: number, reviewId: number) =>
    api.patch<VenueReview>(`${base(organizationId)}/${reviewId}/reabrir`).then((r) => r.data),
};
