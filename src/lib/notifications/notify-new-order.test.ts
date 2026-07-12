import { beforeEach, describe, expect, it, vi } from "vitest";

const { sendEmail, findMany } = vi.hoisted(() => ({
  sendEmail: vi.fn(),
  findMany: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/nodemailer/send-mail", () => ({
  sendEmail,
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    user: {
      findMany,
    },
  },
}));

import {
  buildNewOrderEmail,
  getStaffNotificationEmails,
  notifyStaffOfNewOrder,
} from "./notify-new-order";

const baseOrder: WooOrderResponse = {
  id: 501,
  status: "processing",
  total: "1350.00",
  currency: "KES",
  currency_symbol: "KSh",
  payment_method: "cod",
  payment_method_title: "Cash on Delivery",
  customer_note: "",
  date_created: "2026-07-12T10:00:00",
  date_paid: null,
  date_completed: null,
  needs_payment: false,
  needs_processing: true,
  payment_url: "",
  billing: {
    first_name: "Jane",
    last_name: "Kamau",
    address_1: "River Road",
    city: "Nairobi",
    postcode: "",
    phone: "0712345678",
    email: "jane@example.com",
    country: "KE",
    state: "Nairobi",
  },
  shipping: {
    first_name: "Jane",
    last_name: "Kamau",
    address_1: "River Road",
    city: "Nairobi",
    postcode: "",
    phone: "0712345678",
    country: "KE",
    state: "Nairobi",
  },
  line_items: [
    {
      product_id: 12,
      sku: "TEA",
      name: "Tea",
      quantity: 2,
      subtotal: "1000.00",
      total: "1000.00",
      meta_data: [],
    },
  ],
  shipping_lines: [
    {
      method_id: "flat_rate",
      method_title: "Nairobi door delivery",
      total: "350.00",
    },
  ],
  meta_data: [],
};

describe("getStaffNotificationEmails", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("queries for active super admins, admins, and store managers only", async () => {
    findMany.mockResolvedValueOnce([
      { email: "owner@jkorganics.com" },
      { email: "manager@jkorganics.com" },
    ]);

    const emails = await getStaffNotificationEmails();

    expect(findMany).toHaveBeenCalledWith({
      where: {
        role: { in: ["super_admin", "min_admin", "store_manager"] },
        disabledAt: null,
        deletedAt: null,
      },
      select: { email: true },
    });
    expect(emails).toEqual(["owner@jkorganics.com", "manager@jkorganics.com"]);
  });

  it("de-duplicates repeated staff emails", async () => {
    findMany.mockResolvedValueOnce([
      { email: "owner@jkorganics.com" },
      { email: "owner@jkorganics.com" },
    ]);

    const emails = await getStaffNotificationEmails();

    expect(emails).toEqual(["owner@jkorganics.com"]);
  });
});

describe("buildNewOrderEmail", () => {
  it("includes the order id, total, and customer details", () => {
    const { subject, html } = buildNewOrderEmail(baseOrder);

    expect(subject).toContain("501");
    expect(subject).toContain("KSh1350.00");
    expect(html).toContain("Jane Kamau");
    expect(html).toContain("jane@example.com");
    expect(html).toContain("Tea");
    expect(html).toContain("/admin-account/orders/501");
  });

  it("escapes customer-supplied text to prevent HTML injection", () => {
    const order: WooOrderResponse = {
      ...baseOrder,
      billing: {
        ...baseOrder.billing,
        first_name: "<script>alert(1)</script>",
      },
    };

    const { html } = buildNewOrderEmail(order);

    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");
  });
});

describe("notifyStaffOfNewOrder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("emails every active staff member", async () => {
    findMany.mockResolvedValueOnce([
      { email: "owner@jkorganics.com" },
      { email: "manager@jkorganics.com" },
    ]);
    sendEmail.mockResolvedValue(undefined);

    await notifyStaffOfNewOrder(baseOrder);

    expect(sendEmail).toHaveBeenCalledTimes(2);
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ recipient: "owner@jkorganics.com" }),
    );
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ recipient: "manager@jkorganics.com" }),
    );
  });

  it("does not throw when there are no staff recipients", async () => {
    findMany.mockResolvedValueOnce([]);

    await expect(notifyStaffOfNewOrder(baseOrder)).resolves.toBeUndefined();
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("does not throw when one recipient fails to send", async () => {
    findMany.mockResolvedValueOnce([
      { email: "owner@jkorganics.com" },
      { email: "manager@jkorganics.com" },
    ]);
    sendEmail
      .mockRejectedValueOnce(new Error("SMTP down"))
      .mockResolvedValueOnce(undefined);

    await expect(notifyStaffOfNewOrder(baseOrder)).resolves.toBeUndefined();
    expect(sendEmail).toHaveBeenCalledTimes(2);
  });

  it("does not throw when the staff lookup itself fails", async () => {
    findMany.mockRejectedValueOnce(new Error("DB unreachable"));

    await expect(notifyStaffOfNewOrder(baseOrder)).resolves.toBeUndefined();
    expect(sendEmail).not.toHaveBeenCalled();
  });
});
