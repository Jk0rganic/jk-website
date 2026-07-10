import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import CheckOutComp from "./checkout-comp";

const setValue = vi.fn();
const watch = vi.fn((field: string) => {
  const values: Record<string, unknown> = {
    delivery_method: "shipping",
    county: "Nairobi",
    delivery_subtype: "door_to_door",
  };
  return values[field];
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
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
        id: "tea-100g",
        databaseId: 12,
        name: "Organic Tea",
        price: 500,
        quantity: 2,
      },
    ],
    totalPrice: 1000,
    cartCount: 2,
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

vi.mock("react-hook-form", async () => {
  const actual =
    await vi.importActual<typeof import("react-hook-form")>("react-hook-form");

  return {
    ...actual,
    useForm: () => ({
      register: vi.fn((name: string) => ({ name })),
      control: {},
      handleSubmit: vi.fn(),
      watch,
      setValue,
      trigger: vi.fn().mockResolvedValue(true),
      formState: { errors: {}, isSubmitting: false },
    }),
  };
});

vi.mock("@/comp/form/formInput/formInput", () => ({
  FormInput: ({ name }: { name: string }) => <input aria-label={name} />,
}));

vi.mock("../delivery-location/deliveryLocationSelector", () => ({
  default: () => <div>Delivery location</div>,
}));

vi.mock("../delivery-method-selector/deliveryMethodSelector ", () => ({
  default: () => <div>Delivery method</div>,
}));

vi.mock("../pickUpPoint/pickUpPoint", () => ({
  default: () => <div>Pickup point</div>,
}));

vi.mock("../shipping-section/shippingSection ", () => ({
  default: () => <div>Shipping section</div>,
}));

vi.mock("../terms-and-conditions-section", () => ({
  default: () => <div>Terms</div>,
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("CheckOutComp delivery quotes", () => {
  it("fetches an authoritative shipping quote for the selected county and subtotal", async () => {
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
              fee: 350,
              label: "Nairobi door delivery",
              eta: "Today",
              available: true,
            }),
        });
      }

      throw new Error(`Unexpected fetch ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<CheckOutComp />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/delivery/quote",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            deliveryMethod: "shipping",
            county: "Nairobi",
            cartSubtotal: 1000,
          }),
        }),
      );
    });
  });
});
