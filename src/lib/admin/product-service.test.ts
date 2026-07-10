import { describe, expect, it } from "vitest";
import { productFormSchema } from "./product-schema";
import {
  createProductPayload,
  formValuesToWooPayload,
  mapWooProductDetail,
  mapWooVariation,
  productDetailToFormValues,
  variationToWooPayload,
} from "./product-service";

describe("productFormSchema", () => {
  it("accepts valid product input", () => {
    const result = productFormSchema.safeParse({
      name: "Organic Honey",
      regularPrice: "850",
      manageStock: true,
      stockQuantity: "12",
      inStock: true,
      published: true,
      featured: false,
      categoryIds: [3, 7],
      imageId: 44,
      relatedProductIds: [],
      crossSellProductIds: [],
      upsellProductIds: [],
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid prices", () => {
    const result = productFormSchema.safeParse({
      name: "Organic Honey",
      regularPrice: "free",
      manageStock: false,
      inStock: true,
      published: true,
      featured: false,
    });

    expect(result.success).toBe(false);
  });
});

describe("formValuesToWooPayload", () => {
  it("maps friendly form fields to WooCommerce API fields", () => {
    const payload = formValuesToWooPayload({
      name: "Face Serum",
      shortDescription: "Glow daily",
      description: "Full details",
      sku: "FS-01",
      regularPrice: "1500",
      salePrice: "1200",
      manageStock: true,
      stockQuantity: "8",
      inStock: true,
      published: false,
      featured: true,
      categoryIds: [2],
      relatedProductIds: [],
      crossSellProductIds: [],
      upsellProductIds: [],
    });

    expect(payload).toEqual({
      name: "Face Serum",
      short_description: "Glow daily",
      description: "Full details",
      sku: "FS-01",
      regular_price: "1500",
      sale_price: "1200",
      status: "draft",
      manage_stock: true,
      stock_quantity: 8,
      stock_status: "instock",
      featured: true,
      categories: [{ id: 2 }],
      related_ids: [],
      cross_sell_ids: [],
      upsell_ids: [],
    });
  });

  it("maps linked product ids to WooCommerce fields", () => {
    const payload = formValuesToWooPayload({
      name: "Face Serum",
      regularPrice: "1500",
      manageStock: false,
      inStock: true,
      published: true,
      featured: false,
      categoryIds: [],
      relatedProductIds: [12, 15],
      crossSellProductIds: [20],
      upsellProductIds: [30],
    });

    expect(payload.related_ids).toEqual([12, 15]);
    expect(payload.cross_sell_ids).toEqual([20]);
    expect(payload.upsell_ids).toEqual([30]);
  });

  it("adds the selected image id to the WooCommerce images payload", () => {
    const payload = formValuesToWooPayload({
      name: "Face Serum",
      regularPrice: "1500",
      manageStock: false,
      inStock: true,
      published: true,
      featured: false,
      categoryIds: [],
      imageId: 88,
      relatedProductIds: [],
      crossSellProductIds: [],
      upsellProductIds: [],
    });

    expect(payload.images).toEqual([{ id: 88 }]);
  });
});

describe("createProductPayload", () => {
  it("creates simple products by default", () => {
    const payload = createProductPayload({
      name: "Body Oil",
      regularPrice: "900",
      manageStock: false,
      inStock: true,
      published: true,
      featured: false,
      categoryIds: [],
      relatedProductIds: [],
      crossSellProductIds: [],
      upsellProductIds: [],
    });

    expect(payload.type).toBe("simple");
    expect(payload.status).toBe("publish");
  });
});

describe("mapWooProductDetail", () => {
  it("maps WooCommerce product to admin-friendly shape", () => {
    const product = mapWooProductDetail({
      id: 10,
      name: "Shea Butter",
      slug: "shea-butter",
      type: "simple",
      status: "publish",
      sku: "SB-1",
      description: "Rich moisturizer",
      short_description: "Daily care",
      regular_price: "700",
      sale_price: "",
      price: "700",
      manage_stock: true,
      stock_quantity: 4,
      stock_status: "instock",
      categories: [{ id: 5, name: "Body Care", slug: "body-care" }],
      images: [{ id: 1, src: "https://example.com/img.jpg", alt: "Shea" }],
      related_ids: [2, 3],
      cross_sell_ids: [4],
      upsell_ids: [5],
    });

    expect(product.inStock).toBe(true);
    expect(product.published).toBe(true);
    expect(product.categoryIds).toEqual([5]);
    expect(product.relatedProductIds).toEqual([2, 3]);
    expect(product.crossSellProductIds).toEqual([4]);
    expect(product.upsellProductIds).toEqual([5]);
    expect(product.imageUrl).toBe("https://example.com/img.jpg");
    expect(product.imageId).toBe(1);
  });
});

describe("productDetailToFormValues", () => {
  it("round-trips editable fields for the form", () => {
    const detail = mapWooProductDetail({
      id: 1,
      name: "Test",
      slug: "test",
      type: "simple",
      status: "draft",
      sku: "T-1",
      description: "",
      short_description: "Short",
      regular_price: "500",
      sale_price: "400",
      price: "400",
      manage_stock: true,
      stock_quantity: 2,
      stock_status: "outofstock",
      categories: [],
    });

    expect(productDetailToFormValues(detail)).toMatchObject({
      name: "Test",
      regularPrice: "500",
      stockQuantity: "2",
      inStock: false,
      published: false,
      imageId: undefined,
    });
  });
});

describe("variation helpers", () => {
  it("maps variation labels and payloads", () => {
    const variation = mapWooVariation({
      id: 99,
      sku: "VAR-1",
      regular_price: "300",
      sale_price: "",
      manage_stock: true,
      stock_quantity: 6,
      stock_status: "instock",
      attributes: [{ name: "Size", option: "250ml" }],
    });

    expect(variation.label).toBe("250ml");

    expect(
      variationToWooPayload({
        regularPrice: "300",
        manageStock: true,
        stockQuantity: "6",
        inStock: true,
      }),
    ).toEqual({
      regular_price: "300",
      sale_price: "",
      manage_stock: true,
      stock_quantity: 6,
      stock_status: "instock",
    });
  });
});
