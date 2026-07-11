import { describe, expect, it } from "vitest";
import type { CheckOutSchemaType } from "@/utils/zod/checkout-schema/checkout-schema";
import { buildOrderPayload } from "./OrderBuilder";

const checkoutData = {
  email: "customer@example.com",
  billing_first_name: "Jane",
  billing_last_name: "Kamau",
  billing_address_1: "River Road",
  billing_city: "Nairobi",
  billing_postcode: "",
  billing_phone: "0712345678",
  useDifferentShipping: false,
  delivery_method: "shipping",
  paymentMethod: "pay_online",
  termsAgreement: true,
  county: "Nairobi",
  delivery_subtype: "door_to_door",
} as CheckOutSchemaType;

const cartDetails = [
  {
    id: "tea-100g",
    databaseId: 12,
    name: "Organic Tea",
    price: 500,
    quantity: 2,
    sku: "TEA-100G",
  },
];

describe("buildOrderPayload", () => {
  it("always builds a prepaid IntaSend order payload", () => {
    const payload = buildOrderPayload({
      data: checkoutData,
      cartDetails,
      totalPrice: 1000,
      deliveryMethod: "shipping",
      shippingCost: 250,
      shippingMethodTitle: "Nairobi Door Delivery",
    });

    expect(payload).toEqual(
      expect.objectContaining({
        payment_method: "intasend",
        payment_method_title: "Online Payment",
        set_paid: false,
        status: "pending",
      }),
    );
  });

  it("lets WooCommerce calculate the final total from line items and shipping", () => {
    const payload = buildOrderPayload({
      data: checkoutData,
      cartDetails,
      totalPrice: 1000,
      deliveryMethod: "shipping",
      shippingCost: 250,
      shippingMethodTitle: "Nairobi Door Delivery",
    });

    expect(payload).not.toHaveProperty("total");
    expect(payload.line_items).toEqual([
      expect.objectContaining({
        product_id: 12,
        quantity: 2,
        subtotal: "1000.00",
        total: "1000.00",
      }),
    ]);
    expect(payload.shipping_lines).toEqual([
      expect.objectContaining({
        method_id: "flat_rate",
        total: "250.00",
      }),
    ]);
  });

  it("stores selected upcountry town details without exposing carrier choice", () => {
    const payload = buildOrderPayload({
      data: {
        ...checkoutData,
        county: "Kiambu",
        delivery_subtype: "parcel_office",
        parcel_town: "Kimende",
      },
      cartDetails,
      totalPrice: 1000,
      deliveryMethod: "shipping",
      shippingCost: 500,
      shippingMethodTitle: "Kenya Parcel Office",
    });

    expect(payload.shipping).toEqual(
      expect.objectContaining({
        address_1: "Customer will collect at Kimende",
        city: "Kimende",
        state: "Kiambu",
      }),
    );
    expect(payload.meta_data).toEqual(
      expect.arrayContaining([
        { key: "_delivery_type", value: "parcel_office" },
        { key: "_county", value: "Kiambu" },
        { key: "_nearest_town_center", value: "Kimende" },
        { key: "_parcel_town", value: "Kimende" },
        { key: "_pickup_stage", value: "Kimende" },
        { key: "_carrier_assignment", value: "pending_admin_assignment" },
      ]),
    );
  });
});
