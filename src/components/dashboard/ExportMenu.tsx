import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, ChevronDown, FileSpreadsheet, FileText, Files } from "lucide-react";
import {
  exportToExcel,
  exportToPdf,
  exportWorkbook,
  type ExportColumn,
  type WorkbookSheet,
} from "../../utils/exportData";

interface ExportMenuProps<T> {
  rows: T[];
  columns: ExportColumn<T>[];
  /** File name without extension (e.g. "volunteers"). */
  filename: string;
  /** Report title shown in the file header. */
  title: string;
  disabled?: boolean;
  /**
   * Optional multi-sheet workbook (e.g. one tab per order status). When
   * provided, adds a "Download Workbook" option alongside the single-sheet
   * exports. Independent of `rows`/`columns` — the workbook can have data
   * even when the current table view is empty or filtered down.
   */
  workbookSheets?: WorkbookSheet[];
  /** Label for the workbook option; defaults to "Download Workbook". */
  workbookLabel?: string;
  /** Hint text under the workbook option. */
  workbookHint?: string;
}

export function ExportMenu<T>({
  rows,
  columns,
  filename,
  title,
  disabled,
  workbookSheets,
  workbookLabel = "Download Workbook",
  workbookHint = "One sheet per status (.xlsx)",
}: ExportMenuProps<T>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const hasWorkbook = !!workbookSheets && workbookSheets.length > 0;
  const isDisabled = disabled || (rows.length === 0 && !hasWorkbook);

  const run = (fn: typeof exportToExcel | typeof exportToPdf) => {
    fn({ filename, title, columns, rows });
    setOpen(false);
  };

  const options = [
    {
      label: "Download Excel",
      hint: ".xlsx spreadsheet",
      icon: FileSpreadsheet,
      iconWrap: "bg-emerald-100 text-emerald-600",
      onClick: () => run(exportToExcel),
      disabled: rows.length === 0,
    },
    {
      label: "Download PDF",
      hint: ".pdf report",
      icon: FileText,
      iconWrap: "bg-rose-100 text-rose-600",
      onClick: () => run(exportToPdf),
      disabled: rows.length === 0,
    },
    ...(hasWorkbook
      ? [
          {
            label: workbookLabel,
            hint: workbookHint,
            icon: Files,
            iconWrap: "bg-primary-container text-primary",
            onClick: () => {
              exportWorkbook(filename, workbookSheets);
              setOpen(false);
            },
            disabled: false,
          },
        ]
      : []),
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={isDisabled}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-secondary text-white text-sm font-['Inter'] font-semibold shadow-sm hover:shadow-md hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
      >
        <Download className="w-4 h-4" />
        Export
        <ChevronDown
          className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-outline-variant overflow-hidden z-50"
          >
            <div className="px-4 py-2.5 border-b border-slate-100">
              <p className="font-['Inter'] text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                Export {rows.length} record{rows.length !== 1 ? "s" : ""}
              </p>
            </div>
            {options.map((opt) => (
              <button
                key={opt.label}
                onClick={opt.onClick}
                disabled={opt.disabled}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${opt.iconWrap}`}
                >
                  <opt.icon className="w-4.5 h-4.5" />
                </div>
                <div>
                  <p className="font-['Inter'] text-sm font-semibold text-on-surface">
                    {opt.label}
                  </p>
                  <p className="font-['Inter'] text-xs text-on-surface-variant">
                    {opt.hint}
                  </p>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
