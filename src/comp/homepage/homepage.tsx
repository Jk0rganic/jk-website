import { GET_CATEGORIES, GET_PRODUCTS } from "@/graphql/graphql";
import { fetchGraphQL } from "@/lib/fetch/fetchGraphQL";
import Five from "./five";
import Four from "./four";
import HeroHome from "./hero";
import One from "./one";
import Six from "./six";
import Three from "./three";
import Two from "./two";

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
