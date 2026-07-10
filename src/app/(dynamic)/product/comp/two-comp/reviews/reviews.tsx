import ProductRating from "@/comp/card/product/product-rating/product-rating";
import { ReviewForm } from "@/comp/comments-form/comments-form";
import { formatDate } from "@/utils/formatDate";
import { maskEmail } from "@/utils/mask";
import k from "./import.module.scss";

interface Props {
  product: Product | null;
}

export default function Reviews({ product }: Props) {
  const reviews = product?.reviews?.nodes ?? [];

  return (
    <div className={k.reviews}>
      {reviews.length === 0 ? (
        <p>No reviews yet. Be the first to share your experience!</p>
      ) : (
        <ul>
          {reviews.map((review, i) => (
            <li key={i as number}>
              <div className={k.review_header}>
                <div>
                  <h6>{maskEmail(review.author?.name)}:</h6>
                  <span>{formatDate(review.dateGmt)}</span>
                </div>
                <ProductRating rating={parseFloat(review.averageRating) || 0} />
              </div>
              <div
                dangerouslySetInnerHTML={{
                  __html: review.content ?? "No comment provided.",
                }}
              />
            </li>
          ))}
        </ul>
      )}
      <ReviewForm productId={product?.databaseId ?? 0} />
    </div>
  );
}
