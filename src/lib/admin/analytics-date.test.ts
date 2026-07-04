import { describe, expect, it } from "vitest";
import {
  getComparisonRange,
  resolveAnalyticsDateRange,
} from "./analytics-date";

const NOW = new Date("2026-07-03T12:00:00.000Z");

describe("resolveAnalyticsDateRange", () => {
  it.each([
    ["today", "2026-07-03T00:00:00.000Z", "2026-07-03T12:00:00.000Z"],
    ["yesterday", "2026-07-02T00:00:00.000Z", "2026-07-02T23:59:59.999Z"],
    ["last_7_days", "2026-06-27T00:00:00.000Z", "2026-07-03T12:00:00.000Z"],
    ["month_to_date", "2026-07-01T00:00:00.000Z", "2026-07-03T12:00:00.000Z"],
    ["last_month", "2026-06-01T00:00:00.000Z", "2026-06-30T23:59:59.999Z"],
    ["year_to_date", "2026-01-01T00:00:00.000Z", "2026-07-03T12:00:00.000Z"],
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
      after: "2026-06-20T11:59:59.999Z",
      before: "2026-06-26T23:59:59.999Z",
    });
  });
});
