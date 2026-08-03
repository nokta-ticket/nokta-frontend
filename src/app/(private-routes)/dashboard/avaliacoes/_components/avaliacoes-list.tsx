"use client";

import { useState } from "react";
import { Check, Star, ThumbsDown, ThumbsUp, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { VENUE_REVIEW_COMPLAINT_LABEL } from "@/services/venue-review-public";
import type { VenueReview } from "@/services/venue-reviews";
import { EmptyState } from "../../_components/states/empty-state";
import { TableSkeleton } from "../../_components/states/loading-state";
import { ErrorState } from "../../_components/states/error-state";
import { useVenueReviewMutations, useVenueReviews } from "../_hooks/use-venue-reviews";

type Filter = "ALL" | "NEGATIVE_PENDING" | "PENDING";

const CATEGORY_ROWS: { key: keyof Pick<VenueReview, "priceRating" | "productsRating" | "serviceRating" | "ambienceRating">; label: string }[] = [
  { key: "priceRating", label: "Preço" },
  { key: "productsRating", label: "Produtos" },
  { key: "serviceRating", label: "Atendimento" },
  { key: "ambienceRating", label: "Ambiente" },
];

function StarsInline({ value }: { value: number | null }) {
  if (!value) return <span className="text-black/30">—</span>;
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={13} fill={n <= value ? "#f5a623" : "none"} color={n <= value ? "#f5a623" : "#dcdce2"} />
      ))}
    </span>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function AvaliacoesList({ orgId, canManage }: { orgId: number; canManage: boolean }) {
  const [filter, setFilter] = useState<Filter>("NEGATIVE_PENDING");

  const query =
    filter === "NEGATIVE_PENDING"
      ? { liked: false, resolution: "PENDING" as const }
      : filter === "PENDING"
        ? { resolution: "PENDING" as const }
        : {};

  const { data, isLoading, isError, refetch } = useVenueReviews(orgId, query);
  const { markResolved, unmarkResolved } = useVenueReviewMutations(orgId);

  const reviews = data?.data ?? [];

  const handleResolve = async (review: VenueReview) => {
    try {
      await markResolved.mutateAsync(review.id);
      toast.success("Avaliação marcada como resolvida.");
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível marcar como resolvida."));
    }
  };

  const handleReopen = async (review: VenueReview) => {
    try {
      await unmarkResolved.mutateAsync(review.id);
      toast.success("Avaliação reaberta.");
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível reabrir a avaliação."));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button variant={filter === "NEGATIVE_PENDING" ? "default" : "outline"} size="sm" onClick={() => setFilter("NEGATIVE_PENDING")}>
          Negativas pendentes
        </Button>
        <Button variant={filter === "PENDING" ? "default" : "outline"} size="sm" onClick={() => setFilter("PENDING")}>
          Todas pendentes
        </Button>
        <Button variant={filter === "ALL" ? "default" : "outline"} size="sm" onClick={() => setFilter("ALL")}>
          Todas
        </Button>
      </div>

      {isError ? (
        <ErrorState description="Não foi possível carregar as avaliações." onRetry={() => refetch()} />
      ) : isLoading ? (
        <TableSkeleton />
      ) : reviews.length === 0 ? (
        <EmptyState
          title="Nenhuma avaliação por aqui"
          description={
            filter === "ALL"
              ? "Quando clientes avaliarem seu estabelecimento, elas aparecem aqui."
              : "Nenhuma avaliação corresponde a este filtro no momento."
          }
        />
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => {
            const isResolved = review.resolvedAt !== null;
            return (
              <div
                key={review.id}
                className={cn(
                  "rounded-xl border bg-white p-4",
                  !review.liked && !isResolved ? "border-red-200 bg-red-50/40" : "border-black/10",
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    {review.liked ? (
                      <span className="grid h-8 w-8 place-items-center rounded-full bg-emerald-50 text-emerald-600">
                        <ThumbsUp size={15} />
                      </span>
                    ) : (
                      <span className="grid h-8 w-8 place-items-center rounded-full bg-red-50 text-red-600">
                        <ThumbsDown size={15} />
                      </span>
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{review.reviewerName}</p>
                      <p className="text-xs text-black/50">
                        {review.reviewerWhatsapp} · {formatDate(review.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isResolved ? (
                      <Badge variant="outline" className="gap-1 border-emerald-200 bg-emerald-50 text-emerald-700">
                        <Check size={12} /> Resolvida
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                        Pendente
                      </Badge>
                    )}
                    {canManage ? (
                      isResolved ? (
                        <Button variant="outline" size="sm" onClick={() => handleReopen(review)} disabled={unmarkResolved.isPending}>
                          <Undo2 size={14} /> Reabrir
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" onClick={() => handleResolve(review)} disabled={markResolved.isPending}>
                          <Check size={14} /> Marcar resolvida
                        </Button>
                      )
                    ) : null}
                  </div>
                </div>

                {!review.liked && review.complaintCategory ? (
                  <p className="mt-3 text-sm">
                    <span className="font-medium text-red-700">Crítica principal:</span>{" "}
                    {VENUE_REVIEW_COMPLAINT_LABEL[review.complaintCategory]}
                  </p>
                ) : null}

                {review.comment ? <p className="mt-2 text-sm text-black/70">&ldquo;{review.comment}&rdquo;</p> : null}

                {CATEGORY_ROWS.some((row) => review[row.key] !== null) ? (
                  <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1.5 sm:grid-cols-4">
                    {CATEGORY_ROWS.map((row) => (
                      <div key={row.key} className="flex items-center justify-between gap-2 text-xs text-black/60">
                        {row.label}
                        <StarsInline value={review[row.key]} />
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
