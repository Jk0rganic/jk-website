"use client";

import {
  AlertCircle,
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
      iconClass: ui.iconGreen,
    },
    {
      label: "Average rating",
      value: summary.averageRating ? summary.averageRating.toFixed(1) : "0.0",
      icon: Star,
      iconClass: ui.iconAmber,
    },
    {
      label: "Low ratings",
      value: summary.lowRatingCount,
      icon: AlertCircle,
      iconClass: k.iconRed,
    },
    {
      label: "Pending",
      value: summary.pendingCount,
      icon: StarHalf,
      iconClass: ui.iconBlue,
    },
  ];

  return (
    <>
      <PageHeader
        title="Reviews"
        subtitle="Filter product reviews and inspect customer feedback."
      />

      <div className={ui.statGrid}>
        {statItems.map((item) => {
          const Icon = item.icon;

          return (
            <article key={item.label} className={ui.statCard}>
              <div className={ui.statTop}>
                <span className={ui.statLabel}>{item.label}</span>
                <span className={`${ui.statIcon} ${item.iconClass}`}>
                  <Icon size={18} aria-hidden />
                </span>
              </div>
              <div className={ui.statValue}>{item.value}</div>
            </article>
          );
        })}
      </div>

      <section className={ui.card}>
        <div className={ui.cardHeader}>
          <h2>Review list</h2>
          {hasFilters && (
            <button
              type="button"
              className={k.clearButton}
              onClick={() => setFilters(initialFilters)}
            >
              Clear filters
            </button>
          )}
        </div>
        <div className={ui.cardBody}>
          <div className={`${ui.toolbar} ${k.filters}`}>
            <input
              type="search"
              aria-label="Search reviews"
              placeholder="Search reviewer, email, product, content..."
              value={filters.search}
              onChange={(event) => updateFilter("search", event.target.value)}
              className={ui.searchInput}
            />
            <select
              aria-label="Filter reviews by rating"
              value={filters.rating}
              onChange={(event) => updateFilter("rating", event.target.value)}
              className={ui.select}
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
            <select
              aria-label="Filter reviews by status"
              value={filters.status}
              onChange={(event) => updateFilter("status", event.target.value)}
              className={ui.select}
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
            <input
              type="text"
              aria-label="Filter reviews by product"
              placeholder="Product name, slug, or ID"
              value={filters.product}
              onChange={(event) => updateFilter("product", event.target.value)}
              className={k.filterInput}
            />
            <input
              type="date"
              aria-label="Reviews after"
              value={filters.after}
              onChange={(event) => updateFilter("after", event.target.value)}
              className={k.dateInput}
            />
            <input
              type="date"
              aria-label="Reviews before"
              value={filters.before}
              onChange={(event) => updateFilter("before", event.target.value)}
              className={k.dateInput}
            />
          </div>

          {loading && <p className={k.stateText}>Loading reviews...</p>}
          {error && <p className={ui.error}>{error}</p>}

          {!loading && !error && reviews.length === 0 && (
            <p className={ui.empty}>No reviews match your filters.</p>
          )}

          {!loading && !error && reviews.length > 0 && (
            <div className={ui.tableWrap}>
              <table className={ui.table}>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Reviewer</th>
                    <th>Rating</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Excerpt</th>
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
                        <tr key={review.id}>
                          <td>
                            <strong className={k.productName}>
                              {review.productName}
                            </strong>
                            <div className={ui.muted}>#{review.productId}</div>
                          </td>
                          <td>
                            <span className={k.reviewer}>
                              <UserRound size={15} aria-hidden />
                              {review.reviewer}
                            </span>
                            <div className={ui.muted}>
                              {review.reviewerEmail || "No email"}
                            </div>
                          </td>
                          <td>
                            <span className={k.rating}>
                              <Star size={15} aria-hidden />
                              {formatRating(review.rating)}
                            </span>
                          </td>
                          <td>
                            <span className={statusBadgeClass(review.status)}>
                              {review.status || "unknown"}
                            </span>
                          </td>
                          <td>{formatReviewDate(review.date)}</td>
                          <td className={k.excerpt}>
                            {getExcerpt(review.content)}
                          </td>
                          <td>
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
                                  <p>
                                    {review.content || "No review content."}
                                  </p>
                                </div>
                                <dl className={k.detailGrid}>
                                  <div>
                                    <dt>Reviewer email</dt>
                                    <dd>
                                      {review.reviewerEmail || "No email"}
                                    </dd>
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
        </div>
      </section>
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

function statusBadgeClass(status: string) {
  const normalized = status.toLowerCase();

  if (["approved", "approve", "published", "publish"].includes(normalized)) {
    return `${ui.badge} ${ui.badgeGreen}`;
  }

  if (["pending", "hold", "unapproved"].includes(normalized)) {
    return `${ui.badge} ${ui.badgeYellow}`;
  }

  if (["spam", "trash"].includes(normalized)) {
    return `${ui.badge} ${ui.badgeRed}`;
  }

  return `${ui.badge} ${ui.badgeGray}`;
}
