import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/admin/require-admin", () => ({
  requireAdminSession: vi.fn(),
}));

vi.mock("@/lib/fetch/baseUrl", () => ({
  getWordpressConfig: vi.fn(),
}));

import { requireAdminSession } from "@/lib/admin/require-admin";
import { getWordpressConfig } from "@/lib/fetch/baseUrl";
import { POST } from "./route";

const mockedRequireAdminSession = vi.mocked(requireAdminSession);
const mockedGetWordpressConfig = vi.mocked(getWordpressConfig);

describe("POST /api/admin/media", () => {
  beforeEach(() => {
    mockedRequireAdminSession.mockReset();
    mockedGetWordpressConfig.mockReset();
    vi.restoreAllMocks();
    mockedRequireAdminSession.mockResolvedValue({ error: null, status: 200 });
    mockedGetWordpressConfig.mockReturnValue({
      BASE_URL: "https://wp.example",
      CONSUMER_KEY: "ck_test",
      CONSUMER_SECRET: "cs_test",
    });
  });

  it("uploads a multipart file to WordPress media", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          id: 42,
          source_url: "https://wp.example/uploads/body-oil.jpg",
        }),
        { status: 201 },
      ),
    );
    const body = new FormData();
    body.append(
      "file",
      new File(["image bytes"], "body-oil.jpg", { type: "image/jpeg" }),
    );

    const response = await POST(
      new Request("http://test.local/api/admin/media", {
        method: "POST",
        body,
      }),
    );

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      media: { id: 42, sourceUrl: "https://wp.example/uploads/body-oil.jpg" },
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://wp.example/wp-json/wp/v2/media",
      expect.objectContaining({
        method: "POST",
        body: expect.any(ArrayBuffer),
        headers: expect.objectContaining({
          Authorization: `Basic ${Buffer.from("ck_test:cs_test").toString(
            "base64",
          )}`,
          "Content-Disposition": 'attachment; filename="body-oil.jpg"',
          "Content-Type": "image/jpeg",
        }),
      }),
    );
  });

  it("rejects non-image uploads before calling WordPress", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    const body = new FormData();
    body.append(
      "file",
      new File(["not image"], "notes.txt", { type: "text/plain" }),
    );

    const response = await POST(
      new Request("http://test.local/api/admin/media", {
        method: "POST",
        body,
      }),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Only image uploads are allowed",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects images larger than the upload limit before calling WordPress", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    const body = new FormData();
    body.append(
      "file",
      new File([new Uint8Array(5 * 1024 * 1024 + 1)], "large.jpg", {
        type: "image/jpeg",
      }),
    );

    const response = await POST(
      new Request("http://test.local/api/admin/media", {
        method: "POST",
        body,
      }),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Image must be 5MB or smaller",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
