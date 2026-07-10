import { describe, expect, it } from "vitest";
import {
  getComparisonRange,
  resolveAnalyticsDateRange,
} from "./analytics-date";

const NOW = new Date("2026-07-03T12:00:00.000Z");

describe("resolveAnalyticsDateRange", () => {
  it.each([
    ["today", "2026-07-02T21:00:00.000Z", "2026-07-03T20:59:59.999Z"],
    ["yesterday", "2026-07-01T21:00:00.000Z", "2026-07-02T20:59:59.999Z"],
    ["last_7_days", "2026-06-26T21:00:00.000Z", "2026-07-03T20:59:59.999Z"],
    ["month_to_date", "2026-06-30T21:00:00.000Z", "2026-07-03T20:59:59.999Z"],
    ["last_month", "2026-05-31T21:00:00.000Z", "2026-06-30T20:59:59.999Z"],
    ["year_to_date", "2025-12-31T21:00:00.000Z", "2026-07-03T20:59:59.999Z"],
  ] as const)("resolves the %s preset", (preset, after, before) => {
    expect(resolveAnalyticsDateRange({ preset, now: NOW })).toEqual({
      preset,
      after,
      before,
    });
  });

  it("resolves custom ranges from explicit boundaries", () => {
    expect(
      resolveAnalyticsDateRange({
        preset: "custom",
        after: "2026-05-10T08:00:00.000Z",
        before: "2026-05-13T16:30:00.000Z",
        now: NOW,
      }),
    ).toEqual({
      preset: "custom",
      after: "2026-05-10T08:00:00.000Z",
      before: "2026-05-13T16:30:00.000Z",
    });
  });
});

describe("getComparisonRange", () => {
  it("returns the equally sized period immediately before the selected range", () => {
    const range = resolveAnalyticsDateRange({
      preset: "last_7_days",
      now: NOW,
    });

    expect(getComparisonRange(range)).toEqual({
      preset: "comparison",
      after: "2026-06-19T21:00:00.000Z",
      before: "2026-06-26T20:59:59.999Z",
    });
  });
});
