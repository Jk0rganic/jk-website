import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import CheckoutProgress from "./checkout-progress";

describe("CheckoutProgress", () => {
  it("shows the handoff two-step checkout progress", () => {
    render(<CheckoutProgress currentStep={2} />);

    expect(screen.getByText("Step 2 of 2")).toBeInTheDocument();
    expect(screen.getByText("Payment & review")).toBeInTheDocument();
    expect(screen.getByText("Details")).toBeInTheDocument();
    expect(screen.getByText("Payment")).toBeInTheDocument();
  });
});
