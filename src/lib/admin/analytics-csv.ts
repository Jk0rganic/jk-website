export type CsvCellValue = string | number | boolean | Date | null | undefined;

export type CsvColumn<Row> = {
  key: string;
  header: string;
  value: (row: Row) => CsvCellValue;
};

type AnalyticsExportRange = {
  after: string;
  before: string;
};

function formatCsvCell(value: CsvCellValue): string {
  if (value === null || typeof value === "undefined") return "";

  const text = value instanceof Date ? value.toISOString() : String(value);
  const mustQuote = /[",\r\n]/.test(text);
  const escaped = text.replaceAll('"', '""');

  return mustQuote ? `"${escaped}"` : escaped;
}

function formatFilenameDate(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Africa/Nairobi",
    year: "numeric",
  }).format(new Date(value));
}

export function buildCsv<Row>(columns: CsvColumn<Row>[], rows: Row[]) {
  const header = columns.map((column) => formatCsvCell(column.header));
  const body = rows.map((row) =>
    columns.map((column) => formatCsvCell(column.value(row))).join(","),
  );

  return [header.join(","), ...body].join("\r\n");
}

export function buildAnalyticsExportFilename(
  reportType: string,
  range: AnalyticsExportRange,
) {
  const safeReportType = reportType
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return `jk-organics-${safeReportType || "analytics"}-${formatFilenameDate(
    range.after,
  )}-to-${formatFilenameDate(range.before)}.csv`;
}
