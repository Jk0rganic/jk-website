import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/admin/require-admin", () => ({
  requireAdminSession: vi.fn(),
}));

vi.mock("@/lib/fetch/orderNotes", () => ({
  createOrderNote: vi.fn(),
  fetchOrderNotes: vi.fn(),
}));

import { requireAdminSession } from "@/lib/admin/require-admin";
import { createOrderNote, fetchOrderNotes } from "@/lib/fetch/orderNotes";
import { GET, POST } from "./route";

const mockedRequireAdminSession = vi.mocked(requireAdminSession);
const mockedFetchOrderNotes = vi.mocked(fetchOrderNotes);
const mockedCreateOrderNote = vi.mocked(createOrderNote);

const params = { params: Promise.resolve({ id: "42" }) };
const adminSession = {
  user: { id: "1", email: "admin@jk.test", role: "min_admin" },
} as never;

describe("/api/admin/orders/[id]/notes", () => {
  beforeEach(() => {
    mockedRequireAdminSession.mockReset();
    mockedFetchOrderNotes.mockReset();
    mockedCreateOrderNote.mockReset();
    mockedRequireAdminSession.mockResolvedValue({
      error: null,
      status: 200,
      session: adminSession,
    });
  });

  it("requires an admin session for GET", async () => {
    mockedRequireAdminSession.mockResolvedValue({
      error: "Unauthorized",
      status: 401,
      session: null,
    });

    const response = await GET(
      new Request("http://test.local/api/admin/orders/42/notes"),
      params,
    );

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Unauthorized" });
    expect(mockedFetchOrderNotes).not.toHaveBeenCalled();
  });

  it("fetches notes for a valid order id", async () => {
    const notes = [{ id: 7, note: "Packed", customer_note: false }];
    mockedFetchOrderNotes.mockResolvedValue(notes);

    const response = await GET(
      new Request("http://test.local/api/admin/orders/42/notes"),
      params,
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ notes });
    expect(mockedFetchOrderNotes).toHaveBeenCalledWith(42);
  });

  it("rejects a blank POST note", async () => {
    const response = await POST(
      new Request("http://test.local/api/admin/orders/42/notes", {
        method: "POST",
        body: JSON.stringify({ note: "   " }),
      }),
      params,
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: "Invalid note" });
    expect(mockedCreateOrderNote).not.toHaveBeenCalled();
  });

  it("creates an order note with customer note flag", async () => {
    const note = { id: 8, note: "Customer can collect", customer_note: true };
    mockedCreateOrderNote.mockResolvedValue(note);

    const response = await POST(
      new Request("http://test.local/api/admin/orders/42/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          note: " Customer can collect ",
          customerNote: true,
        }),
      }),
      params,
    );

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ note });
    expect(mockedCreateOrderNote).toHaveBeenCalledWith(42, {
      note: "Customer can collect",
      customerNote: true,
    });
  });
});
