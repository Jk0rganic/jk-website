import HeroHome from "./hero";
import One from "./one";
import Two from "./two";
import Three from "./three";
import Four from "./four";
import Five from "./five";
import Six from "./six";

import { fetchGraphQL } from "@/lib/fetch/fetchGraphQL";
import { GET_CATEGORIES, GET_PRODUCTS } from "@/graphql/graphql";

const ITEMS_PER_PAGE = 8;

type CategoriesResponse = {
  productCategories: {
    nodes: ProductCategory[];
  };
};

type ProductsResponse = {
  products: {
    nodes: Product[];
  };
};


async function getHomepageData(): Promise<{
  categories: ProductCategory[];
  products: Product[];
}> {
  const [categoriesRes, productsRes] = await Promise.all([
    fetchGraphQL<CategoriesResponse>(GET_CATEGORIES),
    fetchGraphQL<ProductsResponse>(GET_PRODUCTS, {
      first: ITEMS_PER_PAGE,
      categorySlug: null,
    }),
  ]);

  return {
    categories: categoriesRes.productCategories.nodes,
    products: productsRes.products.nodes,
  };
}

export default async function Homepage() {
  const { categories, products } = await getHomepageData();

  return (
    <>
      <HeroHome />
      <Six />
      <One />

      <Two
        categories={categories}
        initialProducts={products}
        initialActiveCategory="all"
      />

      <Five />
      <Three />
      <Four />
    </>
  );
}
