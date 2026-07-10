import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AdminOrdersPage from "./admin-orders-page";

const orders: DashboardOrder[] = [
  {
    id: 1201,
    status: "processing",
    date_created: "2026-07-08T10:00:00",
    total: "2400",
    currency: "KES",
    billing: {
      first_name: "Amina",
      last_name: "Yusuf",
      email: "amina@example.com",
      phone: "0712345678",
      address_1: "Westlands",
      city: "Nairobi",
      postcode: "00100",
      country: "KE",
    },
    shipping: {
      first_name: "Amina",
      last_name: "Yusuf",
      address_1: "Westlands",
      city: "Nairobi",
      postcode: "00100",
      phone: "0712345678",
      country: "KE",
    },
    line_items: [],
    shipping_lines: [],
    payment_method: "intasend",
    payment_method_title: "Online Payment",
    date_paid: "2026-07-08T10:05:00",
    needs_payment: false,
    meta_data: [],
    customer_note: "",
  },
  {
    id: 1202,
    status: "pending",
    date_created: "2026-07-07T12:00:00",
    total: "900",
    currency: "KES",
    billing: {
      first_name: "Mary",
      last_name: "Achieng",
      email: "mary@example.com",
      phone: "0799999999",
      address_1: "Milimani",
      city: "Kisumu",
      postcode: "40100",
      country: "KE",
    },
    shipping: {
      first_name: "Mary",
      last_name: "Achieng",
      address_1: "Milimani",
      city: "Kisumu",
      postcode: "40100",
      phone: "0799999999",
      country: "KE",
    },
    line_items: [],
    shipping_lines: [],
    payment_method: "cod",
    payment_method_title: "Cash on Delivery",
    date_paid: null,
    needs_payment: false,
    meta_data: [],
    customer_note: "",
  },
  {
    id: 1203,
    status: "completed",
    date_created: "2026-06-01T09:00:00",
    total: "1200",
    currency: "KES",
    billing: {
      first_name: "Amina",
      last_name: "Yusuf",
      email: "amina@example.com",
      phone: "0712345678",
      address_1: "Westlands",
      city: "Nairobi",
      postcode: "00100",
      country: "KE",
    },
    shipping: {
      first_name: "Amina",
      last_name: "Yusuf",
      address_1: "Westlands",
      city: "Nairobi",
      postcode: "00100",
      phone: "0712345678",
      country: "KE",
    },
    line_items: [],
    shipping_lines: [],
    payment_method: "intasend",
    payment_method_title: "Online Payment",
    date_paid: "2026-06-01T09:05:00",
    needs_payment: false,
    meta_data: [],
    customer_note: "",
  },
];

vi.mock("../../../(resources)/dashboard-utils/account-context", () => ({
  useAccount: () => ({
    orders,
    session: {
      user: {
        id: "admin-1",
        email: "admin@jkorganics.com",
        role: "min_admin",
        name: "Admin",
      },
    },
  }),
}));

describe("AdminOrdersPage", () => {
  it("renders the stat tiles computed from live orders", () => {
    render(<AdminOrdersPage />);

    const statGrid = screen.getByText("Total orders").closest("article");
    expect(statGrid).not.toBeNull();
    expect(within(statGrid as HTMLElement).getByText("3")).toBeInTheDocument();

    const awaiting = screen.getByText("Awaiting fulfilment").closest("article");
    expect(within(awaiting as HTMLElement).getByText("2")).toBeInTheDocument();

    const completed = screen
      .getAllByText("Completed")
      .map((el) => el.closest("article"))
      .find((el): el is HTMLElement => el !== null);
    expect(completed).not.toBeUndefined();
    expect(within(completed as HTMLElement).getByText("1")).toBeInTheDocument();
  });

  it("renders top delivery locations and top customers, and toggles insights", () => {
    render(<AdminOrdersPage />);

    expect(screen.getByText("Store insights")).toBeInTheDocument();

    const locationsSection = screen
      .getByText("Top delivery locations")
      .closest("section") as HTMLElement;
    // Nairobi has 2 orders (Amina's), Kisumu has 1 (Mary's)
    expect(within(locationsSection).getByText("Nairobi")).toBeInTheDocument();
    expect(within(locationsSection).getByText("Kisumu")).toBeInTheDocument();

    const customersSection = screen
      .getByText("Top customers")
      .closest("section") as HTMLElement;
    // Amina Yusuf spent 2400 + 1200 = 3600, more than Mary's 900
    expect(
      within(customersSection).getByText("Amina Yusuf"),
    ).toBeInTheDocument();
    expect(
      within(customersSection).getByText("Mary Achieng"),
    ).toBeInTheDocument();

    const toggle = screen.getByRole("button", { name: /hide/i });
    fireEvent.click(toggle);

    expect(
      screen.queryByText("Top delivery locations"),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /show/i })).toBeInTheDocument();
  });

  it("still renders the searchable order table", () => {
    render(<AdminOrdersPage />);

    expect(screen.getByText("#1201")).toBeInTheDocument();
    expect(screen.getByText("#1202")).toBeInTheDocument();
    expect(screen.getByText("#1203")).toBeInTheDocument();

    fireEvent.change(
      screen.getByPlaceholderText("Search order #, name, email, phone…"),
      { target: { value: "mary" } },
    );

    expect(screen.queryByText("#1201")).not.toBeInTheDocument();
    expect(screen.getByText("#1202")).toBeInTheDocument();
  });
});
