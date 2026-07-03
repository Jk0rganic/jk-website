import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./baseUrl", () => ({
  getWordpressConfig: vi.fn(),
}));

import { getWordpressConfig } from "./baseUrl";
import { fetchWoo } from "./fetchRest";

const mockedGetWordpressConfig = vi.mocked(getWordpressConfig);

describe("fetchWoo", () => {
  beforeEach(() => {
    mockedGetWordpressConfig.mockReset();
    vi.restoreAllMocks();
    mockedGetWordpressConfig.mockReturnValue({
      BASE_URL: "https://wp.example",
      CONSUMER_KEY: "ck_test",
      CONSUMER_SECRET: "cs_test",
      WORDPRESS_USERNAME: null,
      WORDPRESS_APP_PASSWORD: null,
    });
  });

  it("explains WordPress capability errors from product writes", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          code: "rest_cannot_create",
          message: "Sorry, you are not allowed to create posts as this user.",
          data: { status: 403 },
        }),
        { status: 403 },
      ),
    );

    await expect(
      fetchWoo("products", { method: "POST", body: { name: "Tea" } }),
    ).rejects.toThrow(
      "The WordPress/WooCommerce API user connected to WC_CONSUMER_KEY is not allowed to create products or media.",
    );
  });
});
