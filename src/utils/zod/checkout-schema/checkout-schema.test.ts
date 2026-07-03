import { describe, expect, it } from "vitest";
import { checkOutSchema } from "./checkout-schema";

const baseCheckout = {
  email: "customer@example.com",
  billing_first_name: "Joseph",
  billing_last_name: "Thuku",
  billing_city: "Thika",
  billing_phone: "0110919165",
  delivery_method: "shipping",
  paymentMethod: "pay_online",
  termsAgreement: true,
};

describe("checkOutSchema", () => {
  it("accepts counties with a single fallback parcel office without forcing hidden fields", () => {
    const result = checkOutSchema.safeParse({
      ...baseCheckout,
      county: "Bomet",
      delivery_subtype: "parcel_office",
    });

    expect(result.success).toBe(true);
  });
});
