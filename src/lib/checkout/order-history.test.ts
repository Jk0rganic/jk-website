import { describe, expect, it } from "vitest";
import {
  buildHistoryMetaEntry,
  getAdminIdentity,
  getFulfillmentHistory,
  getStatusHistory,
} from "./order-history";

describe("getAdminIdentity", () => {
  it("prefers the admin's name over email", () => {
    expect(getAdminIdentity({ name: "Jane Doe", email: "jane@jk.test" })).toBe(
      "Jane Doe",
    );
  });

  it("falls back to email when name is missing", () => {
    expect(getAdminIdentity({ email: "jane@jk.test" })).toBe("jane@jk.test");
  });

  it("falls back to a placeholder when neither is available", () => {
    expect(getAdminIdentity({})).toBe("Unknown admin");
  });
});

describe("buildHistoryMetaEntry", () => {
  it("appends a new entry to an empty history", () => {
    const meta = buildHistoryMetaEntry(undefined, "_jk_status_history", {
      value: "processing",
      by: "Jane Doe",
      at: "2026-07-17T10:00:00.000Z",
    });

    expect(meta.key).toBe("_jk_status_history");
    expect(JSON.parse(meta.value)).toEqual([
      { value: "processing", by: "Jane Doe", at: "2026-07-17T10:00:00.000Z" },
    ]);
  });

  it("appends to existing history without dropping prior entries", () => {
    const existing = [
      {
        key: "_jk_status_history",
        value: JSON.stringify([
          { value: "pending", by: "Amina", at: "2026-07-16T09:00:00.000Z" },
        ]),
      },
    ];

    const meta = buildHistoryMetaEntry(existing, "_jk_status_history", {
      value: "processing",
      by: "Jane Doe",
      at: "2026-07-17T10:00:00.000Z",
    });

    expect(JSON.parse(meta.value)).toEqual([
      { value: "pending", by: "Amina", at: "2026-07-16T09:00:00.000Z" },
      { value: "processing", by: "Jane Doe", at: "2026-07-17T10:00:00.000Z" },
    ]);
  });
});

describe("getStatusHistory / getFulfillmentHistory", () => {
  it("returns an empty array when no history meta is present", () => {
    expect(getStatusHistory([])).toEqual([]);
    expect(getFulfillmentHistory([])).toEqual([]);
  });

  it("returns an empty array for malformed JSON instead of throwing", () => {
    expect(
      getStatusHistory([{ key: "_jk_status_history", value: "not-json" }]),
    ).toEqual([]);
  });

  it("parses stored history entries", () => {
    const entries = [
      { value: "processing", by: "Jane Doe", at: "2026-07-17T10:00:00.000Z" },
    ];

    expect(
      getFulfillmentHistory([
        { key: "_jk_fulfillment_history", value: JSON.stringify(entries) },
      ]),
    ).toEqual(entries);
  });
});
