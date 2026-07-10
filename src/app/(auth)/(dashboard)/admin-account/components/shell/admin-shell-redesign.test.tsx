import { render, screen } from "@testing-library/react";
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

  // Theme toggle and notifications aren't implemented in the current topbar
  // (that's separate admin dark/light-mode work) — this only asserts what
  // actually renders today.
  it("renders global search and store link", () => {
    render(
      <AdminTopbar pathname="/admin-account/customers" onMenuClick={vi.fn()} />,
    );

    expect(
      screen.getByRole("searchbox", { name: /search admin/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /view store/i })).toHaveAttribute(
      "href",
      "/",
    );
  });
});
