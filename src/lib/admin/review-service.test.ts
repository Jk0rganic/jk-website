import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/fetch/fetchGraphQL", () => ({
  fetchGraphQL: vi.fn(),
}));

import { fetchGraphQL } from "@/lib/fetch/fetchGraphQL";
import {
  computeReviewSummary,
  fetchAdminReviews,
  filterAdminReviews,
  mapCommentToAdminReview,
} from "./review-service";

const mockedFetchGraphQL = vi.mocked(fetchGraphQL);

describe("mapCommentToAdminReview", () => {
  it("maps WPGraphQL comment fixtures to admin reviews", () => {
    const review = mapCommentToAdminReview({
      id: "comment:101",
      databaseId: 101,
      content: "<p>Lovely texture and scent.</p>",
      date: "2026-06-25T08:15:00",
      status: "approved",
      author: {
        node: {
          name: "Amina Otieno",
          email: "amina@example.com",
        },
      },
      rating: 5,
      commentedOn: {
        node: {
          databaseId: 77,
          title: "Rosehip Face Oil",
          slug: "rosehip-face-oil",
          featuredImage: {
            node: {
              sourceUrl: "https://example.com/rosehip.jpg",
            },
          },
        },
      },
    });

    expect(review).toEqual({
      id: 101,
      productId: 77,
      productName: "Rosehip Face Oil",
      productSlug: "rosehip-face-oil",
      reviewer: "Amina Otieno",
      reviewerEmail: "amina@example.com",
      rating: 5,
      date: "2026-06-25T08:15:00",
      status: "approved",
      content: "Lovely texture and scent.",
      productImage: "https://example.com/rosehip.jpg",
    });
  });

  it("fetches comments and maps likely Woo review meta fields", async () => {
    mockedFetchGraphQL.mockResolvedValue({
      comments: {
        nodes: [
          {
            id: "comment:202",
            databaseId: 202,
            content: "Needs a better pump.",
            dateGmt: "2026-06-20T10:00:00",
            approved: false,
            authorName: "Grace",
            authorEmail: "grace@example.com",
            metaData: [{ key: "rating", value: "2" }],
            commentedOn: {
              node: {
                databaseId: 55,
                name: "Body Lotion",
                slug: "body-lotion",
                image: {
                  sourceUrl: "https://example.com/lotion.jpg",
                },
              },
            },
          },
        ],
      },
    });

    await expect(fetchAdminReviews()).resolves.toEqual([
      {
        id: 202,
        productId: 55,
        productName: "Body Lotion",
        productSlug: "body-lotion",
        reviewer: "Grace",
        reviewerEmail: "grace@example.com",
        rating: 2,
        date: "2026-06-20T10:00:00",
        status: "pending",
        content: "Needs a better pump.",
        productImage: "https://example.com/lotion.jpg",
      },
    ]);
  });
});

describe("computeReviewSummary", () => {
  it("calculates totals, one-decimal average, low ratings, pending count, and distribution", () => {
    expect(
      computeReviewSummary([
        reviewFixture({ rating: 5, status: "approved" }),
        reviewFixture({ rating: 4, status: "approved" }),
        reviewFixture({ rating: 2, status: "hold" }),
        reviewFixture({ rating: 1, status: "pending" }),
      ]),
    ).toEqual({
      total: 4,
      averageRating: 3,
      lowRatingCount: 2,
      pendingCount: 2,
      ratingDistribution: { 1: 1, 2: 1, 3: 0, 4: 1, 5: 1 },
    });
  });
});

describe("filterAdminReviews", () => {
  it("combines search, rating, status, product, and date filters", () => {
    const reviews = [
      reviewFixture({
        productId: 10,
        productName: "Rosehip Face Oil",
        reviewer: "Amina",
        reviewerEmail: "amina@example.com",
        content: "Soft glow",
        rating: 5,
        status: "approved",
        date: "2026-06-10T10:00:00",
      }),
      reviewFixture({
        productId: 11,
        productName: "Body Lotion",
        reviewer: "Grace",
        reviewerEmail: "grace@example.com",
        content: "Soft but arrived late",
        rating: 2,
        status: "pending",
        date: "2026-06-15T10:00:00",
      }),
      reviewFixture({
        productId: 10,
        productName: "Rosehip Face Oil",
        reviewer: "Mary",
        reviewerEmail: "mary@example.com",
        content: "Soft finish",
        rating: 5,
        status: "approved",
        date: "2026-07-02T10:00:00",
      }),
    ];

    expect(
      filterAdminReviews(reviews, {
        search: "soft",
        rating: "5",
        status: "approved",
        product: "10",
        after: "2026-06-01",
        before: "2026-06-30",
      }),
    ).toEqual([reviews[0]]);
  });
});

function reviewFixture(
  overrides: Partial<ReturnType<typeof mapCommentToAdminReview>> = {},
) {
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
