import { render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
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

const fixtureOrders: DashboardOrder[] = [
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

let accountOrders = fixtureOrders;

vi.mock("../../../(resources)/dashboard-utils/account-context", () => ({
  useAccount: () => ({
    orders: accountOrders,
    session: {
      user: {
        name: "Joan Kimani",
      },
    },
  }),
}));

describe("AdminDashboard", () => {
  beforeEach(() => {
    accountOrders = fixtureOrders;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          products: [
            {
              id: 1,
              name: "Real Woo Low Stock",
              sku: "REAL-LOW",
              stockStatus: "instock",
              stockQuantity: 2,
            },
            {
              id: 2,
              name: "Real Woo Out of Stock",
              sku: "REAL-OUT",
              stockStatus: "outofstock",
              stockQuantity: 0,
            },
            {
              id: 3,
              name: "Healthy Stock",
              sku: "REAL-OK",
              stockStatus: "instock",
              stockQuantity: 20,
            },
          ],
        }),
      }),
    );
  });

  it("renders order metrics and inventory from WooCommerce data", async () => {
    render(<AdminDashboard />);

    expect(
      screen.getByRole("heading", { name: /welcome back, joan/i }),
    ).toBeInTheDocument();

    expect(screen.getByText("Revenue")).toBeInTheDocument();
    expect(screen.getByText("Orders")).toBeInTheDocument();
    expect(screen.getByText("Units sold")).toBeInTheDocument();
    expect(screen.getByText("Avg. order")).toBeInTheDocument();

    expect(
      screen.getByRole("heading", { name: /sales overview/i }),
    ).toBeInTheDocument();
    const topProducts = screen
      .getByRole("heading", { name: /top products/i })
      .closest("article");
    if (!topProducts) throw new Error("Top products section missing");
    expect(within(topProducts).getByText("Moringa Oil")).toBeInTheDocument();
    expect(within(topProducts).getByText("Shea Cream")).toBeInTheDocument();
    expect(within(topProducts).getByText("Baobab Powder")).toBeInTheDocument();

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

    await waitFor(() =>
      expect(screen.getByText("Real Woo Low Stock")).toBeInTheDocument(),
    );
    expect(screen.getByText("Real Woo Out of Stock")).toBeInTheDocument();
    expect(screen.queryByText("Healthy Stock")).not.toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith("/api/admin/products");
    expect(screen.queryByText(/350,000 target/i)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Herbal Detox Tea 20 bags/i),
    ).not.toBeInTheDocument();
  });

  it("shows honest empty states and zero metrics when WooCommerce has no data", async () => {
    accountOrders = [];
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ products: [] }),
    } as Response);

    render(<AdminDashboard />);

    expect(screen.getAllByText("KSh 0").length).toBeGreaterThan(0);
    expect(screen.getByText("No recent orders yet.")).toBeInTheDocument();
    expect(screen.getByText("No order activity yet.")).toBeInTheDocument();
    expect(screen.getByText("No sales data yet.")).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByText("No low-stock products.")).toBeInTheDocument(),
    );
    expect(screen.queryByText("Moringa Powder 250g")).not.toBeInTheDocument();
    expect(
      screen.queryByText("New order #10442 from Amina Yusuf"),
    ).not.toBeInTheDocument();
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
