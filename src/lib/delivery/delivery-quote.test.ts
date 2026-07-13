import { describe, expect, it } from "vitest";
import { resolveDeliveryQuote } from "./delivery-quote";

describe("resolveDeliveryQuote", () => {
  it("returns a free pickup quote for pickup orders", () => {
    expect(
      resolveDeliveryQuote({
        deliveryMethod: "pickup",
        county: "Nairobi",
        cartSubtotal: 1200,
      }),
    ).toEqual({
      code: "pickup",
      label: "Pickup from JK Organics",
      fee: 0,
      eta: "Ready within 24 hours",
      fulfillmentType: "pickup",
      freeDeliveryApplied: false,
      freeDeliveryRemaining: 0,
    });
  });

  it("quotes Nairobi doorstep delivery and makes it free above KES 4000", () => {
    expect(
      resolveDeliveryQuote({
        deliveryMethod: "shipping",
        county: "Nairobi",
        cartSubtotal: 3900,
      }),
    ).toEqual({
      code: "nairobi-doorstep",
      label: "Nairobi doorstep delivery",
      fee: 300,
      eta: "Same day to 24 hours",
      fulfillmentType: "doorstep",
      freeDeliveryApplied: false,
      freeDeliveryRemaining: 100,
    });

    expect(
      resolveDeliveryQuote({
        deliveryMethod: "shipping",
        county: "Nairobi",
        cartSubtotal: 4000,
      }),
    ).toEqual({
      code: "nairobi-doorstep",
      label: "Nairobi doorstep delivery",
      fee: 0,
      originalFee: 300,
      eta: "Same day to 24 hours",
      fulfillmentType: "doorstep",
      freeDeliveryApplied: true,
      freeDeliveryRemaining: 0,
    });
  });

  it("quotes metro town/stage pickup for Kiambu, Kajiado, and Machakos with a KES 5000 free threshold", () => {
    for (const county of ["Kiambu", "Kajiado", "Machakos"]) {
      expect(
        resolveDeliveryQuote({
          deliveryMethod: "shipping",
          county,
          cartSubtotal: 4500,
        }),
      ).toMatchObject({
        code: "metro-stage-pickup",
        label: "Metro town/stage pickup",
        fee: 300,
        fulfillmentType: "stage",
        freeDeliveryApplied: false,
        freeDeliveryRemaining: 500,
      });

      expect(
        resolveDeliveryQuote({
          deliveryMethod: "shipping",
          county,
          cartSubtotal: 5000,
        }),
      ).toMatchObject({
        code: "metro-stage-pickup",
        fee: 0,
        originalFee: 300,
        freeDeliveryApplied: true,
        freeDeliveryRemaining: 0,
      });
    }
  });

  it("quotes major town/stage pickup for Mombasa, Kisumu, Nakuru, and Uasin Gishu", () => {
    for (const county of ["Mombasa", "Kisumu", "Nakuru", "Uasin Gishu"]) {
      expect(
        resolveDeliveryQuote({
          deliveryMethod: "shipping",
          county,
          cartSubtotal: 2500,
        }),
      ).toMatchObject({
        code: "major-town-courier-office",
        label: "Major town/stage pickup",
        fee: 300,
        fulfillmentType: "stage",
        freeDeliveryApplied: false,
        freeDeliveryRemaining: 2500,
      });
    }
  });

  it("quotes standard upcountry and remote stage rates without returning free shipping", () => {
    expect(
      resolveDeliveryQuote({
        deliveryMethod: "shipping",
        county: "Bomet",
        cartSubtotal: 10000,
      }),
    ).toMatchObject({
      code: "standard-upcountry-stage",
      label: "Standard upcountry town/stage pickup",
      fee: 300,
      fulfillmentType: "stage",
      freeDeliveryApplied: false,
      freeDeliveryRemaining: 0,
    });

    for (const county of ["Mandera", "Marsabit", "Turkana", "Wajir"]) {
      expect(
        resolveDeliveryQuote({
          deliveryMethod: "shipping",
          county,
          cartSubtotal: 10000,
        }),
      ).toMatchObject({
        code: "remote-stage",
        label: "Remote town/stage pickup",
        fee: 300,
        fulfillmentType: "stage",
        freeDeliveryApplied: false,
        freeDeliveryRemaining: 0,
      });
    }
  });

  it("falls back to a paid standard shipping quote when no county or admin rate matches", () => {
    expect(
      resolveDeliveryQuote({
        deliveryMethod: "shipping",
        cartSubtotal: 10000,
      }),
    ).toMatchObject({
      code: "standard-upcountry-stage",
      fee: 300,
      fulfillmentType: "stage",
    });
  });

  it("prefers matching active admin rates over defaults", () => {
    const quote = resolveDeliveryQuote(
      {
        deliveryMethod: "shipping",
        county: "Nairobi",
        cartSubtotal: 6500,
      },
      [
        {
          code: "inactive-nairobi",
          label: "Inactive Nairobi test rate",
          counties: ["Nairobi"],
          fee: 1,
          eta: "Never",
          fulfillmentType: "doorstep",
          freeAbove: 10,
          active: false,
        },
        {
          code: "admin-nairobi-express",
          label: "Admin Nairobi express",
          counties: ["Nairobi"],
          fee: 650,
          eta: "2 hours",
          fulfillmentType: "doorstep",
          freeAbove: 7000,
          active: true,
        },
      ],
    );

    expect(quote).toEqual({
      code: "admin-nairobi-express",
      label: "Admin Nairobi express",
      fee: 650,
      eta: "2 hours",
      fulfillmentType: "doorstep",
      freeDeliveryApplied: false,
      freeDeliveryRemaining: 500,
    });
  });

  it("does not expose old non-Nairobi doorstep admin labels to customers", () => {
    const quote = resolveDeliveryQuote(
      {
        deliveryMethod: "shipping",
        county: "Kiambu",
        cartSubtotal: 1000,
      },
      [
        {
          code: "legacy-metro-doorstep",
          label: "Metro doorstep delivery",
          counties: ["Kiambu"],
          fee: 400,
          eta: "1 to 2 business days",
          fulfillmentType: "doorstep",
          active: true,
        },
      ],
    );

    expect(quote).toMatchObject({
      code: "legacy-metro-doorstep",
      label: "Metro town/stage pickup",
      fulfillmentType: "stage",
      fee: 400,
    });
  });
});
