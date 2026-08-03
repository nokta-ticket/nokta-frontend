"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { venueReviewsApi, type VenueReviewQuery } from "@/services/venue-reviews";

const reviewKeys = {
  list: (orgId: number, query: VenueReviewQuery) => ["reviews", orgId, "list", query] as const,
};

export function useVenueReviews(orgId: number | null, query: VenueReviewQuery) {
  return useQuery({
    queryKey: reviewKeys.list(orgId ?? -1, query),
    queryFn: () => venueReviewsApi.list(orgId as number, query),
    enabled: orgId !== null,
    placeholderData: (previous) => previous,
  });
}

export function useVenueReviewMutations(orgId: number) {
  const qc = useQueryClient();
  const invalidateAll = () => qc.invalidateQueries({ queryKey: ["reviews", orgId], exact: false });

  const markResolved = useMutation({
    mutationFn: (reviewId: number) => venueReviewsApi.markResolved(orgId, reviewId),
    onSuccess: invalidateAll,
  });

  const unmarkResolved = useMutation({
    mutationFn: (reviewId: number) => venueReviewsApi.unmarkResolved(orgId, reviewId),
    onSuccess: invalidateAll,
  });

  return { markResolved, unmarkResolved };
}
