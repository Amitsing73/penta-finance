import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BreakdownCard } from "@/components/dashboard/breakdown";
import { TrendChart } from "@/components/dashboard/trend-chart";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney, formatMonth } from "@/lib/finance/format";
import { getDashboard, getSettings } from "@/lib/finance/queries";
import { partyFromId } from "@/lib/finance/parties";
import { PartyAvatar } from "@/components/ui/avatar";

export function AnalyticsPage() {
  const settings = useQuery({ queryKey: ["settings"], queryFn: () => getSettings() });
  const currency = settings.data?.currency ?? "USD";
  const dashboard = useQuery({
    queryKey: ["dashboard", {}],
    queryFn: () => getDashboard({ data: {} }),
  });
  const s = dashboard.data?.summary;
  const trends = dashboard.data?.trends ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Net (paid)", value: s ? s.paidRevenue - s.paidExpenses : 0 },
          { label: "Avg ticket", value: s?.averageAmount ?? 0 },
          { label: "Completed", value: s?.paidCount ?? 0, plain: true },
          { label: "Failed", value: s?.failedCount ?? 0, plain: true },
        ].map((tile) => (
          <article key={tile.label} className="panel p-4">
            <p className="text-xs text-muted">{tile.label}</p>
            {dashboard.isLoading ? (
              <Skeleton className="mt-2 h-7 w-20" />
            ) : (
              <p className="tnum mt-1 font-display text-xl font-semibold">
                {tile.plain ? tile.value : formatMoney(tile.value, currency)}
              </p>
            )}
          </article>
        ))}
      </div>

      <TrendChart data={trends} currency={currency} loading={dashboard.isLoading} />

      <section className="panel p-5">
        <h2 className="font-display text-base font-semibold">Monthly bars</h2>
        <div className="mt-4 h-64">
          {dashboard.isLoading ? (
            <Skeleton className="h-full w-full" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trends} barGap={4}>
                <CartesianGrid stroke="var(--color-border)" vertical={false} />
                <XAxis
                  dataKey="period"
                  tickFormatter={(v) => formatMonth(String(v))}
                  tick={{ fill: "var(--color-muted)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`}
                  tick={{ fill: "var(--color-muted)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={36}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-surface-2)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 8,
                  }}
                  formatter={(value) => formatMoney(Number(value ?? 0), currency)}
                />
                <Bar dataKey="revenue" name="Income" fill="var(--color-income)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name="Expenses" fill="var(--color-expense)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <BreakdownCard
          title="Category mix"
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
        <h2 className="font-display text-base font-semibold">Top counterparties</h2>
        <ul className="mt-3 divide-y divide-border">
          {(dashboard.data?.topParties ?? []).map((p) => {
            const party = partyFromId(p.partyId, p.partyName);
            return (
              <li key={p.partyId} className="flex items-center gap-3 py-3">
                <PartyAvatar name={p.partyName} tone={party.tone} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{p.partyName}</p>
                  <p className="text-xs text-muted">{p.count} movements</p>
                </div>
                <div className="text-right text-xs">
                  <p className="tnum text-income">{formatMoney(p.revenue, currency)}</p>
                  <p className="tnum text-expense">{formatMoney(p.expenses, currency)}</p>
                </div>
              </li>
            );
          })}
          {!dashboard.isLoading && !dashboard.data?.topParties.length && (
            <li className="py-8 text-center text-sm text-muted">No counterparties yet.</li>
          )}
        </ul>
      </section>
    </div>
  );
}
