"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import { GET_PRODUCTS } from "@/graphql/graphql";
import useIsMobile from "@/hooks/useIsMobile";
import { fetchGraphQL } from "@/lib/fetch/fetchGraphQL";
import ProductCard from "../card/product/product-card/productCard";
import ProductCategory from "../card/product/product-categories/productCategory";
import ProductCategorySkeleton from "../card/skeleton/product-category-skeleton/product-category-skeleton";
import PostSkeleton from "../card/skeleton/product-skeleton/productSkeleton";
import Section from "../section/section";

import k from "./styles.module.scss";

const ITEMS_PER_PAGE = 8;

type TwoProps = {
  categories: ProductCategory[];
  initialProducts: Product[];
  initialActiveCategory?: string;
};

type ProductsResponse = {
  products: { nodes: Product[] };
};

export default function Two({
  categories = [],
  initialProducts = [],
  initialActiveCategory = "all",
}: TwoProps) {
  const isMobile = useIsMobile(768);

  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [activeCategory, setActiveCategory] = useState(initialActiveCategory);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const cacheRef = useRef<Record<string, Product[]>>({
    [initialActiveCategory]: initialProducts,
  });

  const handleCategorySelect = useCallback(
    (slug: string) => {
      if (slug === activeCategory) return;

      setActiveCategory(slug);
      setError(null);

      const cached = cacheRef.current[slug];
      if (cached) {
        setProducts(cached);
        return;
      }

      startTransition(async () => {
        try {
          const variables =
            slug === "all"
              ? { first: ITEMS_PER_PAGE }
              : { first: ITEMS_PER_PAGE, categorySlug: slug };

          const data = await fetchGraphQL<ProductsResponse>(
            GET_PRODUCTS,
            variables,
          );
          const fetched = data?.products?.nodes ?? [];

          cacheRef.current[slug] = fetched;
          setProducts(fetched);
        } catch (err) {
          console.error(err);
          setError("Failed to fetch products. Please try again.");
          setProducts([]);
        }
      });
    },
    [activeCategory],
  );

  return (
    <Section className={k.two}>
      {isMobile && <h2>Latest Products</h2>}

      {!isMobile &&
        (categories.length === 0 ? (
          <ProductCategorySkeleton />
        ) : (
          <ProductCategory
            categories={categories}
            activeCategory={activeCategory}
            onSelectCategory={handleCategorySelect}
          />
        ))}

      <div className={k.grid}>
        {isPending && <PostSkeleton count={ITEMS_PER_PAGE} />}

        {!isPending && error && (
          <p className={k.empty} aria-live="polite">
            {error}
          </p>
        )}

        {!isPending && !error && products.length === 0 && (
          <p className={k.empty} aria-live="polite">
            No products found in this category.
          </p>
        )}

        {!isPending &&
          !error &&
          products.map((product, index) => (
            <ProductCard key={product.slug} product={product} index={index} />
          ))}
      </div>
    </Section>
  );
}
