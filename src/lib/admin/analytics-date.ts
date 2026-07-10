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
  timezoneOffsetMinutes?: number;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_TIMEZONE_OFFSET_MINUTES = 180;

function localDateParts(date: Date, timezoneOffsetMinutes: number) {
  const localDate = new Date(date.getTime() + timezoneOffsetMinutes * 60_000);

  return {
    year: localDate.getUTCFullYear(),
    month: localDate.getUTCMonth(),
    day: localDate.getUTCDate(),
  };
}

function localInstantToUtc(
  year: number,
  month: number,
  day: number,
  timezoneOffsetMinutes: number,
): Date {
  return new Date(Date.UTC(year, month, day) - timezoneOffsetMinutes * 60_000);
}

function startOfLocalDay(date: Date, timezoneOffsetMinutes: number): Date {
  const { year, month, day } = localDateParts(date, timezoneOffsetMinutes);
  return localInstantToUtc(year, month, day, timezoneOffsetMinutes);
}

function endOfLocalDay(date: Date, timezoneOffsetMinutes: number): Date {
  return new Date(
    startOfLocalDay(date, timezoneOffsetMinutes).getTime() + DAY_MS - 1,
  );
}

function startOfLocalMonth(date: Date, timezoneOffsetMinutes: number): Date {
  const { year, month } = localDateParts(date, timezoneOffsetMinutes);
  return localInstantToUtc(year, month, 1, timezoneOffsetMinutes);
}

function startOfLocalYear(date: Date, timezoneOffsetMinutes: number): Date {
  const { year } = localDateParts(date, timezoneOffsetMinutes);
  return localInstantToUtc(year, 0, 1, timezoneOffsetMinutes);
}

export function resolveAnalyticsDateRange({
  preset,
  now = new Date(),
  after,
  before,
  timezoneOffsetMinutes = DEFAULT_TIMEZONE_OFFSET_MINUTES,
}: ResolveAnalyticsDateRangeOptions): AnalyticsDateRange {
  if (preset === "custom") {
    return {
      preset,
      after: new Date(after ?? now).toISOString(),
      before: new Date(before ?? now).toISOString(),
    };
  }

  const todayStart = startOfLocalDay(now, timezoneOffsetMinutes);
  const todayEnd = endOfLocalDay(now, timezoneOffsetMinutes);

  if (preset === "today") {
    return {
      preset,
      after: todayStart.toISOString(),
      before: todayEnd.toISOString(),
    };
  }

  if (preset === "yesterday") {
    const yesterday = new Date(todayStart.getTime() - DAY_MS);
    return {
      preset,
      after: yesterday.toISOString(),
      before: new Date(yesterday.getTime() + DAY_MS - 1).toISOString(),
    };
  }

  if (preset === "last_7_days") {
    const afterDate = new Date(todayStart.getTime() - 6 * DAY_MS);
    return {
      preset,
      after: afterDate.toISOString(),
      before: todayEnd.toISOString(),
    };
  }

  if (preset === "month_to_date") {
    return {
      preset,
      after: startOfLocalMonth(now, timezoneOffsetMinutes).toISOString(),
      before: todayEnd.toISOString(),
    };
  }

  if (preset === "last_month") {
    const { year, month } = localDateParts(now, timezoneOffsetMinutes);
    const thisMonthStart = startOfLocalMonth(now, timezoneOffsetMinutes);
    const lastMonthStart = localInstantToUtc(
      year,
      month - 1,
      1,
      timezoneOffsetMinutes,
    );
    return {
      preset,
      after: lastMonthStart.toISOString(),
      before: new Date(thisMonthStart.getTime() - 1).toISOString(),
    };
  }

  return {
    preset,
    after: startOfLocalYear(now, timezoneOffsetMinutes).toISOString(),
    before: todayEnd.toISOString(),
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
