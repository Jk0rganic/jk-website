import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AdminDashboard from "./admin-dashboard";

vi.mock("next/image", () => ({
  default: ({
    priority: _priority,
    fill: _fill,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & {
    fill?: boolean;
    priority?: boolean;
  }) => (
    // biome-ignore lint/performance/noImgElement lint/a11y/useAltText: test mock for next/image.
    <img {...props} />
  ),
}));

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
    line_items: [
      {
        product_id: 41,
        name: "Moringa Oil",
        quantity: 3,
        subtotal: "1800",
        total: "1800",
        sku: "MOR-100",
        image: {
          src: "https://myshop.jkorganics.co.ke/wp-content/uploads/moringa.jpg",
          alt: "Moringa oil bottle",
        },
        meta_data: [],
      } as LineItem & { image: { src: string; alt: string } },
    ],
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
    line_items: [
      {
        product_id: 52,
        name: "Shea Cream",
        quantity: 1,
        subtotal: "900",
        total: "900",
        sku: "SHEA-50",
        meta_data: [],
      },
    ],
    shipping_lines: [],
    payment_method: "cod",
    payment_method_title: "Cash on Delivery",
    date_paid: null,
    needs_payment: false,
    meta_data: [],
    customer_note: "",
  },
  {
    id: 1190,
    status: "completed",
    date_created: "2026-05-18T09:00:00",
    total: "1000",
    currency: "KES",
    billing: {
      first_name: "Kevin",
      last_name: "Mutua",
      email: "kevin@example.com",
      phone: "0700000000",
      address_1: "Kilimani",
      city: "Nairobi",
      postcode: "00100",
      country: "KE",
    },
    shipping: {
      first_name: "Kevin",
      last_name: "Mutua",
      address_1: "Kilimani",
      city: "Nairobi",
      postcode: "00100",
      phone: "0700000000",
      country: "KE",
    },
    line_items: [
      {
        product_id: 60,
        name: "Baobab Powder",
        quantity: 2,
        subtotal: "1000",
        total: "1000",
        sku: "BAO-200",
        meta_data: [],
      },
    ],
    shipping_lines: [],
    payment_method: "intasend",
    payment_method_title: "Online Payment",
    date_paid: "2026-05-18T09:05:00",
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
        name: "Joan Kimani",
      },
    },
  }),
}));

vi.mock("../../comp/accountPage/two", () => ({
  default: () => <div data-testid="orders-chart">Sales chart</div>,
}));

describe("AdminDashboard", () => {
  it("renders the analytics dashboard sections from account data", () => {
    render(<AdminDashboard />);

    expect(
      screen.getByRole("heading", { name: /welcome back, joan/i }),
    ).toBeInTheDocument();

    // Weekly KPI cards (labels only — values depend on a "this week" window
    // relative to the real clock, so don't assert exact numbers here).
    expect(screen.getByText("Revenue")).toBeInTheDocument();
    expect(screen.getByText("Orders")).toBeInTheDocument();
    expect(screen.getByText("Units sold")).toBeInTheDocument();
    expect(screen.getByText("Avg. order")).toBeInTheDocument();

    expect(
      screen.getByRole("heading", { name: /sales overview/i }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("orders-chart")).toBeInTheDocument();

    expect(
      screen.getByRole("heading", { name: /weekly stats/i }),
    ).toBeInTheDocument();

    // Top products draws from all orders regardless of date, so this is
    // deterministic.
    const topProducts = screen
      .getByRole("heading", { name: /top products/i })
      .closest("section");
    if (!topProducts) throw new Error("Top products section missing");
    expect(within(topProducts).getByText("Moringa Oil")).toBeInTheDocument();
    expect(within(topProducts).getByText("Shea Cream")).toBeInTheDocument();
    expect(within(topProducts).getByText("Baobab Powder")).toBeInTheDocument();

    const topLocations = screen
      .getByRole("heading", { name: /top locations/i })
      .closest("section");
    if (!topLocations) throw new Error("Top locations section missing");
    expect(within(topLocations).getByText("Nairobi")).toBeInTheDocument();
    expect(within(topLocations).getByText("Kisumu")).toBeInTheDocument();

    // Recent orders shows all loaded orders regardless of date.
    const recentOrders = screen
      .getByRole("heading", { name: /recent orders/i })
      .closest("section");
    if (!recentOrders) throw new Error("Recent orders section missing");
    const firstRecentOrder = within(recentOrders)
      .getByText("#1201")
      .closest("tr");
    if (!firstRecentOrder) throw new Error("Recent order row missing");
    expect(
      within(firstRecentOrder).getByText("Amina Yusuf"),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("heading", { name: /pending and unpaid/i }),
    ).toBeInTheDocument();
  });

  it("renders the welcome section before the weekly KPI cards and analytics", () => {
    const { container } = render(<AdminDashboard />);
    const canvas = within(container);

    const welcomeHeading = canvas.getByRole("heading", {
      name: /welcome back, joan/i,
    });
    const revenueMetric = canvas.getByText("Revenue");
    const salesOverviewHeading = canvas.getByRole("heading", {
      name: /sales overview/i,
    });

    expect(
      welcomeHeading.compareDocumentPosition(revenueMetric) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      welcomeHeading.compareDocumentPosition(salesOverviewHeading) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});
