import ProductRating from "@/comp/card/product/product-rating/product-rating";
import k from "./styles.module.scss";

export default function RatingReviews({
  reviewCount,
  averageRating,
}: {
  reviewCount: number;
  averageRating: number;
}) {
  return (
    <div className={k.rating_reviews}>
      <ProductRating rating={parseFloat(String(averageRating))} />
      <span>
        ({reviewCount} customer{reviewCount !== 1 ? "s" : ""} reviews)
      </span>
    </div>
  );
}
