import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Download, PiggyBank } from "lucide-react";
import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { BreakdownCard } from "@/components/dashboard/breakdown";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { RecentList } from "@/components/dashboard/recent-list";
import { TrendChart } from "@/components/dashboard/trend-chart";
import { Button } from "@/components/ui/button";
import { ExportModal } from "@/components/transactions/export-modal";
import { FilterBar } from "@/components/transactions/filter-bar";
import { TransactionTable } from "@/components/transactions/transaction-table";
import { downloadCsv } from "@/lib/finance/csv";
import { exportTransactions, getAnomalyMap, getBudgetOverview, getDashboard, getSettings, listTransactions } from "@/lib/finance/queries";
import type { ExportColumnKey, Filters, SortField, SortOrder } from "@/lib/finance/types";
import { useDebounce } from "@/hooks/use-debounce";

const EMPTY: Filters = {};

export function DashboardPage() {
  const [filters, setFilters] = useState<Filters>(EMPTY);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState<SortField>("occurred_at");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [exportOpen, setExportOpen] = useState(false);
  const debounced = useDebounce(filters);

  const settings = useQuery({ queryKey: ["settings"], queryFn: () => getSettings() });
  const currency = settings.data?.currency ?? "USD";

  const dashboard = useQuery({
    queryKey: ["dashboard", debounced],
    queryFn: () => getDashboard({ data: debounced }),
    placeholderData: keepPreviousData,
  });
  const list = useQuery({
    queryKey: ["transactions", debounced, page, limit, sortBy, sortOrder],
    queryFn: () =>
      listTransactions({ data: { filters: debounced, page, limit, sortBy, sortOrder } }),
    placeholderData: keepPreviousData,
  });
  const budgets = useQuery({ queryKey: ["budgets"], queryFn: () => getBudgetOverview() });
  const anomalies = useQuery({ queryKey: ["anomalies-map"], queryFn: () => getAnomalyMap() });

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

  const onExport = async (columns: ExportColumnKey[], filename?: string) => {
    const result = await exportTransactions({
      data: { filters: debounced, columns, sortBy, sortOrder, filename },
    });
    downloadCsv(result.filename, result.csv);
    toast.success(`Downloaded ${result.rowCount} rows`);
  };

  return (
    <div className="flex flex-col gap-4">
      <KpiCards summary={dashboard.data?.summary} currency={currency} loading={dashboard.isLoading} />

      {budgets.data && (
        <section className="panel p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <PiggyBank className="size-4 text-accent" />
              <h2 className="font-display text-sm font-semibold">Budgets this month</h2>
            </div>
            <Link to="/budgets" className="text-xs font-medium text-accent hover:underline">
              Manage
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {budgets.data.envelopes.map((env) => (
              <div key={env.id}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-muted">{env.name}</span>
                  <span className={env.over ? "text-danger" : "text-fg"}>{env.pct}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-bg">
                  <div
                    className={`h-full rounded-full ${env.over ? "bg-danger" : env.pct > 80 ? "bg-pending" : "bg-accent"}`}
                    style={{ width: `${Math.min(100, env.pct)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(280px,1fr)]">
        <TrendChart data={dashboard.data?.trends} currency={currency} loading={dashboard.isLoading} />
        <RecentList items={dashboard.data?.recent} currency={currency} loading={dashboard.isLoading} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <BreakdownCard
          title="Income vs expenses"
          data={dashboard.data?.categoryBreakdown}
          currency={currency}
          loading={dashboard.isLoading}
        />
        <BreakdownCard
          title="Status mix"
          data={dashboard.data?.statusBreakdown}
          currency={currency}
          loading={dashboard.isLoading}
        />
      </div>

      <section className="panel p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-base font-semibold">Transactions</h2>
          <Button variant="outline" size="sm" onClick={() => setExportOpen(true)}>
            <Download className="size-4" />
            Export CSV
          </Button>
        </div>
        <FilterBar
          filters={filters}
          onChange={(next) => {
            setFilters(next);
            setPage(1);
          }}
          onClear={() => {
            setFilters(EMPTY);
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
      </section>

      <ExportModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        rowCount={list.data?.pagination.total ?? 0}
        filterCount={filterCount}
        onExport={onExport}
      />
    </div>
  );
}
