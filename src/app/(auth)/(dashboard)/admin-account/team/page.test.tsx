import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import TeamPage from "./page";

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

const users = [
  {
    id: "admin-1",
    name: "Jane Admin",
    email: "jane@jk.test",
    role: "min_admin",
    roleLabel: "Admin",
    createdAt: "2026-01-01T00:00:00.000Z",
    status: "active",
    statusLabel: "Active",
    canRemove: true,
    canResetPassword: true,
    canBlock: true,
    canUnblock: false,
    canDelete: true,
    canDemote: true,
  },
  {
    id: "admin-2",
    name: "Blocked Admin",
    email: "blocked@jk.test",
    role: "min_admin",
    roleLabel: "Admin",
    createdAt: "2026-01-02T00:00:00.000Z",
    status: "blocked",
    statusLabel: "Blocked",
    canRemove: true,
    canResetPassword: true,
    canBlock: false,
    canUnblock: true,
    canDelete: true,
  },
];

describe("TeamPage", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    vi.stubGlobal(
      "confirm",
      vi.fn(() => {
        throw new Error("window.confirm should not be used");
      }),
    );
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ users }),
    } as Response);
  });

  it("renders status badges and row actions", async () => {
    render(<TeamPage />);

    expect(await screen.findByText("Jane Admin")).toBeInTheDocument();
    expect(
      screen.getByText("Active", { selector: "span" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Blocked", { selector: "span" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Block" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Unblock" })).toBeInTheDocument();
  });

  it("calls the block endpoint from the active row", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ users }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { id: "admin-1" } }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ users }),
      } as Response);

    render(<TeamPage />);

    await userEvent.click(await screen.findByRole("button", { name: "Block" }));
    expect(
      await screen.findByRole("dialog", { name: "Block admin" }),
    ).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledTimes(1);

    await userEvent.click(screen.getByRole("button", { name: "Block admin" }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/admin/users/admin-1/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ disabled: true }),
      });
    });
  });

  it("closes an action modal without calling the action endpoint", async () => {
    render(<TeamPage />);

    const deleteButtons = await screen.findAllByRole("button", {
      name: "Delete",
    });
    await userEvent.click(deleteButtons[0]);
    expect(
      await screen.findByRole("dialog", { name: "Delete admin" }),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(
      screen.queryByRole("dialog", { name: "Delete admin" }),
    ).not.toBeInTheDocument();
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("uses the remove-role modal to demote a regular admin through the existing endpoint", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ users }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { id: "admin-1", role: "user" } }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ users: users.slice(1) }),
      } as Response);

    render(<TeamPage />);

    const roleButtons = await screen.findAllByRole("button", {
      name: "Remove role",
    });
    await userEvent.click(roleButtons[0]);
    const dialog = await screen.findByRole("dialog", {
      name: "Remove admin role",
    });

    await userEvent.click(
      within(dialog).getByRole("button", { name: "Remove role" }),
    );

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/admin/users/admin-1", {
        method: "PATCH",
      });
    });
  });
});
