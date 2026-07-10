"use client";

import { CalendarDays, RefreshCw } from "lucide-react";
import styles from "../styles.module.scss";

export type AnalyticsDatePreset =
  | "today"
  | "yesterday"
  | "last_7_days"
  | "month_to_date"
  | "last_month"
  | "year_to_date"
  | "custom";

export type DateRangeControlValue = {
  preset: AnalyticsDatePreset;
  after: string;
  before: string;
};

type DateRangeControlsProps = {
  value: DateRangeControlValue;
  loading?: boolean;
  onChange: (value: DateRangeControlValue) => void;
  onRefresh: () => void;
};

const PRESETS: Array<{ value: AnalyticsDatePreset; label: string }> = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last_7_days", label: "Last 7 days" },
  { value: "month_to_date", label: "Month to date" },
  { value: "last_month", label: "Last month" },
  { value: "year_to_date", label: "Year to date" },
  { value: "custom", label: "Custom" },
];

const NAIROBI_TIMEZONE_OFFSET_MINUTES = 180;
const DAY_MS = 24 * 60 * 60 * 1000;

export function toInputDate(value: string) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Date(date.getTime() + NAIROBI_TIMEZONE_OFFSET_MINUTES * 60_000)
    .toISOString()
    .slice(0, 10);
}

export function toDateBoundary(value: string, boundary: "start" | "end") {
  if (!value) return "";

  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return "";

  const localStartUtc =
    Date.UTC(year, month - 1, day) - NAIROBI_TIMEZONE_OFFSET_MINUTES * 60_000;
  const utcTime =
    boundary === "start" ? localStartUtc : localStartUtc + DAY_MS - 1;

  return new Date(utcTime).toISOString();
}

export default function DateRangeControls({
  value,
  loading,
  onChange,
  onRefresh,
}: DateRangeControlsProps) {
  const isCustom = value.preset === "custom";

  return (
    <div className={styles.controls}>
      <label className={styles.controlGroup}>
        <span>Range</span>
        <select
          value={value.preset}
          onChange={(event) =>
            onChange({
              ...value,
              preset: event.target.value as AnalyticsDatePreset,
            })
          }
        >
          {PRESETS.map((preset) => (
            <option key={preset.value} value={preset.value}>
              {preset.label}
            </option>
          ))}
        </select>
      </label>

      {isCustom && (
        <>
          <label className={styles.controlGroup}>
            <span>After</span>
            <input
              type="date"
              value={toInputDate(value.after)}
              onChange={(event) =>
                onChange({
                  ...value,
                  after: toDateBoundary(event.target.value, "start"),
                })
              }
            />
          </label>
          <label className={styles.controlGroup}>
            <span>Before</span>
            <input
              type="date"
              value={toInputDate(value.before)}
              onChange={(event) =>
                onChange({
                  ...value,
                  before: toDateBoundary(event.target.value, "end"),
                })
              }
            />
          </label>
        </>
      )}

      <button
        type="button"
        className={styles.iconButton}
        onClick={onRefresh}
        disabled={loading}
        aria-label="Refresh analytics"
        title="Refresh analytics"
      >
        {loading ? <RefreshCw className={styles.spin} /> : <CalendarDays />}
      </button>
    </div>
  );
}
