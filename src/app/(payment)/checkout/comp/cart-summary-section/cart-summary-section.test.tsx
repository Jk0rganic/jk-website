import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import CartSummarySection from "./cart-summary-section";

afterEach(() => {
  cleanup();
});

const cartDetails: NonNullable<CheckoutFormType["cartDetails"]> = [
  {
    id: "1",
    databaseId: 101,
    name: "Raw Shea Butter",
    price: 850,
    quantity: 2,
    image: {
      mediaItemUrl: "https://example.com/shea.jpg",
      title: "Raw Shea Butter jar",
      srcSet: "https://example.com/shea-300.jpg 300w",
      sizes: "(max-width: 600px) 100vw, 80px",
    },
  },
];

describe("CartSummarySection", () => {
  it("renders product thumbnails, totals, and M-Pesa CTA", () => {
    render(
      <form>
        <CartSummarySection
          cartDetails={cartDetails}
          deliveryMethod="shipping"
          shippingCost={250}
          isSubmitting={false}
          itemsTotal={1700}
          discount={100}
          grandTotal={1850}
          activeCoupon={{
            code: "SAVE",
            amount: "100",
            discount_type: "fixed_cart",
          }}
          onCouponApplied={() => undefined}
          onCouponRemoved={() => undefined}
        />
      </form>,
    );

    expect(screen.getByText("Raw Shea Butter")).toBeInTheDocument();
    expect(screen.getByAltText("Raw Shea Butter jar")).toBeInTheDocument();
    expect(screen.getByText("Qty 2")).toBeInTheDocument();
    expect(screen.getAllByText("KSh 1,700").length).toBeGreaterThan(0);
    expect(
      screen.getByRole("button", { name: /send m-pesa prompt/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Subtotal")).toBeInTheDocument();
    expect(screen.getByText("Delivery")).toBeInTheDocument();
    expect(screen.getByText(/no hidden fees/i)).toBeInTheDocument();
  });

  it("uses the M-Pesa CTA for pickup orders too", () => {
    render(
      <form>
        <CartSummarySection
          cartDetails={cartDetails}
          deliveryMethod="pickup"
          shippingCost={0}
          isSubmitting={false}
          itemsTotal={1700}
          discount={0}
          grandTotal={1700}
          activeCoupon={null}
          onCouponApplied={() => undefined}
          onCouponRemoved={() => undefined}
        />
      </form>,
    );

    expect(
      screen.getByRole("button", { name: /send m-pesa prompt/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /place order/i }),
    ).not.toBeInTheDocument();
  });

  it("shows the authoritative delivery quote ETA and never treats unavailable shipping as free", () => {
    render(
      <form>
        <CartSummarySection
          cartDetails={cartDetails}
          deliveryMethod="shipping"
          shippingCost={0}
          deliveryQuote={{
            method: "shipping",
            fee: 0,
            label: "Delivery unavailable",
            eta: null,
            available: false,
          }}
          isSubmitting={false}
          itemsTotal={1700}
          discount={0}
          grandTotal={1700}
          activeCoupon={null}
          onCouponApplied={() => undefined}
          onCouponRemoved={() => undefined}
        />
      </form>,
    );

    expect(screen.getByText(/delivery unavailable/i)).toBeInTheDocument();
    expect(screen.getByText(/choose another county/i)).toBeInTheDocument();
    expect(screen.queryByText("Free")).not.toBeInTheDocument();
  });
});
