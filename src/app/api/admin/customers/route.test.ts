import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/admin/require-admin", () => ({ requireAdminSession: vi.fn() }));
vi.mock("@/lib/admin/customer-service", () => ({
  fetchAdminCustomers: vi.fn(),
}));

import { fetchAdminCustomers } from "@/lib/admin/customer-service";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { GET } from "./route";

describe("GET /api/admin/customers", () => {
  beforeEach(() => {
    vi.mocked(requireAdminSession).mockReset();
    vi.mocked(fetchAdminCustomers).mockReset();
  });

  it("guards access and does not query WooCommerce", async () => {
    vi.mocked(requireAdminSession).mockResolvedValue({
      error: "Admin access required",
      status: 403,
      session: null,
    });
    const response = await GET();
    expect(response.status).toBe(403);
    expect(fetchAdminCustomers).not.toHaveBeenCalled();
  });

  it("returns the live customer directory", async () => {
    vi.mocked(requireAdminSession).mockResolvedValue({
      error: null,
      status: 200,
      session: { user: { id: "a", email: "a@test.com", role: "min_admin" } },
    });
    vi.mocked(fetchAdminCustomers).mockResolvedValue({
      customers: [],
      summary: {
        total: 0,
        newThisMonth: 0,
        returningRate: 0,
        averageLifetimeSpend: 0,
      },
    });
    const response = await GET();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      customers: [],
      summary: {
        total: 0,
        newThisMonth: 0,
        returningRate: 0,
        averageLifetimeSpend: 0,
      },
    });
  });
});
