import { Link } from "react-router-dom";
import { PartyAvatar } from "@/components/ui/avatar";
import { formatSignedMoney } from "@/lib/finance/format";
import { partyFromId } from "@/lib/finance/parties";
import type { Currency, Transaction } from "@/lib/finance/types";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/cn";

export function RecentList({
  items,
  currency,
  loading,
}: {
  items?: Transaction[];
  currency: Currency;
  loading?: boolean;
}) {
  return (
    <section className="panel flex min-h-80 flex-col p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-base font-semibold">Recent Transaction</h2>
        <Link to="/transactions" className="text-xs font-medium text-accent hover:underline">
          See all
        </Link>
      </div>
      <ul className="flex flex-1 flex-col gap-1">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <li key={i} className="flex items-center gap-3 py-2">
                <Skeleton className="size-9 rounded-full" />
                <Skeleton className="h-8 flex-1" />
              </li>
            ))
          : (items ?? []).slice(0, 5).map((tx) => {
              const party = partyFromId(tx.partyId, tx.partyName);
              const positive = tx.category === "Revenue";
              return (
                <li key={tx.id} className="flex items-center gap-3 rounded-md px-1 py-2">
                  <PartyAvatar name={tx.partyName} tone={party.tone} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{tx.partyName}</p>
                    <p className="truncate text-xs text-muted">{tx.note}</p>
                  </div>
                  <p
                    className={cn(
                      "tnum text-sm font-semibold",
                      positive ? "text-income" : "text-expense",
                    )}
                  >
                    {formatSignedMoney(tx.amount, tx.category, currency)}
                  </p>
                </li>
              );
            })}
        {!loading && !items?.length && (
          <li className="grid flex-1 place-items-center text-sm text-muted">No recent activity.</li>
        )}
      </ul>
    </section>
  );
}
