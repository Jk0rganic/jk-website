import { describe, expect, it } from "vitest";
import { applyReportTableState, type ReportColumn } from "./report-table";

type Row = {
  name: string;
  revenue: number;
  status: string;
};

const columns: ReportColumn<Row>[] = [
  { key: "name", header: "Name", searchValue: (row) => row.name },
  {
    key: "revenue",
    header: "Revenue",
    sortValue: (row) => row.revenue,
  },
  { key: "status", header: "Status", searchValue: (row) => row.status },
];

const rows: Row[] = [
  { name: "Aloe Balm", revenue: 1600, status: "Top seller" },
  { name: "Neem Soap", revenue: 800, status: "Slow mover" },
  { name: "Baobab Butter", revenue: 0, status: "No sales" },
];

describe("applyReportTableState", () => {
  it("filters rows across searchable columns, sorts them, and paginates", () => {
    expect(
      applyReportTableState({
        rows,
        columns,
        search: "sales",
        sortKey: "revenue",
        sortDirection: "asc",
        page: 1,
        pageSize: 1,
      }),
    ).toEqual({
      pageRows: [{ name: "Baobab Butter", revenue: 0, status: "No sales" }],
      totalRows: 1,
      totalPages: 1,
      page: 1,
    });
  });

  it("clamps pagination after filtering changes the row count", () => {
    expect(
      applyReportTableState({
        rows,
        columns,
        search: "",
        sortKey: "revenue",
        sortDirection: "desc",
        page: 9,
        pageSize: 2,
      }),
    ).toMatchObject({
      pageRows: [{ name: "Baobab Butter", revenue: 0, status: "No sales" }],
      totalRows: 3,
      totalPages: 2,
      page: 2,
    });
  });
});
