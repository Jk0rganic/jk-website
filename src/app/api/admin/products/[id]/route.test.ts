import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/admin/require-admin", () => ({
  requireAdminSession: vi.fn(),
}));

vi.mock("@/lib/fetch/fetchRest", () => ({
  fetchWoo: vi.fn(),
}));

import { requireAdminSession } from "@/lib/admin/require-admin";
import { fetchWoo } from "@/lib/fetch/fetchRest";
import { DELETE } from "./route";

const mockedRequireAdminSession = vi.mocked(requireAdminSession);
const mockedFetchWoo = vi.mocked(fetchWoo);

describe("DELETE /api/admin/products/[id]", () => {
  beforeEach(() => {
    mockedRequireAdminSession.mockReset();
    mockedFetchWoo.mockReset();
    mockedRequireAdminSession.mockResolvedValue({ error: null, status: 200 });
  });

  it("deletes a product from WooCommerce", async () => {
    mockedFetchWoo.mockResolvedValue({ id: 12 });

    const response = await DELETE(new Request("http://test.local"), {
      params: Promise.resolve({ id: "12" }),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true });
    expect(mockedFetchWoo).toHaveBeenCalledWith("products/12?force=true", {
      method: "DELETE",
      noCache: true,
    });
  });

  it("rejects invalid product ids", async () => {
    const response = await DELETE(new Request("http://test.local"), {
      params: Promise.resolve({ id: "abc" }),
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Invalid product id" });
    expect(mockedFetchWoo).not.toHaveBeenCalled();
  });
});
