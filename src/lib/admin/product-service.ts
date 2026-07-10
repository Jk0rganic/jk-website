import type { ProductFormValues } from "./product-schema";

export type WooCategory = {
  id: number;
  name: string;
  slug: string;
};

export type WooProductDetail = {
  id: number;
  name: string;
  slug: string;
  type: "simple" | "variable" | string;
  status: string;
  sku: string;
  description: string;
  short_description: string;
  regular_price: string;
  sale_price: string;
  price: string;
  manage_stock: boolean;
  stock_quantity: number | null;
  stock_status: "instock" | "outofstock" | string;
  featured?: boolean;
  categories?: Array<{ id: number; name: string; slug: string }>;
  images?: Array<{ id: number; src: string; alt: string }>;
  related_ids?: number[];
  upsell_ids?: number[];
  cross_sell_ids?: number[];
};

export type WooVariation = {
  id: number;
  sku: string;
  regular_price: string;
  sale_price: string;
  manage_stock: boolean;
  stock_quantity: number | null;
  stock_status: string;
  attributes: Array<{ name: string; option: string }>;
};

export type AdminProductDetail = {
  id: number;
  name: string;
  slug: string;
  type: string;
  sku: string;
  shortDescription: string;
  description: string;
  regularPrice: string;
  salePrice: string;
  displayPrice: string;
  manageStock: boolean;
  stockQuantity: number | null;
  inStock: boolean;
  published: boolean;
  featured: boolean;
  categories: WooCategory[];
  categoryIds: number[];
  relatedProductIds: number[];
  crossSellProductIds: number[];
  upsellProductIds: number[];
  imageUrl: string | null;
  imageId?: number;
  variations: AdminVariation[];
};

export type AdminVariation = {
  id: number;
  label: string;
  sku: string;
  regularPrice: string;
  salePrice: string;
  manageStock: boolean;
  stockQuantity: number | null;
  inStock: boolean;
};

export function mapWooProductDetail(
  product: WooProductDetail,
): AdminProductDetail {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    type: product.type,
    sku: product.sku || "",
    shortDescription: product.short_description || "",
    description: product.description || "",
    regularPrice: product.regular_price || "",
    salePrice: product.sale_price || "",
    displayPrice: product.price || product.regular_price || "",
    manageStock: Boolean(product.manage_stock),
    stockQuantity: product.stock_quantity,
    inStock: product.stock_status !== "outofstock",
    published: product.status === "publish",
    featured: Boolean(product.featured),
    categories: (product.categories ?? []).map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
    })),
    categoryIds: (product.categories ?? []).map((category) => category.id),
    relatedProductIds: product.related_ids ?? [],
    crossSellProductIds: product.cross_sell_ids ?? [],
    upsellProductIds: product.upsell_ids ?? [],
    imageUrl: product.images?.[0]?.src ?? null,
    imageId: product.images?.[0]?.id,
    variations: [],
  };
}

export function mapWooVariation(variation: WooVariation): AdminVariation {
  const label =
    variation.attributes?.map((attr) => attr.option).join(" · ") ||
    `Variation #${variation.id}`;

  return {
    id: variation.id,
    label,
    sku: variation.sku || "",
    regularPrice: variation.regular_price || "",
    salePrice: variation.sale_price || "",
    manageStock: Boolean(variation.manage_stock),
    stockQuantity: variation.stock_quantity,
    inStock: variation.stock_status !== "outofstock",
  };
}

export function productDetailToFormValues(
  product: AdminProductDetail,
): ProductFormValues {
  return {
    name: product.name,
    shortDescription: product.shortDescription,
    description: product.description,
    sku: product.sku,
    regularPrice: product.regularPrice,
    salePrice: product.salePrice,
    manageStock: product.manageStock,
    stockQuantity:
      product.stockQuantity !== null ? String(product.stockQuantity) : "",
    inStock: product.inStock,
    published: product.published,
    featured: product.featured,
    categoryIds: product.categoryIds,
    relatedProductIds: product.relatedProductIds,
    crossSellProductIds: product.crossSellProductIds,
    upsellProductIds: product.upsellProductIds,
    imageId: product.imageId,
  };
}

export function formValuesToWooPayload(values: ProductFormValues) {
  const stockQuantity =
    values.manageStock && values.stockQuantity
      ? Number(values.stockQuantity)
      : null;

  const payload = {
    name: values.name,
    short_description: values.shortDescription || "",
    description: values.description || "",
    sku: values.sku || "",
    regular_price: values.regularPrice,
    sale_price: values.salePrice || "",
    status: values.published ? "publish" : "draft",
    manage_stock: values.manageStock,
    stock_quantity: stockQuantity,
    stock_status: values.inStock ? "instock" : "outofstock",
    featured: values.featured,
    categories: values.categoryIds.map((id) => ({ id })),
    related_ids: values.relatedProductIds ?? [],
    cross_sell_ids: values.crossSellProductIds ?? [],
    upsell_ids: values.upsellProductIds ?? [],
  };

  return values.imageId
    ? {
        ...payload,
        images: [{ id: values.imageId }],
      }
    : payload;
}

export function variationToWooPayload(variation: {
  regularPrice: string;
  salePrice?: string;
  manageStock: boolean;
  stockQuantity?: string;
  inStock: boolean;
}) {
  const stockQuantity =
    variation.manageStock && variation.stockQuantity
      ? Number(variation.stockQuantity)
      : null;

  return {
    regular_price: variation.regularPrice,
    sale_price: variation.salePrice || "",
    manage_stock: variation.manageStock,
    stock_quantity: stockQuantity,
    stock_status: variation.inStock ? "instock" : "outofstock",
  };
}

export function createProductPayload(values: ProductFormValues) {
  return {
    type: "simple",
    ...formValuesToWooPayload(values),
  };
}
