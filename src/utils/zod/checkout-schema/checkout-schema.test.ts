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

  it("requires the nearest town or centre for upcountry delivery", () => {
    const result = checkOutSchema.safeParse({
      ...baseCheckout,
      county: "Bomet",
      delivery_subtype: "parcel_office",
    });

    expect(result.success).toBe(false);
  });

  it("rejects shipping when the county is not from the list", () => {
    const result = checkOutSchema.safeParse({
      ...baseCheckout,
      county: "Not A County",
      delivery_subtype: "parcel_office",
      parcel_town: "Not A County Town",
    });

    expect(result.success).toBe(false);
  });

  it("accepts upcountry delivery when the customer provides the nearest town or centre", () => {
    const result = checkOutSchema.safeParse({
      ...baseCheckout,
      county: "Kiambu",
      billing_city: "",
      delivery_subtype: "parcel_office",
      parcel_town: "Kimende",
    });

    expect(result.success).toBe(true);
  });

  it("rejects upcountry delivery when the town or centre is not from the county list", () => {
    const result = checkOutSchema.safeParse({
      ...baseCheckout,
      county: "Kiambu",
      billing_city: "",
      delivery_subtype: "parcel_office",
      parcel_town: "Unknown Village",
    });

    expect(result.success).toBe(false);
  });

  it("still requires street and estate details for Nairobi door delivery", () => {
    const result = checkOutSchema.safeParse({
      ...baseCheckout,
      county: "Nairobi",
      billing_address_1: "",
      billing_city: "",
      delivery_subtype: "door_to_door",
    });

    expect(result.success).toBe(false);
  });
});
