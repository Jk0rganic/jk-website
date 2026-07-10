"use client";

import { useCallback, useState, useTransition } from "react";
import ProductCard from "@/comp/card/product/product-card/productCard";
import ProductCategory from "@/comp/card/product/product-categories/productCategory";
import PostSkeleton from "@/comp/card/skeleton/product-skeleton/productSkeleton";
import { GET_PRODUCTS } from "@/graphql/graphql";
import { fetchGraphQL } from "@/lib/fetch/fetchGraphQL";

import k from "./styles.module.scss";

interface TwoClientProps {
  initialCategories: ProductCategory[];
  initialProducts: Product[];
  itemsPerPage: number;
}

export default function TwoClient({
  initialCategories,
  initialProducts,
  itemsPerPage,
}: TwoClientProps) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleCategorySelect = useCallback(
    (slug: string) => {
      if (slug === selectedCategory) return;

      setSelectedCategory(slug);
      setError(null);

      startTransition(async () => {
        try {
          const data = await fetchGraphQL<{ products: { nodes: Product[] } }>(
            GET_PRODUCTS,
            {
              first: itemsPerPage,
              categorySlug: slug === "all" ? undefined : slug,
            },
          );

          setProducts(data?.products?.nodes ?? []);
        } catch (err) {
          console.error(err);
          setError(
            err instanceof Error ? err.message : "Failed to load products",
          );
        }
      });
    },
    [itemsPerPage, selectedCategory],
  );

  return (
    <>
      <ProductCategory
        categories={initialCategories}
        activeCategory={selectedCategory}
        onSelectCategory={handleCategorySelect}
      />

      <div className={k.grid}>
        {isPending && (
          <PostSkeleton
            count={itemsPerPage}
            height={{ height: "clamp(15rem, 25vw, 20.65rem)" }}
          />
        )}

        {error && <p className={k.error}>{error}</p>}

        {!isPending && !error && products.length === 0 && (
          <p className={k.empty}>No products found in this category.</p>
        )}

        {!isPending &&
          products.map((product, index) => (
            <ProductCard key={product.slug} product={product} index={index} />
          ))}
      </div>
    </>
  );
}
