import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AddTransactionDialog } from "@/components/transactions/add-dialog";
import { ExportModal } from "@/components/transactions/export-modal";
import { FilterBar } from "@/components/transactions/filter-bar";
import { TransactionTable } from "@/components/transactions/transaction-table";
import { downloadCsv } from "@/lib/finance/csv";
import {
  addTransaction,
  exportTransactions,
  getSettings,
  getAnomalyMap,
  listTransactions,
} from "@/lib/finance/queries";
import type { Category, ExportColumnKey, Filters, SortField, SortOrder, Status } from "@/lib/finance/types";
import { useDebounce } from "@/hooks/use-debounce";

export function TransactionsPage() {
  const [params] = useSearchParams();
  const q = params.get("q") ?? "";
  const qc = useQueryClient();
  const [filters, setFilters] = useState<Filters>({ search: q });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState<SortField>("occurred_at");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [exportOpen, setExportOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const debounced = useDebounce(filters);

  useEffect(() => {
    if (q) setFilters((f) => ({ ...f, search: q }));
  }, [q]);

  const settings = useQuery({ queryKey: ["settings"], queryFn: () => getSettings() });
  const currency = settings.data?.currency ?? "USD";
  const list = useQuery({
    queryKey: ["transactions", debounced, page, limit, sortBy, sortOrder],
    queryFn: () =>
      listTransactions({ data: { filters: debounced, page, limit, sortBy, sortOrder } }),
    placeholderData: keepPreviousData,
  });
  const anomalies = useQuery({ queryKey: ["anomalies-map"], queryFn: () => getAnomalyMap() });

  const add = useMutation({
    mutationFn: (input: {
      date: string;
      amount: number;
      category: Category;
      status: Status;
      partyName: string;
      note?: string;
    }) => addTransaction({ data: input }),
    onSuccess: () => {
      toast.success("Transaction added");
      void qc.invalidateQueries();
    },
    onError: (err) => toast.error(err.message || "Could not add transaction"),
  });

  const filterCount = useMemo(
    () => Object.values(filters).filter((v) => v !== undefined && v !== "" && v !== null).length,
    [filters],
  );

  const onSort = (field: SortField) => {
    if (field === sortBy) setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    else {
      setSortBy(field);
      setSortOrder("desc");
    }
    setPage(1);
  };

  return (
    <section className="panel p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold">Ledger</h2>
          <p className="text-sm text-muted">Search, sort, and filter every movement.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setExportOpen(true)}>
            <Download className="size-4" />
            Export
          </Button>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="size-4" />
            Add
          </Button>
        </div>
      </div>
      <FilterBar
        filters={filters}
        onChange={(next) => {
          setFilters(next);
          setPage(1);
        }}
        onClear={() => {
          setFilters({});
          setPage(1);
        }}
      />
      <div className="mt-2">
        <TransactionTable
          rows={list.data?.data ?? []}
          pagination={list.data?.pagination}
          loading={list.isLoading}
          sortBy={sortBy}
          sortOrder={sortOrder}
          currency={currency}
          anomalyMap={anomalies.data}
          onSort={onSort}
          onPageChange={setPage}
          onLimitChange={(n) => {
            setLimit(n);
            setPage(1);
          }}
        />
      </div>
      <ExportModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        rowCount={list.data?.pagination.total ?? 0}
        filterCount={filterCount}
        onExport={async (columns: ExportColumnKey[], filename?: string) => {
          const result = await exportTransactions({
            data: { filters: debounced, columns, sortBy, sortOrder, filename },
          });
          downloadCsv(result.filename, result.csv);
          toast.success(`Downloaded ${result.rowCount} rows`);
        }}
      />
      <AddTransactionDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSave={async (input) => {
          await add.mutateAsync(input);
        }}
      />
    </section>
  );
}
