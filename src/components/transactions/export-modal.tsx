import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EXPORT_COLUMNS, type ExportColumnKey } from "@/lib/finance/types";

export function ExportModal({
  open,
  onClose,
  rowCount,
  filterCount,
  onExport,
}: {
  open: boolean;
  onClose: () => void;
  rowCount: number;
  filterCount: number;
  onExport: (columns: ExportColumnKey[], filename?: string) => Promise<void>;
}) {
  const [order, setOrder] = useState<ExportColumnKey[]>(EXPORT_COLUMNS.map((c) => c.key));
  const [included, setIncluded] = useState<Set<ExportColumnKey>>(
    new Set(EXPORT_COLUMNS.map((c) => c.key)),
  );
  const [filename, setFilename] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setOrder(EXPORT_COLUMNS.map((c) => c.key));
      setIncluded(new Set(EXPORT_COLUMNS.map((c) => c.key)));
      setFilename("");
    }
  }, [open]);

  const selected = order.filter((k) => included.has(k));
  const label = (key: ExportColumnKey) => EXPORT_COLUMNS.find((c) => c.key === key)?.label ?? key;

  const move = (index: number, dir: -1 | 1) => {
    setOrder((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target]!, next[index]!];
      return next;
    });
  };

  const handle = async () => {
    if (!selected.length) return;
    setBusy(true);
    try {
      await onExport(selected, filename.trim() || undefined);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && !busy && onClose()}>
      <DialogContent>
        <DialogTitle>Build CSV report</DialogTitle>
        <DialogDescription>
          Pick columns and their order. The download uses the filters currently applied to the table
          ({rowCount} row{rowCount === 1 ? "" : "s"}
          {filterCount ? ` · ${filterCount} filter${filterCount === 1 ? "" : "s"}` : ""}).
        </DialogDescription>

        <div className="mt-4 flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setIncluded(new Set(order))}>
            All
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setIncluded(new Set())}>
            None
          </Button>
        </div>

        <ul className="mt-3 max-h-64 space-y-1 overflow-auto pr-1">
          {order.map((key, i) => (
            <li
              key={key}
              className="flex items-center gap-2 rounded-md bg-bg px-2 py-1.5"
            >
              <Checkbox
                checked={included.has(key)}
                onCheckedChange={(v) => {
                  setIncluded((prev) => {
                    const next = new Set(prev);
                    if (v) next.add(key);
                    else next.delete(key);
                    return next;
                  });
                }}
                aria-label={`Include ${label(key)}`}
              />
              <span className="flex-1 text-sm">{label(key)}</span>
              <button
                type="button"
                className="grid size-8 place-items-center rounded-sm text-muted hover:bg-surface-2 hover:text-fg"
                onClick={() => move(i, -1)}
                aria-label="Move up"
              >
                <ArrowUp className="size-3.5" />
              </button>
              <button
                type="button"
                className="grid size-8 place-items-center rounded-sm text-muted hover:bg-surface-2 hover:text-fg"
                onClick={() => move(i, 1)}
                aria-label="Move down"
              >
                <ArrowDown className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>

        <div className="mt-4">
          <Label htmlFor="csv-name">File name (optional)</Label>
          <Input
            id="csv-name"
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            placeholder="penta-report"
          />
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={() => void handle()} disabled={busy || selected.length === 0}>
            <Download className="size-4" />
            {busy ? "Preparing…" : `Download ${selected.length} columns`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
