import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import DeliveryRatesPage from "./page";

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

const rates = [
  {
    id: "rate-1",
    code: "nairobi-door",
    label: "Nairobi Door Delivery",
    description: "Door delivery in Nairobi",
    fulfillmentType: "door_delivery",
    counties: ["Nairobi"],
    towns: [],
    fee: 300,
    freeAbove: 5000,
    eta: "Same day to 24 hours",
    active: true,
    sortOrder: 1,
  },
  {
    id: "rate-2",
    code: "parcel-office",
    label: "Parcel Office",
    description: null,
    fulfillmentType: "parcel_office",
    counties: [],
    towns: [],
    fee: 250,
    freeAbove: null,
    eta: "1-3 business days",
    active: false,
    sortOrder: 2,
  },
];

describe("DeliveryRatesPage", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ rates }),
    } as Response);
  });

  it("renders delivery-rate rows with editable controls", async () => {
    render(<DeliveryRatesPage />);

    const doorRow = await screen.findByRole("row", {
      name: /nairobi door delivery/i,
    });
    expect(within(doorRow).getByDisplayValue("300")).toBeInTheDocument();
    expect(within(doorRow).getByDisplayValue("5000")).toBeInTheDocument();
    expect(
      within(doorRow).getByDisplayValue("Same day to 24 hours"),
    ).toBeInTheDocument();
    expect(within(doorRow).getByRole("checkbox")).toBeChecked();

    const parcelRow = screen.getByRole("row", { name: /parcel office/i });
    expect(within(parcelRow).getByDisplayValue("250")).toBeInTheDocument();
    expect(within(parcelRow).getByLabelText(/free above/i)).toHaveValue(null);
    expect(within(parcelRow).getByRole("checkbox")).not.toBeChecked();
  });

  it("saves edited delivery-rate fields through the admin endpoint", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ rates }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          rate: {
            ...rates[0],
            fee: 350,
            freeAbove: 7000,
            eta: "Same day",
            active: false,
          },
        }),
      } as Response);

    render(<DeliveryRatesPage />);

    const doorRow = await screen.findByRole("row", {
      name: /nairobi door delivery/i,
    });
    await userEvent.clear(within(doorRow).getByLabelText(/fee/i));
    await userEvent.type(within(doorRow).getByLabelText(/fee/i), "350");
    await userEvent.clear(within(doorRow).getByLabelText(/free above/i));
    await userEvent.type(within(doorRow).getByLabelText(/free above/i), "7000");
    await userEvent.clear(within(doorRow).getByLabelText(/eta/i));
    await userEvent.type(within(doorRow).getByLabelText(/eta/i), "Same day");
    await userEvent.click(within(doorRow).getByRole("checkbox"));
    await userEvent.click(
      within(doorRow).getByRole("button", { name: "Save" }),
    );

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/admin/delivery-rates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: "rate-1",
          fee: 350,
          freeAbove: 7000,
          eta: "Same day",
          active: false,
        }),
      });
    });
  });
});
