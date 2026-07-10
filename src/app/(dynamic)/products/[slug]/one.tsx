"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import ProductCard from "@/comp/card/product/product-card/productCard";
import PostSkeleton from "@/comp/card/skeleton/product-skeleton/productSkeleton";
import Section from "@/comp/section/section";
import { GET_PRODUCTS } from "@/graphql/graphql";
import { fetchGraphQL } from "@/lib/fetch/fetchGraphQL";
import ShopCategory from "../comp/shop-category/shop-category";
import k from "./styles.module.scss";

const POSTS_PER_PAGE = 8;

type ProductsResponse = {
  products: {
    nodes: Product[];
    pageInfo?: {
      endCursor: string | null;
      hasNextPage: boolean;
    };
  };
};

type Props = {
  categories: { slug: string; name: string }[];
  initialProducts: Product[];
  initialActiveCategory: string;
  initialPageInfo: {
    endCursor: string | null;
    hasNextPage: boolean;
  };
};

export default function One({
  categories = [],
  initialProducts = [],
  initialActiveCategory = "all",
  initialPageInfo = { endCursor: null, hasNextPage: false },
}: Props) {
  const [products, setProducts] = useState(initialProducts);
  const [loadingMore, setLoadingMore] = useState(false);
  const [afterCursor, setAfterCursor] = useState(initialPageInfo.endCursor);
  const [hasNextPage, setHasNextPage] = useState(initialPageInfo.hasNextPage);
  const [activeCategory, setActiveCategory] = useState(initialActiveCategory);
  const [isPending, startTransition] = useTransition();

  const cacheRef = useRef<
    Record<
      string,
      { nodes: Product[]; endCursor: string | null; hasNextPage: boolean }
    >
  >({
    [initialActiveCategory]: {
      nodes: initialProducts,
      endCursor: initialPageInfo.endCursor,
      hasNextPage: initialPageInfo.hasNextPage,
    },
  });

  const selectedCategory =
    activeCategory === "all"
      ? "All Products"
      : categories.find((c) => c.slug === activeCategory)?.name || "Unknown";

  const handleCategorySelect = useCallback(
    (slug: string) => {
      if (slug === activeCategory) return;

      setActiveCategory(slug);

      const cached = cacheRef.current[slug];
      if (cached) {
        setProducts(cached.nodes);
        setAfterCursor(cached.endCursor);
        setHasNextPage(cached.hasNextPage);
        return;
      }

      startTransition(async () => {
        try {
          const variables =
            slug === "all"
              ? { first: POSTS_PER_PAGE }
              : { first: POSTS_PER_PAGE, categorySlug: slug };

          const res = await fetchGraphQL<ProductsResponse>(
            GET_PRODUCTS,
            variables,
          );

          const nodes = res.products.nodes ?? [];
          const endCursor = res.products.pageInfo?.endCursor ?? null;
          const hasNext = res.products.pageInfo?.hasNextPage ?? false;

          cacheRef.current[slug] = { nodes, endCursor, hasNextPage: hasNext };

          setProducts(nodes);
          setAfterCursor(endCursor);
          setHasNextPage(hasNext);
        } catch (error) {
          console.error(error);
          setProducts([]);
        }
      });
    },
    [activeCategory],
  );

  const loadMoreProducts = async () => {
    if (!hasNextPage || !afterCursor) return;

    setLoadingMore(true);

    try {
      const variables =
        activeCategory === "all"
          ? { first: POSTS_PER_PAGE, after: afterCursor }
          : {
              first: POSTS_PER_PAGE,
              after: afterCursor,
              categorySlug: activeCategory,
            };

      const res = await fetchGraphQL<ProductsResponse>(GET_PRODUCTS, variables);

      const newNodes = res.products.nodes ?? [];
      const endCursor = res.products.pageInfo?.endCursor ?? null;
      const hasNext = res.products.pageInfo?.hasNextPage ?? false;

      setProducts((prev) => [...prev, ...newNodes]);
      setAfterCursor(endCursor);
      setHasNextPage(hasNext);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <Section className={k.one}>
      <h2>Home / Shop / {selectedCategory}</h2>

      <div className={k.wrapper}>
        <ShopCategory
          categories={categories}
          activeCategory={activeCategory}
          // onSelectCategory={handleCategorySelect}
        />

        <div className={k.grid_wrapper}>
          <div className={k.grid}>
            {isPending && <PostSkeleton count={POSTS_PER_PAGE} />}

            {!isPending && products.length === 0 && !loadingMore && (
              <p className={k.no_products}>No products found.</p>
            )}

            {!isPending &&
              products.map((prod, i) => (
                <ProductCard key={prod.slug} product={prod} index={i} />
              ))}

            {loadingMore && <PostSkeleton count={POSTS_PER_PAGE} />}
          </div>

          {hasNextPage && (
            <div className={k.load_more}>
              <button
                type="button"
                className={k.loadMore}
                onClick={loadMoreProducts}
                disabled={loadingMore}
              >
                {loadingMore ? "Loading..." : "Load More"}
              </button>
            </div>
          )}
        </div>
      </div>
    </Section>
  );
}
