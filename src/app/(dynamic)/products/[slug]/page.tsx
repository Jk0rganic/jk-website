import One from "./one";
import { seoMeta } from "@/utils/seo/seoMeta";
import Hero from "./hero";
import { GET_CATEGORIES, GET_PRODUCTS } from "@/graphql/graphql";
import { fetchGraphQL } from "@/lib/fetch/fetchGraphQL";

export const metadata = seoMeta.products;

const ITEMS_PER_PAGE = 8;

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;

  const categorySlug = slug === "all" ? null : slug;

  const categoryData = await fetchGraphQL<{
    productCategories: {
      nodes: ProductCategory[];
    };
  }>(GET_CATEGORIES);
  const categories = categoryData.productCategories.nodes;

  const productData = await fetchGraphQL<{
    products: {
      nodes: Product[];
      pageInfo: { endCursor: string | null; hasNextPage: boolean };
    };
  }>(GET_PRODUCTS, {
    first: ITEMS_PER_PAGE,
    after: null,
    categorySlug,
  });

  const products = productData?.products?.nodes || [];
  const pageInfo = productData?.products?.pageInfo || {
    endCursor: null,
    hasNextPage: false,
  };

  return (
    <>
      <Hero />
      <One
        categories={categories}
        initialProducts={products}
        initialActiveCategory={categorySlug || "all"}
        initialPageInfo={pageInfo}
      />
    </>
  );
}
