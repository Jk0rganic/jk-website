export type ProductInventoryItem = {
  id: number;
  name: string;
  sku: string;
  stockStatus: string;
  stockQuantity: number | null;
  price: string;
  status: string;
  type: string;
  categories: string[];
  primaryCategory: string;
  imageUrl: string | null;
};

export type InventorySummary = {
  total: number;
  inStock: number;
  lowStock: number;
  outOfStock: number;
};

type WooProduct = {
  id: number;
  name: string;
  sku: string;
  stock_status: string;
  stock_quantity: number | null;
  price: string;
  status: string;
  type?: string;
  categories?: Array<{ name: string }>;
  images?: Array<{ src: string; alt?: string }>;
};

const LOW_STOCK_THRESHOLD = 5;

export function mapWooProduct(product: WooProduct): ProductInventoryItem {
  const categories = (product.categories ?? []).map((c) => c.name);

  return {
    id: product.id,
    name: product.name,
    sku: product.sku || "—",
    stockStatus: product.stock_status,
    stockQuantity: product.stock_quantity,
    price: product.price,
    status: product.status,
    type: product.type || "simple",
    categories,
    primaryCategory: categories[0] ?? "—",
    imageUrl: product.images?.[0]?.src ?? null,
  };
}

export function getProductPublishStatus(status: string): {
  label: string;
  tone: "active" | "draft" | "other";
} {
  if (status === "publish") {
    return { label: "Active", tone: "active" };
  }

  if (status === "draft") {
    return { label: "Draft", tone: "draft" };
  }

  return { label: status, tone: "other" };
}

export function formatStockCount(product: ProductInventoryItem): string {
  if (product.stockStatus === "outofstock") {
    return "0";
  }

  if (product.stockQuantity !== null) {
    return String(product.stockQuantity);
  }

  return "—";
}

export { createProductPayload } from "./product-service";

export function summarizeInventory(
  products: ProductInventoryItem[],
): InventorySummary {
  return products.reduce(
    (acc, product) => {
      acc.total += 1;

      if (product.stockStatus === "outofstock") {
        acc.outOfStock += 1;
      } else if (
        product.stockQuantity !== null &&
        product.stockQuantity <= LOW_STOCK_THRESHOLD
      ) {
        acc.lowStock += 1;
      } else {
        acc.inStock += 1;
      }

      return acc;
    },
    { total: 0, inStock: 0, lowStock: 0, outOfStock: 0 },
  );
}

export function isLowStock(product: ProductInventoryItem): boolean {
  return (
    product.stockStatus !== "outofstock" &&
    product.stockQuantity !== null &&
    product.stockQuantity <= LOW_STOCK_THRESHOLD
  );
}
