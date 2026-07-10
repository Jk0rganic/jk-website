"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "../components/ui/page-header";
import styles from "./styles.module.scss";

type ReviewRaw = {
  name: string;
  product: string;
  rating: number;
  comment: string;
  date: string;
};

type Review = ReviewRaw & {
  id: string;
  initials: string;
  needsAttention: boolean;
};

const totalPublishedReviews = 612;

const reviewRaw: ReviewRaw[] = [
  {
    name: "Amina Yusuf",
    product: "Moringa Powder 250g",
    rating: 5,
    comment: "Noticeably more energy within a week. Will reorder for sure.",
    date: "Jul 7, 2026",
  },
  {
    name: "David Kamau",
    product: "Raw Forest Honey 500g",
    rating: 5,
    comment: "Best honey I've had - pure and not overly sweet.",
    date: "Jul 6, 2026",
  },
  {
    name: "Grace Wanjiru",
    product: "Cold-Pressed Coconut Oil",
    rating: 4,
    comment: "Great quality, though delivery took a bit longer than expected.",
    date: "Jul 5, 2026",
  },
  {
    name: "Peter Otieno",
    product: "Turmeric Capsules 60ct",
    rating: 3,
    comment: "Works fine but the capsules are quite large to swallow.",
    date: "Jul 4, 2026",
  },
  {
    name: "Fatuma Ali",
    product: "Baobab Powder 200g",
    rating: 5,
    comment: "Lovely tangy flavour, great in smoothies every morning.",
    date: "Jul 3, 2026",
  },
  {
    name: "Samuel Kiptoo",
    product: "Aloe Vera Juice 1L",
    rating: 2,
    comment: "Bottle arrived half empty, seal looked broken on arrival.",
    date: "Jul 1, 2026",
  },
  {
    name: "Mary Achieng",
    product: "Herbal Detox Tea 20 bags",
    rating: 4,
    comment: "Nice calming taste before bed. Would buy again.",
    date: "Jun 29, 2026",
  },
];

const starSlots = [1, 2, 3, 4, 5];

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function mapReview(raw: ReviewRaw, index: number): Review {
  return {
    ...raw,
    id: `${index}-${raw.name.toLowerCase().replaceAll(" ", "-")}`,
    initials: getInitials(raw.name),
    needsAttention: raw.rating <= 3,
  };
}

function getReviewStats(reviews: Review[]) {
  const averageRating =
    reviews.reduce((total, review) => total + review.rating, 0) /
    reviews.length;
  const fiveStarShare = Math.round(
    (reviews.filter((review) => review.rating === 5).length / reviews.length) *
      100,
  );
  const needsAttention = reviews.filter((review) => review.needsAttention);

  return [
    { label: "Average rating", value: `${averageRating.toFixed(1)} / 5` },
    { label: "Total reviews", value: totalPublishedReviews.toLocaleString() },
    { label: "5-star share", value: `${fiveStarShare}%` },
    {
      label: "Needs attention (<=3 stars)",
      value: String(needsAttention.length),
    },
  ];
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span
      aria-label={`${rating} out of 5 stars`}
      className={styles.stars}
      role="img"
    >
      {starSlots.map((slot) => (
        <span
          aria-hidden="true"
          className={slot <= rating ? styles.starFilled : styles.starEmpty}
          key={slot}
        >
          ★
        </span>
      ))}
    </span>
  );
}

export default function ReviewsPage() {
  const reviews = useMemo(() => reviewRaw.map(mapReview), []);
  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);

  const stats = useMemo(() => getReviewStats(reviews), [reviews]);

  useEffect(() => {
    if (!selectedReview) {
      return;
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSelectedReview(null);
      }
    }

    window.addEventListener("keydown", closeOnEscape);

    return () => {
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [selectedReview]);

  const filteredReviews = reviews.filter((review) => {
    const query = search.trim().toLowerCase();
    const matchesSearch =
      !query ||
      review.name.toLowerCase().includes(query) ||
      review.product.toLowerCase().includes(query) ||
      review.comment.toLowerCase().includes(query);

    const matchesRating =
      ratingFilter === "all" ||
      (ratingFilter === "low"
        ? review.rating <= 2
        : review.rating === Number(ratingFilter));

    return matchesSearch && matchesRating;
  });

  return (
    <>
      <PageHeader
        title="Reviews"
        subtitle="What customers are saying about your products."
      />

      <div className={styles.page}>
        <section className={styles.statsGrid} aria-label="Review stats">
          {stats.map((stat) => (
            <article className={styles.statCard} key={stat.label}>
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
            </article>
          ))}
        </section>

        <section className={styles.panel} aria-label="Customer reviews">
          <div className={styles.toolbar}>
            <label className={styles.searchField}>
              <span aria-hidden="true">Search</span>
              <input
                aria-label="Search product or customer"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search product or customer..."
                type="search"
                value={search}
              />
            </label>

            <label className={styles.filterField}>
              <span className={styles.srOnly}>Filter by rating</span>
              <select
                aria-label="Filter by rating"
                onChange={(event) => setRatingFilter(event.target.value)}
                value={ratingFilter}
              >
                <option value="all">All ratings</option>
                <option value="5">5 stars</option>
                <option value="4">4 stars</option>
                <option value="3">3 stars</option>
                <option value="low">1-2 stars</option>
              </select>
            </label>
          </div>

          <div className={styles.reviewList}>
            {filteredReviews.map((review) => (
              <button
                aria-label={`Open review from ${review.name} for ${review.product}`}
                className={styles.reviewRow}
                key={review.id}
                onClick={() => setSelectedReview(review)}
                type="button"
              >
                <span className={styles.avatar}>{review.initials}</span>
                <span className={styles.reviewBody}>
                  <span className={styles.reviewMeta}>
                    <span className={styles.customerLine}>
                      <strong>{review.name}</strong>
                      <span> on {review.product}</span>
                    </span>
                    <time>{review.date}</time>
                  </span>

                  <span className={styles.ratingLine}>
                    <StarRating rating={review.rating} />
                    <span
                      className={
                        review.needsAttention
                          ? styles.ratingBadgeAttention
                          : review.rating === 3
                            ? styles.ratingBadgeNeutral
                            : styles.ratingBadgePositive
                      }
                    >
                      {review.rating}.0
                    </span>
                  </span>

                  <span className={styles.comment}>{review.comment}</span>
                  {review.comment.length > 90 && (
                    <span className={styles.readMore}>Read more</span>
                  )}
                </span>
              </button>
            ))}

            {filteredReviews.length === 0 && (
              <p className={styles.emptyState}>
                No reviews match this search and rating filter.
              </p>
            )}
          </div>
        </section>
      </div>

      {selectedReview && (
        <div className={styles.modalBackdrop}>
          <button
            aria-label="Close review"
            className={styles.backdropButton}
            onClick={() => setSelectedReview(null)}
            type="button"
          />
          <section
            aria-label={`Review from ${selectedReview.name}`}
            aria-modal="true"
            className={styles.modal}
            role="dialog"
          >
            <div className={styles.modalHeader}>
              <div>
                <span className={styles.avatar}>{selectedReview.initials}</span>
                <h2>{selectedReview.name}</h2>
                <p>{selectedReview.product}</p>
              </div>
              <button
                aria-label="Close review"
                className={styles.closeButton}
                onClick={() => setSelectedReview(null)}
                type="button"
              >
                x
              </button>
            </div>

            <div className={styles.modalRating}>
              <StarRating rating={selectedReview.rating} />
              <span
                className={
                  selectedReview.needsAttention
                    ? styles.ratingBadgeAttention
                    : styles.ratingBadgePositive
                }
              >
                {selectedReview.needsAttention
                  ? "Needs attention"
                  : `${selectedReview.rating}.0`}
              </span>
              <time>{selectedReview.date}</time>
            </div>

            <p className={styles.modalComment}>{selectedReview.comment}</p>
          </section>
        </div>
      )}
    </>
  );
}
