"use client";

import k from "./styles.module.scss";

const FALLBACK_RATING = 3.5;

function buildStars(rating: number) {
  const safeRating = Math.max(0, Math.min(5, rating));

  const fullStars = Math.floor(safeRating);
  const hasHalfStar = safeRating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <>
      {Array.from({ length: fullStars }, (_, index) => (
        <span key={`full-${index as number}`} className={k.fullStar}>
          ★
        </span>
      ))}

      {hasHalfStar && <span className={k.halfStar}>★</span>}

      {Array.from({ length: emptyStars }, (_, index) => (
        <span key={`empty-${index as number}`} className={k.emptyStar}>
          ☆
        </span>
      ))}
    </>
  );
}

interface ProductRatingProps {
  rating?: number | null;
}

export default function ProductRating({ rating }: ProductRatingProps) {
  const safeRating =
    typeof rating === "number" && rating > 0 ? rating : FALLBACK_RATING;

  return <div className={k.rating}>{buildStars(safeRating)}</div>;
}
