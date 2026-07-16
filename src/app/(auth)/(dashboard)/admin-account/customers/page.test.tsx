import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import CustomersPage from "./page";

const liveData = {
  customers: [
    {
      id: "7",
      name: "Real Customer",
      email: "real@shop.test",
      phone: "0712345678",
      location: "Nairobi - Kilimani",
      orders: 3,
      spend: 48200,
      lastOrder: "2026-07-08T10:00:00Z",
      status: "vip",
    },
    {
      id: "guest:buyer@test.com",
      name: "Guest Buyer",
      email: "buyer@test.com",
      phone: "Not provided",
      location: "Mombasa - Nyali",
      orders: 1,
      spend: 1650,
      lastOrder: "2026-07-01T10:00:00Z",
      status: "new",
    },
  ],
  summary: {
    total: 2,
    newThisMonth: 1,
    returningRate: 50,
    averageLifetimeSpend: 24925,
  },
};

describe("CustomersPage", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders stats and customers returned by the admin API without fake actions", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify(liveData)),
    );
    render(<CustomersPage />);
    expect(screen.getByText("Loading customers…")).toBeInTheDocument();
    const row = await screen.findByRole("row", { name: /real customer/i });
    expect(within(row).getByText("KES 48,200")).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /reset|block|delete/i }),
    ).not.toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(
      "/api/admin/customers",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it("filters live results by search and status", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify(liveData)),
    );
    const user = userEvent.setup();
    render(<CustomersPage />);
    await screen.findByText("Real Customer");
    await user.type(
      screen.getByRole("searchbox", { name: /search customers/i }),
      "guest",
    );
    expect(screen.getByText("Guest Buyer")).toBeInTheDocument();
    expect(screen.queryByText("Real Customer")).not.toBeInTheDocument();
    await user.clear(
      screen.getByRole("searchbox", { name: /search customers/i }),
    );
    await user.selectOptions(screen.getByLabelText("Status"), "VIP");
    expect(screen.getByText("Real Customer")).toBeInTheDocument();
    expect(screen.queryByText("Guest Buyer")).not.toBeInTheDocument();
  });

  it("shows an honest API failure instead of fixture data", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response("", { status: 500 }),
    );
    render(<CustomersPage />);
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Could not load customers",
      ),
    );
    expect(screen.queryByText("Amina Yusuf")).not.toBeInTheDocument();
  });
});
