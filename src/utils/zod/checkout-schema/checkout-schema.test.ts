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
  it("rejects pay on delivery because orders must be paid before preparation", () => {
    const result = checkOutSchema.safeParse({
      ...baseCheckout,
      paymentMethod: "pay_on_delivery",
      county: "Bomet",
      delivery_subtype: "parcel_office",
    });

    expect(result.success).toBe(false);
  });

  it("accepts counties with a single fallback parcel office without forcing hidden fields", () => {
    const result = checkOutSchema.safeParse({
      ...baseCheckout,
      county: "Bomet",
      delivery_subtype: "parcel_office",
    });

    expect(result.success).toBe(true);
  });
});
