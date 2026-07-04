import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/admin/require-admin", () => ({
  requireAdminSession: vi.fn(),
}));

vi.mock("@/lib/admin/review-service", async () => {
  const actual = await vi.importActual<
    typeof import("@/lib/admin/review-service")
  >("@/lib/admin/review-service");

  return {
    ...actual,
    fetchAdminReviews: vi.fn(),
  };
});

import { requireAdminSession } from "@/lib/admin/require-admin";
import {
  type AdminReview,
  fetchAdminReviews,
} from "@/lib/admin/review-service";
import type { Session } from "@/lib/auth/getSession";
import { GET } from "./route";

const mockedRequireAdminSession = vi.mocked(requireAdminSession);
const mockedFetchAdminReviews = vi.mocked(fetchAdminReviews);
const adminSession: Session = {
  user: {
    id: "admin-1",
    email: "admin@jkorganics.com",
    role: "min_admin",
  },
};

describe("GET /api/admin/reviews", () => {
  beforeEach(() => {
    mockedRequireAdminSession.mockReset();
    mockedFetchAdminReviews.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockedRequireAdminSession.mockResolvedValue({
      error: null,
      status: 200,
      session: adminSession,
    });
  });

  it("rejects unauthenticated or forbidden users via the admin guard", async () => {
    mockedRequireAdminSession.mockResolvedValue({
      error: "Admin access required",
      status: 403,
      session: null,
    });

    const response = await GET(
      new Request("http://test.local/api/admin/reviews"),
    );

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "Admin access required" });
    expect(mockedFetchAdminReviews).not.toHaveBeenCalled();
  });

  it("applies filters and returns filtered reviews with summary", async () => {
    mockedFetchAdminReviews.mockResolvedValue([
      reviewFixture({
        id: 1,
        productId: 10,
        productName: "Rosehip Face Oil",
        reviewer: "Amina",
        content: "Soft glow",
        rating: 5,
        status: "approved",
        date: "2026-06-10T10:00:00",
      }),
      reviewFixture({
        id: 2,
        productId: 11,
        productName: "Body Lotion",
        reviewer: "Grace",
        content: "Soft but late",
        rating: 2,
        status: "pending",
        date: "2026-06-15T10:00:00",
      }),
    ]);

    const response = await GET(
      new Request(
        "http://test.local/api/admin/reviews?search=soft&rating=2&status=pending&product=11&after=2026-06-01&before=2026-06-30",
      ),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      reviews: [
        expect.objectContaining({
          id: 2,
          productName: "Body Lotion",
          rating: 2,
          status: "pending",
        }),
      ],
      summary: {
        total: 1,
        averageRating: 2,
        lowRatingCount: 1,
        pendingCount: 1,
        ratingDistribution: { 1: 0, 2: 1, 3: 0, 4: 0, 5: 0 },
      },
    });
  });

  it("returns a stable 500 response when review fetching fails", async () => {
    mockedFetchAdminReviews.mockRejectedValue(new Error("WordPress offline"));

    const response = await GET(
      new Request("http://test.local/api/admin/reviews"),
    );

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: "Failed to fetch admin reviews",
    });
    expect(console.error).toHaveBeenCalledWith(
      "Failed to fetch admin reviews",
      expect.any(Error),
    );
  });
});

function reviewFixture(overrides: Partial<AdminReview> = {}): AdminReview {
  return {
    id: 1,
    productId: 10,
    productName: "Rosehip Face Oil",
    productSlug: "rosehip-face-oil",
    reviewer: "Amina",
    reviewerEmail: "amina@example.com",
    rating: 5,
    date: "2026-06-25T08:15:00",
    status: "approved",
    content: "Lovely texture.",
    ...overrides,
  };
}
