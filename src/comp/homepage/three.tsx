import { GET_PRODUCTS } from "@/graphql/graphql";
import { fetchGraphQL } from "@/lib/fetch/fetchGraphQL";
import ProductCard from "../card/product/product-card/productCard";
import Section from "../section/section";

import k from "./styles.module.scss";

type ProductsResponse = {
  products: {
    nodes: Product[];
  };
};

export default async function Three() {
  const data = await fetchGraphQL<ProductsResponse>(GET_PRODUCTS, { first: 4 });

  const products = data?.products?.nodes ?? [];

  return (
    <Section className={k.three}>
      <h3>Newest Products</h3>

      <div className={k.grid}>
        {products.map((prod, index) => (
          <ProductCard
            key={prod.slug}
            product={prod}
            index={index}
            showNew={true}
          />
        ))}
      </div>
    </Section>
  );
}
