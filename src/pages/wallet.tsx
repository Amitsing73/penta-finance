import { useQuery } from "@tanstack/react-query";
import { Landmark, PiggyBank, Wallet } from "lucide-react";
import { PartyAvatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney, formatSignedMoney } from "@/lib/finance/format";
import { getDashboard, getSettings } from "@/lib/finance/queries";
import { partyFromId } from "@/lib/finance/parties";

export function WalletPage() {
  const settings = useQuery({ queryKey: ["settings"], queryFn: () => getSettings() });
  const currency = settings.data?.currency ?? "USD";
  const dashboard = useQuery({
    queryKey: ["dashboard", {}],
    queryFn: () => getDashboard({ data: {} }),
  });
  const s = dashboard.data?.summary;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 md:grid-cols-3">
        {[
          {
            label: "Available balance",
            value: s?.balance ?? 0,
            icon: Wallet,
            hint: "Paid income minus paid expenses",
          },
          {
            label: "Reserved savings",
            value: s?.savings ?? 0,
            icon: PiggyBank,
            hint: "18% of available balance, held aside",
          },
          {
            label: "In flight",
            value: (s?.totalRevenue ?? 0) - (s?.paidRevenue ?? 0),
            icon: Landmark,
            hint: "Income not yet marked completed",
          },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <article key={card.label} className="panel p-5">
              <span className="grid size-11 place-items-center rounded-lg bg-accent/15 text-accent">
                <Icon className="size-5" />
              </span>
              <p className="mt-4 text-xs text-muted">{card.label}</p>
              {dashboard.isLoading ? (
                <Skeleton className="mt-2 h-8 w-28" />
              ) : (
                <p className="tnum font-display text-2xl font-semibold">
                  {formatMoney(card.value, currency)}
                </p>
              )}
              <p className="mt-1 text-xs text-subtle">{card.hint}</p>
            </article>
          );
        })}
      </div>

      <section className="panel p-5">
        <h2 className="font-display text-base font-semibold">Accounts by counterparty</h2>
        <p className="mt-1 text-sm text-muted">
          Running totals for each person in your ledger.
        </p>
        <ul className="mt-4 divide-y divide-border">
          {dashboard.isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <li key={i} className="py-3">
                  <Skeleton className="h-10 w-full" />
                </li>
              ))
            : (dashboard.data?.topParties ?? []).map((p) => {
                const party = partyFromId(p.partyId, p.partyName);
                const net = p.revenue - p.expenses;
                return (
                  <li key={p.partyId} className="flex items-center gap-3 py-3">
                    <PartyAvatar name={p.partyName} tone={party.tone} size="lg" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{p.partyName}</p>
                      <p className="text-xs text-muted">{p.count} transactions</p>
                    </div>
                    <p className={`tnum font-semibold ${net >= 0 ? "text-income" : "text-expense"}`}>
                      {formatSignedMoney(Math.abs(net), net >= 0 ? "Revenue" : "Expense", currency)}
                    </p>
                  </li>
                );
              })}
        </ul>
      </section>
    </div>
  );
}
