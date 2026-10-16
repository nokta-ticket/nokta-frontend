"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DataTablePagination } from "@/components/ui/data-table";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import { getErrorMessage } from "@/lib/axios";
import { formatPhone } from "@/lib/br-data";
import { toast } from "@/lib/toast";
import { VENUE_REVIEW_COMPLAINT_LABEL } from "@/services/venue-review-public";
import type { VenueReview } from "@/services/venue-reviews";
import { useVenueReviewMutations, useVenueReviews } from "../_hooks/use-venue-reviews";

type Filter = "NEGATIVE_PENDING" | "PENDING" | "ALL";
const PER_PAGE = 20;

const FILTER_OPTIONS: { value: Filter; label: string }[] = [
  { value: "NEGATIVE_PENDING", label: "Críticas pendentes" },
  { value: "PENDING", label: "Pendentes" },
  { value: "ALL", label: "Todas" },
];

const CATEGORY_ROWS: { key: keyof Pick<VenueReview, "priceRating" | "productsRating" | "serviceRating" | "ambienceRating">; label: string }[] = [
  { key: "priceRating", label: "Preço" },
  { key: "productsRating", label: "Produtos" },
  { key: "serviceRating", label: "Atendimento" },
  { key: "ambienceRating", label: "Ambiente" },
];

function Stars({ value }: { value: number | null }) {
  if (!value) return <span className="text-caption text-subtle-foreground">Não avaliado</span>;
  return (
    <span className="flex items-center gap-0.5 text-warning" aria-label={`${value} de 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Icon key={n} name={n <= value ? "star" : "star-outline"} size={12} className={cn(n > value && "text-border-strong")} />
      ))}
    </span>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "short" });
}

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

function ReviewCard({ review, canManage, index, onResolve, onReopen, pending }: { review: VenueReview; canManage: boolean; index: number; onResolve: () => void; onReopen: () => void; pending: boolean }) {
  const isResolved = review.resolvedAt !== null;
  const needsAttention = !review.liked && !isResolved;
  return (
    <article className={cn("fade-up flex flex-col gap-4 rounded-card border bg-surface p-5 shadow-card", needsAttention ? "border-danger-ring" : "border-border")} style={{ ["--i" as string]: index } as never}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="relative flex size-11 shrink-0 items-center justify-center rounded-full bg-surface-2 text-sm font-semibold text-foreground">
            {initials(review.reviewerName)}
            <span className={cn("absolute -bottom-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full ring-2 ring-surface", review.liked ? "bg-success text-white" : "bg-danger text-white")} aria-label={review.liked ? "Gostou" : "Não gostou"}>
              <Icon name={review.liked ? "heart" : "x-circle"} size={9} />
            </span>
          </span>
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold text-foreground">{review.reviewerName}</p>
            <p className="text-caption text-muted-foreground tnum">
              {formatPhone(review.reviewerWhatsapp)} · {formatDate(review.createdAt)}
              {review.marketingOptIn ? " · aceita novidades" : ""}
            </p>
          </div>
        </div>
        <StatusBadge tone={isResolved ? "success" : needsAttention ? "danger" : "warning"}>{isResolved ? "Resolvida" : "Pendente"}</StatusBadge>
      </div>

      {!review.liked && review.complaintCategory ? (
        <div className="flex items-center gap-2 text-sm">
          <Icon name="flag" size={12} className="text-danger" />
          <span className="text-muted-foreground">Principal crítica:</span>
          <span className="font-semibold text-foreground">{VENUE_REVIEW_COMPLAINT_LABEL[review.complaintCategory]}</span>
        </div>
      ) : null}

      {review.comment ? <blockquote className="border-l-2 border-border-strong pl-3 text-body text-foreground">“{review.comment}”</blockquote> : null}

      {CATEGORY_ROWS.some((row) => review[row.key] !== null) ? (
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2">
          {CATEGORY_ROWS.map((row) => (
            <div key={row.key} className="flex items-center justify-between gap-2">
              <dt className="text-caption text-muted-foreground">{row.label}</dt>
              <dd>
                <Stars value={review[row.key]} />
              </dd>
            </div>
          ))}
        </dl>
      ) : null}

      {canManage ? (
        <div className="mt-auto flex justify-end border-t border-border pt-3">
          {isResolved ? (
            <Button variant="subtle" size="sm" leftIcon="undo" loading={pending} onClick={onReopen}>
              Reabrir
            </Button>
          ) : (
            <Button variant="outline" size="sm" leftIcon="check" loading={pending} onClick={onResolve}>
              Marcar resolvida
            </Button>
          )}
        </div>
      ) : null}
    </article>
  );
}

export function AvaliacoesList({ orgId, canManage }: { orgId: number; canManage: boolean }) {
  const [filter, setFilter] = useState<Filter>("NEGATIVE_PENDING");
  const [page, setPage] = useState(1);

  const query = filter === "NEGATIVE_PENDING" ? { liked: false, resolution: "PENDING" as const, page, limit: PER_PAGE } : filter === "PENDING" ? { resolution: "PENDING" as const, page, limit: PER_PAGE } : { page, limit: PER_PAGE };

  const { data, isLoading, isError, refetch } = useVenueReviews(orgId, query);
  // Totais dos stat cards: três consultas leves (limit 1) só pelo `total`.
  const totalAll = useVenueReviews(orgId, { limit: 1 }).data?.paginate.total;
  const totalLiked = useVenueReviews(orgId, { liked: true, limit: 1 }).data?.paginate.total;
  const totalPending = useVenueReviews(orgId, { resolution: "PENDING", limit: 1 }).data?.paginate.total;
  const { markResolved, unmarkResolved } = useVenueReviewMutations(orgId);

  const reviews = data?.data ?? [];
  const total = data?.paginate.total ?? 0;
  const lastPage = Math.max(1, Math.ceil(total / PER_PAGE));
  const likedPct = totalAll && totalLiked !== undefined ? Math.round((totalLiked / totalAll) * 100) : null;

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
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Avaliações" icon="comments" value={totalAll ?? null} hint="recebidas pelo link público" />
        <StatCard label="Gostaram" icon="heart" value={totalLiked ?? null} hint={likedPct !== null ? `${likedPct}% do total` : undefined} />
        <StatCard label="Pendentes" icon="flag" value={totalPending ?? null} hint="ainda sem resposta da casa" />
      </div>

      <div className="scrollbar-hide -mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
        <SegmentedControl
          value={filter}
          onChange={(v) => {
            setFilter(v);
            setPage(1);
          }}
          options={FILTER_OPTIONS}
        />
      </div>

      {isError ? (
        <ErrorState title="Não deu pra carregar as avaliações" onRetry={() => refetch()} />
      ) : isLoading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-card" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <EmptyState icon="comments" title={filter === "ALL" ? "Nenhuma avaliação ainda" : "Nada pendente por aqui"} description={filter === "ALL" ? "Quando clientes avaliarem pelo link público, elas aparecem aqui." : "Nenhuma avaliação corresponde a este filtro agora."} />
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            {reviews.map((review, i) => (
              <ReviewCard key={review.id} review={review} canManage={canManage} index={i} pending={(markResolved.isPending && markResolved.variables === review.id) || (unmarkResolved.isPending && unmarkResolved.variables === review.id)} onResolve={() => handleResolve(review)} onReopen={() => handleReopen(review)} />
            ))}
          </div>
          {total > PER_PAGE ? <DataTablePagination page={page} lastPage={lastPage} total={total} perPage={PER_PAGE} noun="avaliações" onPageChange={setPage} /> : null}
        </>
      )}
    </div>
  );
}
