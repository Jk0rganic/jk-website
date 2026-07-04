export type AnalyticsDatePreset =
  | "today"
  | "yesterday"
  | "last_7_days"
  | "month_to_date"
  | "last_month"
  | "year_to_date"
  | "custom";

export type AnalyticsDateRange = {
  preset: AnalyticsDatePreset | "comparison";
  after: string;
  before: string;
};

export type ResolveAnalyticsDateRangeOptions = {
  preset: AnalyticsDatePreset;
  now?: Date;
  after?: string;
  before?: string;
};

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

function endOfUtcDay(date: Date): Date {
  return new Date(startOfUtcDay(date).getTime() + DAY_MS - 1);
}

function startOfUtcMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function startOfUtcYear(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
}

export function resolveAnalyticsDateRange({
  preset,
  now = new Date(),
  after,
  before,
}: ResolveAnalyticsDateRangeOptions): AnalyticsDateRange {
  if (preset === "custom") {
    return {
      preset,
      after: new Date(after ?? now).toISOString(),
      before: new Date(before ?? now).toISOString(),
    };
  }

  const todayStart = startOfUtcDay(now);

  if (preset === "today") {
    return {
      preset,
      after: todayStart.toISOString(),
      before: now.toISOString(),
    };
  }

  if (preset === "yesterday") {
    const yesterday = new Date(todayStart.getTime() - DAY_MS);
    return {
      preset,
      after: yesterday.toISOString(),
      before: endOfUtcDay(yesterday).toISOString(),
    };
  }

  if (preset === "last_7_days") {
    const afterDate = new Date(todayStart.getTime() - 6 * DAY_MS);
    return {
      preset,
      after: afterDate.toISOString(),
      before: now.toISOString(),
    };
  }

  if (preset === "month_to_date") {
    return {
      preset,
      after: startOfUtcMonth(now).toISOString(),
      before: now.toISOString(),
    };
  }

  if (preset === "last_month") {
    const thisMonthStart = startOfUtcMonth(now);
    const lastMonthStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1),
    );
    return {
      preset,
      after: lastMonthStart.toISOString(),
      before: new Date(thisMonthStart.getTime() - 1).toISOString(),
    };
  }

  return {
    preset,
    after: startOfUtcYear(now).toISOString(),
    before: now.toISOString(),
  };
}

export function getComparisonRange(
  range: Pick<AnalyticsDateRange, "after" | "before">,
): AnalyticsDateRange {
  const afterTime = new Date(range.after).getTime();
  const beforeTime = new Date(range.before).getTime();
  const duration = beforeTime - afterTime;
  const comparisonBefore = afterTime - 1;

  return {
    preset: "comparison",
    after: new Date(comparisonBefore - duration).toISOString(),
    before: new Date(comparisonBefore).toISOString(),
  };
}
