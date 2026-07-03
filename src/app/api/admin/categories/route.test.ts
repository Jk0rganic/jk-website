import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/admin/require-admin", () => ({
  requireAdminSession: vi.fn(),
}));

vi.mock("@/lib/fetch/fetchRest", () => ({
  fetchWoo: vi.fn(),
}));

import { requireAdminSession } from "@/lib/admin/require-admin";
import { fetchWoo } from "@/lib/fetch/fetchRest";
import { POST } from "./route";

const mockedRequireAdminSession = vi.mocked(requireAdminSession);
const mockedFetchWoo = vi.mocked(fetchWoo);

describe("POST /api/admin/categories", () => {
  beforeEach(() => {
    mockedRequireAdminSession.mockReset();
    mockedFetchWoo.mockReset();
    mockedRequireAdminSession.mockResolvedValue({ error: null, status: 200 });
  });

  it("creates a WooCommerce product category", async () => {
    const category = { id: 7, name: "Body Care", slug: "body-care" };
    mockedFetchWoo.mockResolvedValue(category);

    const response = await POST(
      new Request("http://test.local/api/admin/categories", {
        method: "POST",
        body: JSON.stringify({ name: " Body Care " }),
      }),
    );

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ category });
    expect(mockedFetchWoo).toHaveBeenCalledWith("products/categories", {
      method: "POST",
      body: { name: "Body Care" },
      noCache: true,
    });
  });

  it("rejects blank category names before calling WooCommerce", async () => {
    const response = await POST(
      new Request("http://test.local/api/admin/categories", {
        method: "POST",
        body: JSON.stringify({ name: "   " }),
      }),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Category name is required",
    });
    expect(mockedFetchWoo).not.toHaveBeenCalled();
  });
});
