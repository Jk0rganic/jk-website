"use client";

import {
  AlertCircle,
  BarChart3,
  MessageSquareText,
  Star,
  StarHalf,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { Fragment, useEffect, useMemo, useState } from "react";
import type {
  AdminReview,
  AdminReviewSummary,
} from "@/lib/admin/review-service";
import { AdminBadge } from "../../components/ui/admin-badge";
import { AdminEmptyState } from "../../components/ui/admin-empty-state";
import { AdminMetricCard } from "../../components/ui/admin-metric-card";
import { AdminPanel } from "../../components/ui/admin-panel";
import { AdminToolbar } from "../../components/ui/admin-toolbar";
import ui from "../../components/ui/admin-ui.module.scss";
import { PageHeader } from "../../components/ui/page-header";
import k from "../styles.module.scss";

type ReviewFilters = {
  search: string;
  rating: string;
  status: string;
  product: string;
  after: string;
  before: string;
};

type ReviewsResponse = {
  reviews?: AdminReview[];
  summary?: AdminReviewSummary;
  error?: string;
};
type BadgeTone = "success" | "info" | "warning" | "danger" | "neutral";

const EMPTY_SUMMARY: AdminReviewSummary = {
  total: 0,
  averageRating: 0,
  lowRatingCount: 0,
  pendingCount: 0,
  ratingDistribution: {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  },
};

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "approved", label: "Approved" },
  { value: "pending", label: "Pending" },
  { value: "spam", label: "Spam" },
  { value: "trash", label: "Trash" },
];

const RATING_OPTIONS = [
  { value: "", label: "All ratings" },
  { value: "5", label: "5 stars" },
  { value: "4", label: "4 stars" },
  { value: "3", label: "3 stars" },
  { value: "2", label: "2 stars" },
  { value: "1", label: "1 star" },
  { value: "0", label: "No rating" },
];

const initialFilters: ReviewFilters = {
  search: "",
  rating: "",
  status: "",
  product: "",
  after: "",
  before: "",
};

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [summary, setSummary] = useState<AdminReviewSummary>(EMPTY_SUMMARY);
  const [filters, setFilters] = useState<ReviewFilters>(initialFilters);
  const [expandedReviewId, setExpandedReviewId] = useState<
    string | number | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();

    for (const [key, value] of Object.entries(filters)) {
      if (value.trim()) {
        params.set(key, value.trim());
      }
    }

    return params.toString();
  }, [filters]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadReviews() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/admin/reviews${queryString ? `?${queryString}` : ""}`,
          { signal: controller.signal },
        );
        const data = (await response.json()) as ReviewsResponse;

        if (!response.ok) {
          throw new Error(data.error || "Failed to load reviews");
        }

        setReviews(data.reviews ?? []);
        setSummary(data.summary ?? EMPTY_SUMMARY);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;

        setError(err instanceof Error ? err.message : "Failed to load reviews");
        setReviews([]);
        setSummary(EMPTY_SUMMARY);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadReviews();

    return () => controller.abort();
  }, [queryString]);

  function updateFilter(name: keyof ReviewFilters, value: string) {
    setExpandedReviewId(null);
    setFilters((current) => ({ ...current, [name]: value }));
  }

  const hasFilters = Object.values(filters).some((value) => value.trim());
  const statItems = [
    {
      label: "Total reviews",
      value: summary.total,
      icon: MessageSquareText,
      tone: "info" as const,
      detail: "Loaded feedback",
    },
    {
      label: "Average rating",
      value: summary.averageRating ? summary.averageRating.toFixed(1) : "0.0",
      icon: Star,
      tone: "warning" as const,
      detail: "Across rated reviews",
    },
    {
      label: "Low ratings",
      value: summary.lowRatingCount,
      icon: AlertCircle,
      tone: "warning" as const,
      detail: "Two stars or below",
    },
    {
      label: "Pending",
      value: summary.pendingCount,
      icon: StarHalf,
      tone: "neutral" as const,
      detail: "Awaiting moderation",
    },
  ];
  const distributionMax = Math.max(
    1,
    ...Object.values(summary.ratingDistribution),
  );

  return (
    <>
      <PageHeader
        title="Reviews"
        subtitle="Filter product reviews and inspect customer feedback."
      />

      <section className={ui.statGrid} aria-label="Review KPIs">
        {statItems.map((item) => (
          <AdminMetricCard
            key={item.label}
            label={item.label}
            value={item.value}
            icon={item.icon}
            tone={item.tone}
            detail={item.detail}
          />
        ))}
      </section>

      <AdminPanel
        title="Rating distribution"
        description="Count of customer ratings from five stars down to one."
        action={<BarChart3 size={18} aria-hidden />}
      >
        <div className={k.distributionList}>
          {([5, 4, 3, 2, 1] as const).map((rating) => {
            const count = summary.ratingDistribution[rating];
            const width = `${Math.round((count / distributionMax) * 100)}%`;

            return (
              <div key={rating} className={k.distributionRow}>
                <span>
                  <Star size={14} aria-hidden />
                  {rating}
                </span>
                <div className={k.distributionTrack}>
                  <i style={{ width }} />
                </div>
                <strong>{count}</strong>
              </div>
            );
          })}
        </div>
      </AdminPanel>

      <AdminPanel
        title="Review list"
        description="Product, customer, rating, excerpt, moderation status, and details."
        action={
          hasFilters && (
            <button
              type="button"
              className={k.clearButton}
              onClick={() => setFilters(initialFilters)}
            >
              Clear filters
            </button>
          )
        }
      >
        <AdminToolbar
          searchLabel="Search reviews"
          searchPlaceholder="Search reviewer, email, product, content"
          searchValue={filters.search}
          onSearchChange={(event) => updateFilter("search", event.target.value)}
        >
          <label className={k.filterControl}>
            <span>Rating</span>
            <select
              aria-label="Filter reviews by rating"
              value={filters.rating}
              onChange={(event) => updateFilter("rating", event.target.value)}
            >
              {RATING_OPTIONS.map((option) => (
                <option
                  key={option.value || "all-ratings"}
                  value={option.value}
                >
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className={k.filterControl}>
            <span>Status</span>
            <select
              aria-label="Filter reviews by status"
              value={filters.status}
              onChange={(event) => updateFilter("status", event.target.value)}
            >
              {STATUS_OPTIONS.map((option) => (
                <option
                  key={option.value || "all-statuses"}
                  value={option.value}
                >
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className={k.filterControl}>
            <span>Product</span>
            <input
              type="text"
              aria-label="Filter reviews by product"
              placeholder="Name, slug, or ID"
              value={filters.product}
              onChange={(event) => updateFilter("product", event.target.value)}
            />
          </label>
          <label className={k.filterControl}>
            <span>After</span>
            <input
              type="date"
              aria-label="Reviews after"
              value={filters.after}
              onChange={(event) => updateFilter("after", event.target.value)}
            />
          </label>
          <label className={k.filterControl}>
            <span>Before</span>
            <input
              type="date"
              aria-label="Reviews before"
              value={filters.before}
              onChange={(event) => updateFilter("before", event.target.value)}
            />
          </label>
        </AdminToolbar>

        {loading && <p className={k.stateText}>Loading reviews...</p>}
        {error && <p className={ui.error}>{error}</p>}

        {!loading && !error && reviews.length === 0 && (
          <AdminEmptyState
            title="No reviews match these filters"
            description="Adjust rating, product, date, search, or status filters to widen the queue."
            icon={MessageSquareText}
          />
        )}

        {!loading && !error && reviews.length > 0 && (
          <div className={ui.tableWrap}>
            <table className={ui.table}>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Reviewer</th>
                  <th>Rating</th>
                  <th>Excerpt</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>
                    <span className={k.srOnly}>Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((review) => {
                  const expanded = expandedReviewId === review.id;

                  return (
                    <Fragment key={review.id}>
                      <tr
                        key={review.id}
                        className={
                          review.rating > 0 && review.rating <= 2
                            ? k.lowRatingRow
                            : undefined
                        }
                      >
                        <td data-label="Product">
                          <Link
                            href={`/admin-account/products/${review.productId}`}
                            className={k.productName}
                          >
                            {review.productName}
                          </Link>
                          <div className={ui.muted}>#{review.productId}</div>
                        </td>
                        <td data-label="Reviewer">
                          <span className={k.reviewer}>
                            <UserRound size={15} aria-hidden />
                            {review.reviewer}
                          </span>
                          <div className={ui.muted}>
                            {review.reviewerEmail || "No email"}
                          </div>
                        </td>
                        <td data-label="Rating">
                          <span
                            className={`${k.rating} ${
                              review.rating > 0 && review.rating <= 2
                                ? k.lowRating
                                : ""
                            }`}
                          >
                            <Star size={15} aria-hidden />
                            {formatRating(review.rating)}
                          </span>
                        </td>
                        <td data-label="Excerpt" className={k.excerpt}>
                          {getExcerpt(review.content)}
                        </td>
                        <td data-label="Date">
                          {formatReviewDate(review.date)}
                        </td>
                        <td data-label="Status">
                          <AdminBadge tone={statusBadgeTone(review.status)}>
                            {review.status || "unknown"}
                          </AdminBadge>
                        </td>
                        <td data-label="Actions">
                          <button
                            type="button"
                            className={k.detailButton}
                            aria-expanded={expanded}
                            onClick={() =>
                              setExpandedReviewId(expanded ? null : review.id)
                            }
                          >
                            {expanded ? "Hide" : "Details"}
                          </button>
                        </td>
                      </tr>
                      {expanded && (
                        <tr key={`${review.id}-details`}>
                          <td colSpan={7} className={k.detailsCell}>
                            <div className={k.detailsPanel}>
                              <div>
                                <span className={k.detailLabel}>
                                  Full review
                                </span>
                                <p>{review.content || "No review content."}</p>
                              </div>
                              <dl className={k.detailGrid}>
                                <div>
                                  <dt>Reviewer email</dt>
                                  <dd>{review.reviewerEmail || "No email"}</dd>
                                </div>
                                <div>
                                  <dt>Product ID</dt>
                                  <dd>{review.productId}</dd>
                                </div>
                                <div>
                                  <dt>Product name</dt>
                                  <dd>{review.productName}</dd>
                                </div>
                                <div>
                                  <dt>Product link</dt>
                                  <dd>
                                    {review.productSlug ? (
                                      <Link
                                        href={`/product/${review.productSlug}`}
                                      >
                                        /product/{review.productSlug}
                                      </Link>
                                    ) : (
                                      "No slug"
                                    )}
                                  </dd>
                                </div>
                              </dl>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </AdminPanel>
    </>
  );
}

function formatRating(rating: number) {
  if (!rating) return "No rating";
  return `${rating}/5`;
}

function formatReviewDate(value: string) {
  if (!value) return "No date";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function getExcerpt(content: string) {
  if (!content) return "No content";
  return content.length > 120 ? `${content.slice(0, 117)}...` : content;
}

function statusBadgeTone(status: string): BadgeTone {
  const normalized = status.toLowerCase();

  if (["approved", "approve", "published", "publish"].includes(normalized)) {
    return "success";
  }

  if (["pending", "hold", "unapproved"].includes(normalized)) {
    return "warning";
  }

  if (["spam", "trash"].includes(normalized)) {
    return "danger";
  }

  return "neutral";
}
