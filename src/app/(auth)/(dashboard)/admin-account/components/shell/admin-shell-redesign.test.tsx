import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import AdminSidebar from "./admin-sidebar";
import AdminTopbar from "./admin-topbar";

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin-account/customers",
}));

vi.mock("next/image", () => ({
  default: ({
    priority: _priority,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & { priority?: boolean }) => (
    // biome-ignore lint/performance/noImgElement lint/a11y/useAltText: test mock for next/image.
    <img {...props} />
  ),
}));

vi.mock("@/app/(auth)/auth/signup/comp/social_login/action", () => ({
  logoutTo: vi.fn(),
}));

const user = {
  name: "Joan Kimani",
  email: "joan@jkorganics.co.ke",
  role: "super_admin",
};

describe("admin redesign shell", () => {
  it("includes customers and reviews navigation entries", () => {
    render(<AdminSidebar user={user} open={false} onClose={() => undefined} />);

    expect(screen.getByRole("link", { name: /customers/i })).toHaveAttribute(
      "href",
      "/admin-account/customers",
    );
    expect(screen.getByRole("link", { name: /reviews/i })).toHaveAttribute(
      "href",
      "/admin-account/reviews",
    );
  });

  it("renders global search, theme toggle, notifications, and store link", async () => {
    render(
      <AdminTopbar pathname="/admin-account/customers" onMenuClick={vi.fn()} />,
    );

    expect(
      screen.getByPlaceholderText("Search orders, products, customers..."),
    ).toBeInTheDocument();
    expect(screen.getByText("⌘K")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /toggle theme/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /notifications/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /view store/i })).toHaveAttribute(
      "href",
      "/",
    );

    await userEvent.click(
      screen.getByRole("button", { name: /toggle theme/i }),
    );
    expect(document.documentElement.dataset.adminTheme).toBe("dark");
  });
});
