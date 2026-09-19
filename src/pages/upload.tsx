import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { parseCsv } from "@/lib/finance/csv";
import { formatDate } from "@/lib/finance/format";
import { importTransactions, listUploads } from "@/lib/finance/queries";
import type { Category, Status, UploadRow } from "@/lib/finance/types";
import { CATEGORIES, STATUSES } from "@/lib/finance/types";

const HEADER_MAP: Record<string, keyof UploadRow | "skip"> = {
  date: "date",
  occurred_at: "date",
  amount: "amount",
  category: "category",
  type: "category",
  status: "status",
  user_id: "partyId",
  party_id: "partyId",
  party_id_col: "partyId",
  name: "partyName",
  party_name: "partyName",
  user: "partyName",
  note: "note",
  memo: "note",
};

function norm(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, "_");
}

function parseRows(text: string): { rows: UploadRow[]; errors: string[] } {
  const table = parseCsv(text);
  if (table.length < 2) return { rows: [], errors: ["File needs a header row and at least one record."] };
  const header = table[0]!.map(norm);
  const idx: Partial<Record<keyof UploadRow, number>> = {};
  header.forEach((h, i) => {
    const mapped = HEADER_MAP[h];
    if (mapped && mapped !== "skip") idx[mapped] = i;
  });
  if (idx.date === undefined || idx.amount === undefined) {
    return { rows: [], errors: ["Need at least Date and Amount columns."] };
  }
  const rows: UploadRow[] = [];
  const errors: string[] = [];
  table.slice(1).forEach((cells, i) => {
    const date = cells[idx.date!] ?? "";
    const amount = Number((cells[idx.amount!] ?? "").replace(/[$,]/g, ""));
    const rawCat = (cells[idx.category ?? -1] ?? "Expense").trim();
    const rawStatus = (cells[idx.status ?? -1] ?? "Paid").trim();
    const category = (CATEGORIES as readonly string[]).includes(rawCat)
      ? (rawCat as Category)
      : rawCat.toLowerCase().includes("rev") || rawCat.toLowerCase().includes("inc")
        ? "Revenue"
        : "Expense";
    const status = (STATUSES as readonly string[]).includes(rawStatus)
      ? (rawStatus as Status)
      : rawStatus.toLowerCase().includes("fail")
        ? "Failed"
        : rawStatus.toLowerCase().includes("pend")
          ? "Pending"
          : "Paid";
    const partyName = (cells[idx.partyName ?? -1] ?? cells[idx.partyId ?? -1] ?? `Party ${i + 1}`).trim();
    if (!date || !Number.isFinite(amount) || amount <= 0) {
      errors.push(`Row ${i + 2}: invalid date or amount`);
      return;
    }
    rows.push({
      date: date.includes("T") ? date : `${date}T12:00:00.000Z`,
      amount,
      category,
      status,
      partyId: cells[idx.partyId ?? -1] || undefined,
      partyName,
      note: cells[idx.note ?? -1] || undefined,
    });
  });
  return { rows, errors };
}

export function UploadPage() {
  const qc = useQueryClient();
  const [filename, setFilename] = useState("upload.csv");
  const [preview, setPreview] = useState<UploadRow[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const history = useQuery({ queryKey: ["uploads"], queryFn: () => listUploads() });

  const importMut = useMutation({
    mutationFn: () => importTransactions({ data: { filename, rows: preview } }),
    onSuccess: (res) => {
      toast.success(`Imported ${res.inserted} rows${res.errors ? `, skipped ${res.errors}` : ""}`);
      setPreview([]);
      setParseErrors([]);
      void qc.invalidateQueries();
    },
    onError: (err) => toast.error(err.message || "Import failed"),
  });

  const onFile = async (file: File) => {
    setFilename(file.name);
    const text = await file.text();
    const parsed = parseRows(text);
    setPreview(parsed.rows);
    setParseErrors(parsed.errors);
    if (parsed.rows.length) toast.message(`${parsed.rows.length} rows ready to import`);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
      <section className="panel p-5">
        <h2 className="font-display text-lg font-semibold">Upload transactions</h2>
        <p className="mt-1 text-sm text-muted">
          Drop a CSV with Date, Amount, Category, Status, Name. Columns from Penta exports work as-is.
          Failed and pending rows generate alerts automatically.
        </p>
        <label className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-border bg-bg px-6 py-12 text-center hover:border-accent/50">
          <Upload className="size-8 text-accent" />
          <span className="mt-3 text-sm font-medium">Drop CSV or click to browse</span>
          <span className="mt-1 text-xs text-subtle">Up to 500 rows per file</span>
          <input
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void onFile(file);
            }}
          />
        </label>
        {parseErrors.length > 0 && (
          <ul className="mt-4 space-y-1 text-xs text-danger">
            {parseErrors.slice(0, 6).map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        )}
        {preview.length > 0 && (
          <>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[480px] text-left text-xs">
                <thead className="text-muted">
                  <tr>
                    <th className="py-2">Name</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.slice(0, 8).map((r, i) => (
                    <tr key={i} className="border-t border-border">
                      <td className="py-2">{r.partyName}</td>
                      <td>{r.date.slice(0, 10)}</td>
                      <td className="tnum">{r.amount.toFixed(2)}</td>
                      <td>{r.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {preview.length > 8 && (
                <p className="mt-2 text-xs text-muted">{preview.length - 8} more rows…</p>
              )}
            </div>
            <Button
              className="mt-4"
              disabled={importMut.isPending}
              onClick={() => importMut.mutate()}
            >
              {importMut.isPending ? "Importing…" : `Import ${preview.length} rows`}
            </Button>
          </>
        )}
      </section>

      <section className="panel p-5">
        <h2 className="font-display text-base font-semibold">Upload history</h2>
        <ul className="mt-3 divide-y divide-border text-sm">
          {(history.data ?? []).map((u) => (
            <li key={u.id} className="py-3">
              <p className="font-medium">{u.filename}</p>
              <p className="text-xs text-muted">
                {u.rowCount} imported
                {u.errorCount ? ` · ${u.errorCount} skipped` : ""} · {formatDate(u.createdAt)}
              </p>
            </li>
          ))}
          {!history.isLoading && !history.data?.length && (
            <li className="py-8 text-center text-muted">No uploads yet.</li>
          )}
        </ul>
      </section>
    </div>
  );
}
