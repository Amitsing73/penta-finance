import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";
import { PartyAvatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatSignedMoney } from "@/lib/finance/format";
import { partyFromId } from "@/lib/finance/parties";
import type { AnomalyFlag, Currency, Pagination, SortField, SortOrder, Transaction } from "@/lib/finance/types";
import { cn } from "@/lib/cn";
import { StatusBadge } from "./status-badge";

const COLS: { key: SortField; label: string; hide?: string }[] = [
  { key: "party_name", label: "Name" },
  { key: "occurred_at", label: "Date", hide: "hidden sm:table-cell" },
  { key: "amount", label: "Amount" },
  { key: "status", label: "Status", hide: "hidden md:table-cell" },
];

export function TransactionTable({
  rows,
  pagination,
  loading,
  sortBy,
  sortOrder,
  currency,
  onSort,
  onPageChange,
  onLimitChange,
  anomalyMap,
}: {
  rows: Transaction[];
  pagination?: Pagination;
  loading?: boolean;
  sortBy: SortField;
  sortOrder: SortOrder;
  currency: Currency;
  onSort: (field: SortField) => void;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  anomalyMap?: Record<number, AnomalyFlag>;
}) {
  return (
    <div className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr className="text-xs text-muted">
              {COLS.map((col) => {
                const active = sortBy === col.key;
                return (
                  <th key={col.key} className={cn("px-3 py-3 font-medium", col.hide)}>
                    <button
                      type="button"
                      onClick={() => onSort(col.key)}
                      className="inline-flex items-center gap-1 hover:text-fg"
                    >
                      {col.label}
                      {active ? (
                        sortOrder === "asc" ? (
                          <ArrowUp className="size-3" />
                        ) : (
                          <ArrowDown className="size-3" />
                        )
                      ) : (
                        <ArrowUpDown className="size-3 opacity-40" />
                      )}
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={4} className="px-3 py-3">
                      <Skeleton className="h-10 w-full" />
                    </td>
                  </tr>
                ))
              : rows.map((tx) => {
                  const party = partyFromId(tx.partyId, tx.partyName);
                  return (
                    <tr key={tx.id} className="border-t border-border/70">
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-3">
                          <PartyAvatar name={tx.partyName} tone={party.tone} />
                          <div className="min-w-0">
                            <p className="flex items-center gap-1.5 truncate font-medium">
                              {tx.partyName}
                              {anomalyMap?.[tx.id] && (
                                <span
                                  title={anomalyMap[tx.id]!.reason}
                                  className="inline-flex items-center gap-0.5 rounded-full bg-danger/15 px-1.5 py-0.5 text-[10px] font-semibold text-danger"
                                >
                                  <AlertTriangle className="size-3" />
                                  Odd
                                </span>
                              )}
                            </p>
                            <p className="truncate text-xs text-muted sm:hidden">
                              {formatDate(tx.occurredAt)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="hidden px-3 py-3 text-muted sm:table-cell">
                        {formatDate(tx.occurredAt)}
                      </td>
                      <td
                        className={cn(
                          "tnum px-3 py-3 font-semibold",
                          tx.category === "Revenue" ? "text-income" : "text-expense",
                        )}
                      >
                        {formatSignedMoney(tx.amount, tx.category, currency)}
                      </td>
                      <td className="hidden px-3 py-3 md:table-cell">
                        <StatusBadge status={tx.status} />
                      </td>
                    </tr>
                  );
                })}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-12 text-center text-muted">
                  No transactions match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {pagination && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
          <p>
            {pagination.total === 0
              ? "0 results"
              : `${(pagination.page - 1) * pagination.limit + 1}–${Math.min(pagination.page * pagination.limit, pagination.total)} of ${pagination.total}`}
          </p>
          <div className="flex items-center gap-2">
            <select
              className="h-9 rounded-sm border border-border bg-bg px-2 text-fg"
              value={pagination.limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
            >
              {[10, 20, 50].map((n) => (
                <option key={n} value={n}>
                  {n} / page
                </option>
              ))}
            </select>
            <Button
              variant="outline"
              size="icon-sm"
              disabled={!pagination.hasPrevPage}
              onClick={() => onPageChange(pagination.page - 1)}
              aria-label="Previous page"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="tnum min-w-12 text-center text-fg">
              {pagination.page}/{pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="icon-sm"
              disabled={!pagination.hasNextPage}
              onClick={() => onPageChange(pagination.page + 1)}
              aria-label="Next page"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
