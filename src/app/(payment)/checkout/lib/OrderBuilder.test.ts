import { describe, expect, it } from "vitest";
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
  paymentMethod: "pay_on_delivery",
  termsAgreement: true,
  county: "Nairobi",
  delivery_subtype: "door_to_door",
} as CheckoutFormType;

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
});
