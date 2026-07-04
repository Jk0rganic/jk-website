import { describe, expect, it } from "vitest";
import { formatShortDate } from "./analytics-page";

describe("analytics chart date labels", () => {
  it("formats UTC boundaries in Nairobi time", () => {
    expect(formatShortDate("2026-07-03T21:00:00.000Z")).toBe("4 Jul");
  });
});
