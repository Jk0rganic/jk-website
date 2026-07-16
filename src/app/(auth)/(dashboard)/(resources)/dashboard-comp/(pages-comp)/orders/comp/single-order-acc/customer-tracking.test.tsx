import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import SingleOrderAccount from "./page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
    push: vi.fn(),
  }),
}));

vi.mock("@/app/(payment)/payment/comp/order-payment-status-poller", () => ({
  default: () => null,
}));

const order = {
  id: 10442,
  status: "processing",
  date_created: "2026-07-08T09:12:00",
  total: "4350",
  currency: "KES",
  payment_method: "intasend",
  payment_method_title: "Online Payment",
  date_paid: "2026-07-08T09:15:00",
  needs_payment: false,
  customer_note: "",
  billing: {
    first_name: "Amina",
    last_name: "Yusuf",
    address_1: "Westlands",
    city: "Nairobi",
    postcode: "",
    phone: "0712345678",
    email: "amina@example.com",
    country: "KE",
    state: "Nairobi",
  },
  shipping: {
    first_name: "Amina",
    last_name: "Yusuf",
    address_1: "Westlands",
    city: "Nairobi",
    postcode: "",
    phone: "0712345678",
    country: "KE",
    state: "Nairobi",
  },
  line_items: [
    {
      id: 1,
      product_id: 10,
      name: "Moringa Powder 250g",
      quantity: 2,
      subtotal: "1700",
      total: "1700",
      sku: "MOR-250",
      meta_data: [],
    },
  ],
  shipping_lines: [
    {
      method_id: "flat_rate",
      method_title: "Door delivery",
      total: "250",
    },
  ],
  meta_data: [],
} satisfies DashboardOrder;

describe("SingleOrderAccount customer tracking", () => {
  it("renders the handoff order tracking timeline for customers", () => {
    render(<SingleOrderAccount order={order} />);

    expect(screen.getByText("Order #10442")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /being prepared/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Placed")).toBeInTheDocument();
    expect(screen.getByText("Processing")).toBeInTheDocument();
    expect(screen.getByText("Out for delivery")).toBeInTheDocument();
    expect(screen.getByText("Delivered")).toBeInTheDocument();
    expect(screen.getByText("Updates sent to you")).toBeInTheDocument();
  });

  it("shows admins a fulfilment-ready product preview with image, quantity, SKU, options, and notes", () => {
    const adminOrder: DashboardOrder = {
      ...order,
      customer_note: "Please call before pickup.",
      line_items: [
        {
          ...order.line_items[0],
          quantity: 2,
          image: { id: 45, src: "https://example.com/moringa.jpg" },
          variation_id: 12,
          meta_data: [
            { key: "Size", value: "250g" },
            { key: "_internal", value: "hidden" },
          ],
        },
      ],
    };

    render(<SingleOrderAccount order={adminOrder} variant="admin" />);

    expect(
      screen.getByRole("heading", { name: "Products to fulfil" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Moringa Powder 250g" }),
    ).toHaveAttribute("src", "https://example.com/moringa.jpg");
    expect(screen.getByText(/SKU: MOR-250/)).toBeInTheDocument();
    expect(screen.getByText("Size: 250g")).toBeInTheDocument();
    expect(screen.queryByText(/hidden/)).not.toBeInTheDocument();
    expect(
      screen.getByText("2 units across 1 product lines"),
    ).toBeInTheDocument();
    expect(screen.getByText("Please call before pickup.")).toBeInTheDocument();
  });
});
