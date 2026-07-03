import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./fetchRest", () => ({
  fetchWoo: vi.fn(),
}));

import { fetchWoo } from "./fetchRest";
import { createOrderNote, fetchOrderNotes } from "./orderNotes";

const mockedFetchWoo = vi.mocked(fetchWoo);

describe("order notes Woo helpers", () => {
  beforeEach(() => {
    mockedFetchWoo.mockReset();
  });

  it("fetches notes for an order without cache", async () => {
    const notes = [{ id: 1, note: "Packed", customer_note: false }];
    mockedFetchWoo.mockResolvedValue(notes);

    await expect(fetchOrderNotes(42)).resolves.toBe(notes);

    expect(mockedFetchWoo).toHaveBeenCalledWith("orders/42/notes", {
      noCache: true,
    });
  });

  it("creates customer-facing notes with the Woo payload shape", async () => {
    const note = {
      id: 2,
      note: "Please collect tomorrow",
      customer_note: true,
    };
    mockedFetchWoo.mockResolvedValue(note);

    await expect(
      createOrderNote(42, {
        note: "Please collect tomorrow",
        customerNote: true,
      }),
    ).resolves.toBe(note);

    expect(mockedFetchWoo).toHaveBeenCalledWith("orders/42/notes", {
      method: "POST",
      body: { note: "Please collect tomorrow", customer_note: true },
      noCache: true,
    });
  });
});
