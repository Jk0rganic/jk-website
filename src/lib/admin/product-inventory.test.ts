import { describe, expect, it } from "vitest";
import {
  isLowStock,
  mapWooProduct,
  summarizeInventory,
} from "./product-inventory";

describe("mapWooProduct", () => {
  it("maps WooCommerce product fields", () => {
    const product = mapWooProduct({
      id: 42,
      name: "Organic Honey",
      sku: "HNY-01",
      stock_status: "instock",
      stock_quantity: 12,
      price: "850",
      status: "publish",
      type: "simple",
      categories: [{ name: "Pantry" }],
      images: [{ src: "https://example.com/honey.jpg" }],
    });

    expect(product).toEqual({
      id: 42,
      name: "Organic Honey",
      sku: "HNY-01",
      stockStatus: "instock",
      stockQuantity: 12,
      price: "850",
      status: "publish",
      type: "simple",
      categories: ["Pantry"],
      primaryCategory: "Pantry",
      imageUrl: "https://example.com/honey.jpg",
    });
  });
});

describe("summarizeInventory", () => {
  it("counts stock health buckets", () => {
    const products = [
      mapWooProduct({
        id: 1,
        name: "A",
        sku: "A",
        stock_status: "instock",
        stock_quantity: 20,
        price: "100",
        status: "publish",
      }),
      mapWooProduct({
        id: 2,
        name: "B",
        sku: "B",
        stock_status: "instock",
        stock_quantity: 3,
        price: "200",
        status: "publish",
      }),
      mapWooProduct({
        id: 3,
        name: "C",
        sku: "C",
        stock_status: "outofstock",
        stock_quantity: 0,
        price: "300",
        status: "publish",
      }),
    ];

    expect(summarizeInventory(products)).toEqual({
      total: 3,
      inStock: 1,
      lowStock: 1,
      outOfStock: 1,
    });
  });
});

describe("isLowStock", () => {
  it("flags products at or below the threshold", () => {
    expect(
      isLowStock(
        mapWooProduct({
          id: 1,
          name: "Low",
          sku: "L",
          stock_status: "instock",
          stock_quantity: 5,
          price: "100",
          status: "publish",
        }),
      ),
    ).toBe(true);

    expect(
      isLowStock(
        mapWooProduct({
          id: 2,
          name: "Out",
          sku: "O",
          stock_status: "outofstock",
          stock_quantity: 0,
          price: "100",
          status: "publish",
        }),
      ),
    ).toBe(false);
  });
});
