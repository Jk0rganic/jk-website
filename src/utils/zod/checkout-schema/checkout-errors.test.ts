import { describe, expect, it } from "vitest";
import { getFirstCheckoutErrorMessage } from "./checkout-errors";

describe("getFirstCheckoutErrorMessage", () => {
  it("finds the first nested checkout validation message", () => {
    expect(
      getFirstCheckoutErrorMessage({
        county: { message: "Please select your county" },
        billing: { phone: { message: "Phone is required" } },
      }),
    ).toBe("Please select your county");
  });

  it("falls back when validation errors do not include a readable message", () => {
    expect(getFirstCheckoutErrorMessage({ billing: {} })).toBe(
      "Please check the highlighted checkout fields.",
    );
  });
});
