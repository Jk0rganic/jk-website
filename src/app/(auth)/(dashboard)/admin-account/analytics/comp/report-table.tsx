"use client";

import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import type React from "react";
import { useMemo, useState } from "react";
import type { CsvCellValue, CsvColumn } from "@/lib/admin/analytics-csv";
import ui from "../../components/ui/admin-ui.module.scss";
import styles from "../styles.module.scss";
import CsvExport from "./csv-export";

export type ReportSortDirection = "asc" | "desc";

export type ReportColumn<Row> = {
  key: string;
  header: string;
  render?: (row: Row) => React.ReactNode;
  sortValue?: (row: Row) => string | number | null | undefined;
  searchValue?: (row: Row) => string | number | null | undefined;
  csvValue?: (row: Row) => CsvCellValue;
  align?: "left" | "right";
};

export type ReportTableState<Row> = {
  rows: Row[];
  columns: ReportColumn<Row>[];
  search: string;
  sortKey: string;
  sortDirection: ReportSortDirection;
  page: number;
  pageSize: number;
};

export function applyReportTableState<Row>({
  rows,
  columns,
  search,
  sortKey,
  sortDirection,
  page,
  pageSize,
}: ReportTableState<Row>) {
  const normalizedSearch = search.trim().toLowerCase();
  const searchableColumns = columns.filter(
    (column) => column.searchValue || column.sortValue,
  );
  const sortColumn = columns.find((column) => column.key === sortKey);

  const filteredRows = normalizedSearch
    ? rows.filter((row) =>
        searchableColumns.some((column) =>
          String((column.searchValue ?? column.sortValue)?.(row) ?? "")
            .toLowerCase()
            .includes(normalizedSearch),
        ),
      )
    : rows;

  const sortedRows = sortColumn?.sortValue
    ? [...filteredRows].sort((a, b) => {
        const aValue = sortColumn.sortValue?.(a);
        const bValue = sortColumn.sortValue?.(b);

        if (typeof aValue === "number" && typeof bValue === "number") {
          return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
        }

        const comparison = String(aValue ?? "").localeCompare(
          String(bValue ?? ""),
          undefined,
          { numeric: true, sensitivity: "base" },
        );
        return sortDirection === "asc" ? comparison : -comparison;
      })
    : filteredRows;

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const clampedPage = Math.min(Math.max(1, page), totalPages);
  const start = (clampedPage - 1) * pageSize;

  return {
    pageRows: sortedRows.slice(start, start + pageSize),
    totalRows: sortedRows.length,
    totalPages,
    page: clampedPage,
  };
}

type ReportTableProps<Row> = {
  title: string;
  description?: string;
  rows: Row[];
  columns: ReportColumn<Row>[];
  rowKey: (row: Row) => string | number;
  emptyMessage: string;
  searchPlaceholder?: string;
  initialSortKey?: string;
  initialSortDirection?: ReportSortDirection;
  pageSize?: number;
  visibleColumnKeys?: string[];
  onVisibleColumnKeysChange?: (keys: string[]) => void;
  exportFilename?: string;
};

export default function ReportTable<Row>({
  title,
  description,
  rows,
  columns,
  rowKey,
  emptyMessage,
  searchPlaceholder = "Search report",
  initialSortKey,
  initialSortDirection = "desc",
  pageSize = 8,
  visibleColumnKeys,
  onVisibleColumnKeysChange,
  exportFilename,
}: ReportTableProps<Row>) {
  const allColumnKeys = useMemo(
    () => columns.map((column) => column.key),
    [columns],
  );
  const visibleColumns = useMemo(() => {
    if (!visibleColumnKeys?.length) return columns;

    const visibleKeys = new Set(visibleColumnKeys);
    const nextColumns = columns.filter((column) => visibleKeys.has(column.key));

    return nextColumns.length ? nextColumns : columns;
  }, [columns, visibleColumnKeys]);
  const firstSortableColumn = visibleColumns.find((column) => column.sortValue);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState(
    initialSortKey ?? firstSortableColumn?.key ?? columns[0]?.key ?? "",
  );
  const [sortDirection, setSortDirection] =
    useState<ReportSortDirection>(initialSortDirection);
  const [page, setPage] = useState(1);
  const activeSortKey = visibleColumns.some((column) => column.key === sortKey)
    ? sortKey
    : (firstSortableColumn?.key ?? visibleColumns[0]?.key ?? "");

  const tableState = useMemo(
    () =>
      applyReportTableState({
        rows,
        columns: visibleColumns,
        search,
        sortKey: activeSortKey,
        sortDirection,
        page,
        pageSize,
      }),
    [
      activeSortKey,
      page,
      pageSize,
      rows,
      search,
      sortDirection,
      visibleColumns,
    ],
  );
  const csvColumns = useMemo<CsvColumn<Row>[]>(
    () =>
      visibleColumns.map((column) => ({
        key: column.key,
        header: column.header,
        value: (row) =>
          column.csvValue?.(row) ??
          column.searchValue?.(row) ??
          column.sortValue?.(row) ??
          "",
      })),
    [visibleColumns],
  );

  const toggleColumn = (columnKey: string) => {
    const currentKeys = visibleColumnKeys?.length
      ? visibleColumnKeys
      : allColumnKeys;
    const nextKeys = currentKeys.includes(columnKey)
      ? currentKeys.filter((key) => key !== columnKey)
      : [...currentKeys, columnKey];

    if (nextKeys.length > 0) {
      onVisibleColumnKeysChange?.(nextKeys);
    }
  };

  const handleSort = (column: ReportColumn<Row>) => {
    if (!column.sortValue) return;

    setPage(1);
    setSortKey((currentKey) => {
      if (currentKey !== column.key) {
        setSortDirection("desc");
        return column.key;
      }

      setSortDirection((currentDirection) =>
        currentDirection === "asc" ? "desc" : "asc",
      );
      return currentKey;
    });
  };

  return (
    <section className={ui.card}>
      <div className={ui.cardHeader}>
        <div>
          <h2>{title}</h2>
          {description && (
            <p className={styles.reportDescription}>{description}</p>
          )}
        </div>
        <div className={styles.reportActions}>
          <span className={styles.reportCount}>
            {tableState.totalRows} rows
          </span>
          {onVisibleColumnKeysChange && (
            <details className={styles.columnMenu}>
              <summary aria-label={`${title} columns`} title="Columns">
                <SlidersHorizontal size={16} aria-hidden />
              </summary>
              <div className={styles.columnMenuPanel}>
                {columns.map((column) => (
                  <label key={column.key}>
                    <input
                      type="checkbox"
                      checked={visibleColumns.some(
                        (visibleColumn) => visibleColumn.key === column.key,
                      )}
                      onChange={() => toggleColumn(column.key)}
                    />
                    <span>{column.header}</span>
                  </label>
                ))}
              </div>
            </details>
          )}
          {exportFilename && (
            <CsvExport
              columns={csvColumns}
              rows={tableState.pageRows}
              filename={exportFilename}
              label={`Export ${title}`}
            />
          )}
        </div>
      </div>
      <div className={ui.cardBody}>
        <label className={styles.reportSearch}>
          <Search size={16} aria-hidden />
          <span className={styles.visuallyHidden}>Search {title}</span>
          <input
            type="search"
            value={search}
            placeholder={searchPlaceholder}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
        </label>

        {tableState.totalRows === 0 ? (
          <p className={ui.empty}>{emptyMessage}</p>
        ) : (
          <>
            <div className={`${ui.tableWrap} ${styles.reportTableWrap}`}>
              <table className={`${ui.table} ${styles.reportTable}`}>
                <thead>
                  <tr>
                    {visibleColumns.map((column) => (
                      <th
                        key={column.key}
                        className={
                          column.align === "right" ? styles.alignRight : ""
                        }
                      >
                        {column.sortValue ? (
                          <button
                            type="button"
                            onClick={() => handleSort(column)}
                            className={styles.sortButton}
                          >
                            {column.header}
                            <ChevronDown
                              aria-hidden
                              className={
                                activeSortKey === column.key &&
                                sortDirection === "asc"
                                  ? styles.sortAsc
                                  : ""
                              }
                            />
                          </button>
                        ) : (
                          column.header
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableState.pageRows.map((row) => (
                    <tr key={rowKey(row)}>
                      {visibleColumns.map((column) => (
                        <td
                          key={column.key}
                          data-label={column.header}
                          className={
                            column.align === "right" ? styles.alignRight : ""
                          }
                        >
                          {column.render?.(row) ??
                            String(column.searchValue?.(row) ?? "")}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={styles.reportPagination}>
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={tableState.page <= 1}
                aria-label={`Previous ${title} page`}
              >
                <ChevronLeft size={16} aria-hidden />
              </button>
              <span>
                Page {tableState.page} of {tableState.totalPages}
              </span>
              <button
                type="button"
                onClick={() =>
                  setPage((current) =>
                    Math.min(tableState.totalPages, current + 1),
                  )
                }
                disabled={tableState.page >= tableState.totalPages}
                aria-label={`Next ${title} page`}
              >
                <ChevronRight size={16} aria-hidden />
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
