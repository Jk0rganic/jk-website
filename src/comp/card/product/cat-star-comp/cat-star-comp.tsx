import k from "./styles.module.scss"; // Or wherever your CSS module is
import CatCatProduct from "./cat-cat-product";
import ProductRating from "../product-rating/product-rating";

export default function CatStarComp({ product }: { product: Product }) {
  const ratings = product.rating;
  return (
    <div className={k.cat_wrapper}>
      <ProductRating rating={ratings} />
      <CatCatProduct product={product} k={k} />
    </div>
  );
}
