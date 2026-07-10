import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import CustomersPage from "./page";

describe("CustomersPage", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders customer stats, rows, initials, and actions", () => {
    render(<CustomersPage />);

    expect(screen.getByText("Total customers")).toBeInTheDocument();
    expect(screen.getByText("1,284")).toBeInTheDocument();

    const aminaRow = screen.getByRole("row", { name: /amina yusuf/i });
    expect(within(aminaRow).getByText("AY")).toBeInTheDocument();
    expect(within(aminaRow).getByText("+254 712 345 678")).toBeInTheDocument();
    expect(
      within(aminaRow).getByText("Nairobi - Westlands"),
    ).toBeInTheDocument();
    expect(within(aminaRow).getByText("21")).toBeInTheDocument();
    expect(within(aminaRow).getByText("KES 48,200")).toBeInTheDocument();
    expect(within(aminaRow).getByText("VIP")).toBeInTheDocument();
    expect(within(aminaRow).getByRole("button", { name: /reset password/i }));
    expect(within(aminaRow).getByRole("button", { name: /block customer/i }));
    expect(within(aminaRow).getByRole("button", { name: /delete customer/i }));
  });

  it("filters customers by search, status, and location", async () => {
    const user = userEvent.setup();
    render(<CustomersPage />);

    await user.type(
      screen.getByRole("searchbox", { name: /search customers/i }),
      "mary",
    );

    expect(screen.getByText("Mary Achieng")).toBeInTheDocument();
    expect(screen.queryByText("Amina Yusuf")).not.toBeInTheDocument();

    await user.clear(
      screen.getByRole("searchbox", { name: /search customers/i }),
    );
    await user.selectOptions(screen.getByLabelText("Status"), "VIP");

    expect(screen.getByText("Amina Yusuf")).toBeInTheDocument();
    expect(screen.queryByText("Peter Otieno")).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Status"), "All customers");
    await user.selectOptions(screen.getByLabelText("Location"), "Kisumu");

    expect(screen.getByText("Peter Otieno")).toBeInTheDocument();
    expect(screen.getByText("Mary Achieng")).toBeInTheDocument();
    expect(screen.queryByText("Grace Wanjiru")).not.toBeInTheDocument();
  });

  it("confirms a block action in a modal and updates the row", async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, "confirm");

    render(<CustomersPage />);

    const peterRow = screen.getByRole("row", { name: /peter otieno/i });
    await user.click(
      within(peterRow).getByRole("button", { name: /block customer/i }),
    );

    expect(confirmSpy).not.toHaveBeenCalled();
    const dialog = screen.getByRole("dialog", { name: "Block customer?" });
    expect(
      within(dialog).getByText(
        "Peter Otieno will be signed out and blocked from signing in or ordering until unblocked.",
      ),
    ).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "Block" }));

    const updatedRow = screen.getByRole("row", { name: /peter otieno/i });
    expect(within(updatedRow).getByText("Blocked")).toBeInTheDocument();
    expect(
      within(updatedRow).getByRole("button", { name: /unblock customer/i }),
    ).toBeInTheDocument();
  });
});
