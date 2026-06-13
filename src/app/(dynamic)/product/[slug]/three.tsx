import k from "./styles.module.scss";
import ProductCard from "@/comp/card/product/product-card/productCard";
import Section from "@/comp/section/section";

type Props = {
  relatedProducts?: Product[];
};

export default function Three({ relatedProducts }: Props) {
  if (!relatedProducts || relatedProducts.length === 0) {
    return null;
  }

  return (
    <Section className={k.three}>
      <h4>Related Products</h4>
      <div className={k.grid}>
        {relatedProducts.slice(0, 4).map((prod, index) => (
          <ProductCard key={prod.slug} product={prod} index={index} />
        ))}
      </div>
    </Section>
  );
}
