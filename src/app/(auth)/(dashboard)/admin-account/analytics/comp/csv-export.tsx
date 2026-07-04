"use client";

import { Download } from "lucide-react";
import { buildCsv, type CsvColumn } from "@/lib/admin/analytics-csv";
import styles from "../styles.module.scss";

type CsvExportProps<Row> = {
  columns: CsvColumn<Row>[];
  rows: Row[];
  filename: string;
  label: string;
};

export default function CsvExport<Row>({
  columns,
  rows,
  filename,
  label,
}: CsvExportProps<Row>) {
  const disabled = rows.length === 0 || columns.length === 0;

  const handleExport = () => {
    if (disabled) return;

    const blob = new Blob([buildCsv(columns, rows)], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      type="button"
      className={styles.exportButton}
      onClick={handleExport}
      disabled={disabled}
      aria-label={label}
      title={label}
    >
      <Download size={16} aria-hidden />
    </button>
  );
}
