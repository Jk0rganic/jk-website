"use server";

import { fetchWoo } from "@/lib/fetch/fetchRest";

export type SpotlightBadge = "bestseller" | "featured";

export type SpotlightProduct = {
  id: number;
  name: string;
  slug: string;
  price: string;
  regularPrice: string;
  salePrice: string;
  imageUrl: string | null;
  imageAlt: string;
  badge: SpotlightBadge;
};

type WooRestProduct = {
  id: number;
  name: string;
  slug: string;
  price: string;
  regular_price: string;
  sale_price: string;
  images?: Array<{ src: string; alt?: string }>;
};

// Keeps both pools small so the "manually featured" picks always survive
// into the rotation instead of being crowded out by real bestsellers.
const BESTSELLER_COUNT = 4;
const FEATURED_COUNT = 3;
const SPOTLIGHT_REVALIDATE_SECONDS = 900;

function mapProduct(
  product: WooRestProduct,
  badge: SpotlightBadge,
): SpotlightProduct {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    price: product.price,
    regularPrice: product.regular_price,
    salePrice: product.sale_price,
    imageUrl: product.images?.[0]?.src ?? null,
    imageAlt: product.images?.[0]?.alt || product.name,
    badge,
  };
}

async function fetchProductPool(
  query: string,
  badge: SpotlightBadge,
): Promise<SpotlightProduct[]> {
  try {
    const products = await fetchWoo<WooRestProduct[]>(query, {
      revalidate: SPOTLIGHT_REVALIDATE_SECONDS,
    });

    return products.map((product) => mapProduct(product, badge));
  } catch {
    // WooCommerce hiccups shouldn't break the storefront shell.
    return [];
  }
}

/**
 * Real bestsellers (ranked by WooCommerce's own sales count) blended with
 * whatever the admin has manually marked "featured" — lets merchandising
 * spotlight a slow-moving product without pretending it's a bestseller.
 */
export async function getSpotlightPool(): Promise<SpotlightProduct[]> {
  const [bestsellers, featured] = await Promise.all([
    fetchProductPool(
      `products?orderby=popularity&order=desc&status=publish&stock_status=instock&per_page=${BESTSELLER_COUNT}`,
      "bestseller",
    ),
    fetchProductPool(
      `products?featured=true&status=publish&stock_status=instock&per_page=${FEATURED_COUNT}`,
      "featured",
    ),
  ]);

  const seenIds = new Set<number>();
  const pool: SpotlightProduct[] = [];

  for (const product of [...bestsellers, ...featured]) {
    if (seenIds.has(product.id)) continue;
    seenIds.add(product.id);
    pool.push(product);
  }

  return pool;
}
