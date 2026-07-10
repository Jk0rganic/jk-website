import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
  AdminReview,
  AdminReviewSummary,
} from "@/lib/admin/review-service";
import ReviewsPage from "./page";

const reviews: AdminReview[] = [
  {
    id: 1,
    productId: 41,
    productName: "Moringa Powder 250g",
    reviewer: "Amina Yusuf",
    reviewerEmail: "amina@example.com",
    rating: 5,
    date: "2026-07-01T10:00:00.000Z",
    status: "approved",
    content: "Noticeably more energy within a week of using this.",
  },
  {
    id: 2,
    productId: 52,
    productName: "Aloe Vera Juice 1L",
    reviewer: "Samuel Kiptoo",
    reviewerEmail: "samuel@example.com",
    rating: 2,
    date: "2026-06-20T10:00:00.000Z",
    status: "approved",
    content: "Bottle arrived half empty, disappointed with the packaging.",
  },
];

const summary: AdminReviewSummary = {
  total: 2,
  averageRating: 3.5,
  lowRatingCount: 1,
  pendingCount: 0,
  ratingDistribution: { 1: 0, 2: 1, 3: 0, 4: 0, 5: 1 },
};

describe("ReviewsPage", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ reviews, summary }),
      } as Response),
    );
  });

  it("renders review stats and list rows", async () => {
    render(<ReviewsPage />);

    expect(await screen.findByText("Amina Yusuf")).toBeInTheDocument();

    expect(screen.getByText("Average rating")).toBeInTheDocument();
    expect(screen.getByText("3.5")).toBeInTheDocument();

    const totalReviewsCard = screen
      .getByText("Total reviews")
      .closest("article") as HTMLElement;
    expect(within(totalReviewsCard).getByText("2")).toBeInTheDocument();
    expect(screen.getByText("Low ratings")).toBeInTheDocument();

    expect(screen.getByText("Moringa Powder 250g")).toBeInTheDocument();
    expect(
      screen.getByText(/Noticeably more energy within a week/),
    ).toBeInTheDocument();
  });

  it("expands and collapses a review's full detail inline", async () => {
    const user = userEvent.setup();

    render(<ReviewsPage />);

    const samuelRow = (await screen.findByText("Samuel Kiptoo")).closest(
      "tr",
    ) as HTMLElement;

    await user.click(
      within(samuelRow).getByRole("button", { name: "Details" }),
    );

    await waitFor(() => {
      expect(
        screen.getAllByText(/Bottle arrived half empty/).length,
      ).toBeGreaterThan(0);
    });

    await user.click(screen.getByRole("button", { name: "Hide" }));

    expect(
      screen.queryByRole("button", { name: "Hide" }),
    ).not.toBeInTheDocument();
  });
});
