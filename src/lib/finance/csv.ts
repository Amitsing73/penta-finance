import type { ExportColumnKey, Transaction } from "./types";
import { EXPORT_COLUMNS } from "./types";

const VALUE_FNS: Record<ExportColumnKey, (t: Transaction) => string | number> = {
  id: (t) => t.id,
  date: (t) => t.occurredAt,
  amount: (t) => t.amount.toFixed(2),
  category: (t) => t.category,
  status: (t) => t.status,
  party_id: (t) => t.partyId,
  party_name: (t) => t.partyName,
  note: (t) => t.note ?? "",
};

export function csvEscape(value: string | number): string {
  const s = String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function transactionsToCsv(
  rows: Transaction[],
  columns: ExportColumnKey[],
): string {
  const keys = columns.filter((k) => VALUE_FNS[k]);
  const header = keys
    .map((k) => EXPORT_COLUMNS.find((c) => c.key === k)?.label ?? k)
    .map(csvEscape)
    .join(",");
  const body = rows
    .map((row) => keys.map((k) => csvEscape(VALUE_FNS[k](row))).join(","))
    .join("\r\n");
  return `${header}\r\n${body}\r\n`;
}

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  const src = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < src.length; i += 1) {
    const ch = src[i]!;
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        cell += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      continue;
    }
    if (ch === ",") {
      row.push(cell.trim());
      cell = "";
      continue;
    }
    if (ch === "\n") {
      row.push(cell.trim());
      if (row.some((c) => c.length > 0)) rows.push(row);
      row = [];
      cell = "";
      continue;
    }
    if (ch === "\r") continue;
    cell += ch;
  }
  row.push(cell.trim());
  if (row.some((c) => c.length > 0)) rows.push(row);
  return rows;
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
