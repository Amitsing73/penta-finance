import { Lock, PiggyBank, Wallet, WalletCards } from "lucide-react";
import { formatMoney } from "@/lib/finance/format";
import type { Currency, DashboardSummary } from "@/lib/finance/types";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/cn";

const TILES = [
  { key: "balance", label: "Balance", icon: Wallet },
  { key: "revenue", label: "Revenue", icon: Lock },
  { key: "expenses", label: "Expenses", icon: WalletCards },
  { key: "savings", label: "Savings", icon: PiggyBank },
] as const;

export function KpiCards({
  summary,
  currency,
  loading,
}: {
  summary?: DashboardSummary;
  currency: Currency;
  loading?: boolean;
}) {
  const values = {
    balance: summary?.balance ?? 0,
    revenue: summary?.totalRevenue ?? 0,
    expenses: summary?.totalExpenses ?? 0,
    savings: summary?.savings ?? 0,
  };

  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {TILES.map((tile) => {
        const Icon = tile.icon;
        return (
          <article key={tile.key} className="panel flex items-center gap-3 p-4">
            <span
              className={cn(
                "grid size-11 shrink-0 place-items-center rounded-lg",
                tile.key === "expenses" ? "bg-expense/15 text-expense" : "bg-accent/15 text-accent",
              )}
            >
              <Icon className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="text-xs text-muted">{tile.label}</p>
              {loading ? (
                <Skeleton className="mt-1 h-7 w-24" />
              ) : (
                <p className="tnum font-display text-xl font-semibold tracking-tight">
                  {formatMoney(values[tile.key], currency)}
                </p>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
