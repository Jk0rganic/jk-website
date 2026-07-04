import { describe, expect, it } from "vitest";
import {
  buildAnalyticsExportFilename,
  buildCsv,
  type CsvColumn,
} from "./analytics-csv";

type Row = {
  product: string;
  revenue: number;
  note: string;
};

const columns: CsvColumn<Row>[] = [
  { key: "product", header: "Product", value: (row) => row.product },
  { key: "revenue", header: "Revenue", value: (row) => row.revenue },
  { key: "note", header: "Note", value: (row) => row.note },
];

describe("buildCsv", () => {
  it("preserves column order and escapes commas, quotes, and newlines", () => {
    expect(
      buildCsv(columns, [
        {
          product: "Aloe, Balm",
          revenue: 1200,
          note: 'Customer said "repeat"\nfast mover',
        },
      ]),
    ).toBe(
      'Product,Revenue,Note\r\n"Aloe, Balm",1200,"Customer said ""repeat""\nfast mover"',
    );
  });

  it("exports report rows with empty values kept in place", () => {
    expect(
      buildCsv(columns, [
        { product: "Neem Soap", revenue: 0, note: "" },
        { product: "Baobab Butter", revenue: 850, note: "No sales" },
      ]),
    ).toBe(
      "Product,Revenue,Note\r\nNeem Soap,0,\r\nBaobab Butter,850,No sales",
    );
  });
});

describe("buildAnalyticsExportFilename", () => {
  it("returns a useful filename containing report type and date range", () => {
    expect(
      buildAnalyticsExportFilename("products", {
        after: "2026-07-03T21:00:00.000Z",
        before: "2026-07-04T20:59:59.999Z",
      }),
    ).toBe("jk-organics-products-2026-07-04-to-2026-07-04.csv");
  });
});
