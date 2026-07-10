import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import CheckoutProgress from "./checkout-progress";

describe("CheckoutProgress", () => {
  it("shows the handoff three-step checkout progress", () => {
    render(<CheckoutProgress currentStep={2} />);

    expect(screen.getByText("Step 2 of 3")).toBeInTheDocument();
    expect(screen.getByText("Delivery address")).toBeInTheDocument();
    expect(screen.getByText("Contact")).toBeInTheDocument();
    expect(screen.getByText("Address")).toBeInTheDocument();
    expect(screen.getByText("Payment")).toBeInTheDocument();
  });
});
