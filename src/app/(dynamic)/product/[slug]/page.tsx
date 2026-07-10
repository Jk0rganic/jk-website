import type { Metadata } from "next";
import Head from "next/head";
import Script from "next/script";
import { cache } from "react";
import NotFound from "@/app/not-found";
import { GET_PRODUCT_BY_SLUG } from "@/graphql/graphql";
import { fetchGraphQL } from "@/lib/fetch/fetchGraphQL";
import type { SinglePagePropsType } from "@/types/types";
import { productSchema } from "@/utils/seo/schema";
import { siteMetadata } from "@/utils/seo/siteMetadata";
import One from "./one";
import Three from "./three";
import Two from "./two";

const stripHtml = (value?: string) => value?.replace(/<[^>]*>/g, "").trim();

const getProduct = cache(async (slug: string): Promise<Product | null> => {
  const { product } = await fetchGraphQL<
    { product: Product },
    GetProductBySlugVariables
  >(GET_PRODUCT_BY_SLUG, { slug });

  return product ?? null;
});

export async function generateMetadata({
  params,
}: SinglePagePropsType): Promise<Metadata> {
  const { slug } = await params;

  const product = await getProduct(slug);

  if (!product) {
    return siteMetadata({
      title: "Product Not Found | JK Organics Kenya",
      description: "The product you're looking for does not exist.",
      url: `/products/${slug}`,
    });
  }

  const description =
    stripHtml(product.description)?.slice(0, 200) ||
    `Discover ${product.name} — a premium organic product by JK Organics.`;

  return siteMetadata({
    title: `${product.name} | JK Organics Kenya`,
    description,
    url: `/products/${product.slug}`,
    image: product.image?.mediaItemUrl || "",
    keywords: [
      product.name,
      "organic skincare Kenya",
      "JK Organics",
      ...(product.productTags?.nodes ?? []).map(({ name }) => name),
      ...(product.productCategories?.nodes ?? []).map(({ name }) => name),
    ].join(", "),
  });
}

export default async function ProductPage({ params }: SinglePagePropsType) {
  const { slug } = await params;

  const product = await getProduct(slug);

  if (!product) return <NotFound />;

  return (
    <>
      {/* <Head>
        <Script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(productSchema(product).toString()),
          }}
        />
      </Head> */}
      <One product={product} />
      <Two product={product} />
      <Three
        relatedProducts={
          product.related?.nodes?.filter(
            ({ slug: relatedSlug }) => relatedSlug !== slug,
          ) ?? []
        }
      />
    </>
  );
}
