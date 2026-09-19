import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatMoney } from "@/lib/finance/format";
import type { Breakdown, Currency } from "@/lib/finance/types";
import { Skeleton } from "@/components/ui/skeleton";

const COLORS: Record<string, string> = {
  Revenue: "var(--color-income)",
  Expense: "var(--color-expense)",
  Paid: "var(--color-income)",
  Pending: "var(--color-pending)",
  Failed: "var(--color-danger)",
};

export function BreakdownCard({
  title,
  data,
  currency,
  loading,
}: {
  title: string;
  data?: Breakdown[];
  currency: Currency;
  loading?: boolean;
}) {
  const total = (data ?? []).reduce((s, d) => s + d.total, 0);
  return (
    <section className="panel p-5">
      <h2 className="font-display text-base font-semibold">{title}</h2>
      {loading ? (
        <Skeleton className="mt-6 h-40 w-full" />
      ) : !data?.length ? (
        <p className="mt-10 text-center text-sm text-muted">Nothing to chart yet.</p>
      ) : (
        <div className="mt-2 flex items-center gap-4">
          <div className="h-40 w-40 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="total"
                  nameKey="key"
                  innerRadius={42}
                  outerRadius={68}
                  paddingAngle={3}
                  stroke="none"
                >
                  {data.map((d) => (
                    <Cell key={d.key} fill={COLORS[d.key] ?? "var(--color-mist)"} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "var(--color-surface-2)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 8,
                    color: "var(--color-fg)",
                  }}
                  formatter={(value) => formatMoney(Number(value ?? 0), currency)}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="min-w-0 flex-1 space-y-2 text-sm">
            {data.map((d) => (
              <li key={d.key} className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-muted">
                  <i
                    className="size-2 rounded-full"
                    style={{ background: COLORS[d.key] ?? "var(--color-mist)" }}
                  />
                  {d.key === "Paid" ? "Completed" : d.key === "Revenue" ? "Income" : d.key}
                </span>
                <span className="tnum font-medium">
                  {total ? Math.round((d.total / total) * 100) : 0}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
