import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// Brand palette (matches the dashboard gradient: primary → secondary).
const BRAND_PRIMARY: [number, number, number] = [94, 0, 129]; // #5e0081
const BRAND_PRIMARY_SOFT: [number, number, number] = [244, 236, 248]; // light tint

export interface ExportColumn<T> {
  header: string;
  /** Cell value for a given row. Return "" for blanks. */
  value: (row: T) => string | number;
  /** Optional fixed width (Excel: chars, PDF: pt). */
  width?: number;
}

interface BaseOptions<T> {
  /** File name without extension. */
  filename: string;
  /** Document / report title. */
  title: string;
  columns: ExportColumn<T>[];
  rows: T[];
}

function timestamp() {
  return new Date()
    .toISOString()
    .slice(0, 19)
    .replace(/[:T]/g, "-");
}

function formatGeneratedOn() {
  return new Date().toLocaleString("en-RW", {
    dateStyle: "long",
    timeStyle: "short",
  });
}

/** Download the given rows as a styled .xlsx workbook. */
export function exportToExcel<T>({ filename, title, columns, rows }: BaseOptions<T>) {
  const header = columns.map((c) => c.header);
  const body = rows.map((row) => columns.map((c) => c.value(row)));

  // Title row + a generated-on line, then a blank row, then the table.
  const aoa = [
    [title],
    [`Generated on ${formatGeneratedOn()} · ${rows.length} record(s)`],
    [],
    header,
    ...body,
  ];

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // Column widths.
  ws["!cols"] = columns.map((c) => ({
    wch: c.width ?? Math.max(c.header.length + 4, 16),
  }));

  // Merge the title and subtitle across all columns.
  const lastCol = columns.length - 1;
  ws["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: lastCol } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: lastCol } },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  XLSX.writeFile(wb, `${filename}-${timestamp()}.xlsx`);
}

/** Download the given rows as a branded, professional PDF report. */
export function exportToPdf<T>({ filename, title, columns, rows }: BaseOptions<T>) {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  // ── Header band ──────────────────────────────────────────────
  doc.setFillColor(...BRAND_PRIMARY);
  doc.rect(0, 0, pageWidth, 64, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Kigali Cancer Walk 2026", 40, 30);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(title, 40, 48);

  doc.setFontSize(9);
  doc.text(
    `Generated ${formatGeneratedOn()}  ·  ${rows.length} record(s)`,
    pageWidth - 40,
    48,
    { align: "right" },
  );

  // ── Table ────────────────────────────────────────────────────
  autoTable(doc, {
    startY: 84,
    head: [columns.map((c) => c.header)],
    body: rows.map((row) => columns.map((c) => String(c.value(row) ?? ""))),
    theme: "striped",
    styles: {
      font: "helvetica",
      fontSize: 9,
      cellPadding: 6,
      overflow: "linebreak",
      textColor: [40, 40, 40],
    },
    headStyles: {
      fillColor: BRAND_PRIMARY,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "left",
    },
    alternateRowStyles: { fillColor: BRAND_PRIMARY_SOFT },
    columnStyles: columns.reduce(
      (acc, c, i) => {
        if (c.width) acc[i] = { cellWidth: c.width };
        return acc;
      },
      {} as Record<number, { cellWidth: number }>,
    ),
    margin: { left: 40, right: 40 },
    didDrawPage: () => {
      // Footer with page number.
      const pageHeight = doc.internal.pageSize.getHeight();
      const page = doc.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Page ${page}`, pageWidth - 40, pageHeight - 20, {
        align: "right",
      });
    },
  });

  doc.save(`${filename}-${timestamp()}.pdf`);
}
