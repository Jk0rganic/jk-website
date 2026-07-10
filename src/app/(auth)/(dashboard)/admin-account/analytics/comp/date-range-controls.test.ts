import { describe, expect, it } from "vitest";
import { toDateBoundary, toInputDate } from "./date-range-controls";

describe("analytics custom date conversion", () => {
  it("emits Nairobi local-day UTC boundaries for selected dates", () => {
    expect(toDateBoundary("2026-07-04", "start")).toBe(
      "2026-07-03T21:00:00.000Z",
    );
    expect(toDateBoundary("2026-07-04", "end")).toBe(
      "2026-07-04T20:59:59.999Z",
    );
  });

  it("displays the Nairobi local date for UTC boundary values", () => {
    expect(toInputDate("2026-07-03T21:00:00.000Z")).toBe("2026-07-04");
    expect(toInputDate("2026-07-04T20:59:59.999Z")).toBe("2026-07-04");
  });
});
