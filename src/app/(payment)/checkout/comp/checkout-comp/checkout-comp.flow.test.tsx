import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import CheckOutComp from "./checkout-comp";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    message: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
  },
}));

vi.mock("@/apollo/useApolloFetcher", () => ({
  useApolloFetcher: () => ({ data: { shippingZones: [] }, loading: false }),
}));

vi.mock("@/store/cartStore", () => ({
  useCartStore: () => ({
    cartDetails: [
      {
        id: "apple-cider",
        databaseId: 12,
        name: "Apple Cider Vinegar Capsules",
        price: 10,
        quantity: 1,
      },
    ],
    totalPrice: 10,
    cartCount: 1,
    clearCart: vi.fn(),
  }),
  useCheckoutStore: () => ({
    savedUserInfo: null,
    setSavedUserInfo: vi.fn(),
  }),
  usePendingOrderStore: () => ({
    clearPendingOrder: vi.fn(),
  }),
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("CheckOutComp checkout flow", () => {
  it("lets a customer continue from contact to Kiambu/Kimende delivery and reach payment review", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn((url: string) => {
      if (url === "/api/session") {
        return Promise.resolve({
          json: () => Promise.resolve({ user: null }),
        });
      }

      if (url === "/api/delivery/quote") {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              method: "shipping",
              code: "metro-stage-pickup",
              fee: 400,
              label: "Metro town/stage pickup",
              eta: "1 to 2 business days",
              fulfillmentType: "stage",
              freeDeliveryApplied: false,
              freeDeliveryRemaining: 4990,
              available: true,
            }),
        });
      }

      throw new Error(`Unexpected fetch ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<CheckOutComp />);

    await user.type(screen.getByPlaceholderText(/first name/i), "Joseph");
    await user.type(screen.getByPlaceholderText(/last name/i), "Thuku");
    await user.type(screen.getByPlaceholderText(/amina@gmail.com/i), "joseph@example.com");
    await user.type(screen.getByPlaceholderText(/0712 345 678/i), "0712345678");
    await user.click(screen.getByRole("button", { name: /^continue$/i }));

    await screen.findByRole("heading", { name: /delivery address/i });

    const county = screen.getByLabelText(/county/i);
    await user.type(county, "Kiambu");
    await user.tab();

    const nearestTown = await screen.findByLabelText(/nearest town/i);
    expect(nearestTown).not.toBeDisabled();

    await user.type(nearestTown, "Kimende");
    await user.tab();

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/delivery/quote",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            deliveryMethod: "shipping",
            county: "Kiambu",
            cartSubtotal: 10,
          }),
        }),
      );
    });

    await user.click(screen.getByRole("button", { name: /^continue$/i }));

    expect(
      await screen.findByRole("heading", { name: /payment & review/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/metro town\/stage pickup/i)).toBeInTheDocument();
  });
});
