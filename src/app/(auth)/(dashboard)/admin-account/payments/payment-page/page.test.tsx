import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AdminPaymentsPage from "./page";

describe("AdminPaymentsPage", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("only shows payment-channel totals supported by the payments API", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        payments: [
          {
            id: "payment-1",
            checkoutId: "checkout-1",
            invoiceId: "invoice-1",
            orderId: 42,
            status: "COMPLETE",
            amount: 1_500,
            transactionRef: "MPESA-1",
            phoneNumber: "0712345678",
            provider: "IntaSend",
            failureReason: null,
            createdAt: "2026-07-16T08:00:00.000Z",
            updatedAt: "2026-07-16T08:01:00.000Z",
          },
        ],
      }),
    } as Response);

    render(<AdminPaymentsPage />);

    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith("/api/admin/payments"),
    );
    expect(await screen.findByText("M-Pesa / IntaSend")).toBeInTheDocument();
    expect(screen.queryByText("Cash total")).not.toBeInTheDocument();
    expect(
      screen.queryByText("No cash records in this feed"),
    ).not.toBeInTheDocument();
  });
});
