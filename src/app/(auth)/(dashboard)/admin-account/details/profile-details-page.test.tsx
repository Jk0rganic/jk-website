import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import ProfileDetailsPage from "./profile-details-page";

const sessionUser = {
  name: "Joan Kimani",
  email: "joan@jkorganics.co.ke",
  role: "super_admin",
};

describe("ProfileDetailsPage", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders password strength feedback as the new password changes", async () => {
    render(<ProfileDetailsPage user={sessionUser} />);

    const newPassword = screen.getByLabelText("New password");

    await userEvent.type(newPassword, "short");
    expect(screen.getByText("Weak")).toBeInTheDocument();
    expect(screen.getByTestId("password-strength-bar")).toHaveStyle({
      width: "33%",
    });

    await userEvent.clear(newPassword);
    await userEvent.type(newPassword, "Goodpass1!");

    expect(screen.getByText("Strong")).toBeInTheDocument();
    expect(screen.getByTestId("password-strength-bar")).toHaveStyle({
      width: "100%",
    });
  });

  it("validates password update fields before showing success", async () => {
    render(<ProfileDetailsPage user={sessionUser} />);

    await userEvent.click(
      screen.getByRole("button", { name: "Update password" }),
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Enter your current password.",
    );

    await userEvent.type(screen.getByLabelText("Current password"), "oldpass");
    await userEvent.type(screen.getByLabelText("New password"), "short");
    await userEvent.click(
      screen.getByRole("button", { name: "Update password" }),
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "New password must be at least 8 characters.",
    );

    await userEvent.clear(screen.getByLabelText("New password"));
    await userEvent.type(screen.getByLabelText("New password"), "Goodpass1!");
    await userEvent.type(
      screen.getByLabelText("Confirm new password"),
      "Different1!",
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Update password" }),
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "New password and confirmation do not match.",
    );

    await userEvent.clear(screen.getByLabelText("Confirm new password"));
    await userEvent.type(
      screen.getByLabelText("Confirm new password"),
      "Goodpass1!",
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Update password" }),
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "Password updated successfully.",
    );
    expect(screen.getByLabelText("Current password")).toHaveValue("");
    expect(screen.getByLabelText("New password")).toHaveValue("");
    expect(screen.getByLabelText("Confirm new password")).toHaveValue("");
  });
});
