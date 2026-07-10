import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import ReviewsPage from "./page";

describe("ReviewsPage", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders review stats and list rows", () => {
    render(<ReviewsPage />);

    expect(screen.getByText("Average rating")).toBeInTheDocument();
    expect(screen.getByText("4.0 / 5")).toBeInTheDocument();
    expect(screen.getByText("Total reviews")).toBeInTheDocument();
    expect(screen.getByText("612")).toBeInTheDocument();
    expect(screen.getByText("5-star share")).toBeInTheDocument();
    expect(screen.getByText("43%")).toBeInTheDocument();
    expect(screen.getByText("Needs attention (<=3 stars)")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: /open review from Amina Yusuf for Moringa Powder 250g/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Amina Yusuf")).toBeInTheDocument();
    expect(screen.getByText(/Moringa Powder 250g/)).toBeInTheDocument();
    expect(
      screen.getByText(/Noticeably more energy within a week/),
    ).toBeInTheDocument();
  });

  it("opens and closes the review detail modal", async () => {
    const user = userEvent.setup();

    render(<ReviewsPage />);

    await user.click(
      screen.getByRole("button", {
        name: /open review from Samuel Kiptoo for Aloe Vera Juice 1L/i,
      }),
    );

    const dialog = screen.getByRole("dialog", {
      name: "Review from Samuel Kiptoo",
    });

    expect(dialog).toBeInTheDocument();
    expect(
      within(dialog).getByText(/Bottle arrived half empty/),
    ).toBeInTheDocument();
    expect(within(dialog).getByText("Needs attention")).toBeInTheDocument();

    await user.click(
      within(dialog).getByRole("button", { name: "Close review" }),
    );

    expect(
      screen.queryByRole("dialog", { name: "Review from Samuel Kiptoo" }),
    ).not.toBeInTheDocument();
  });
});
