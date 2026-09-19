import { useMemo, useState } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatMoney, formatMonth } from "@/lib/finance/format";
import type { Currency, TrendPoint } from "@/lib/finance/types";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/cn";

type Grain = "monthly" | "quarterly";

function toQuarter(period: string): string {
  const [y, m] = period.split("-").map(Number);
  if (!y || !m) return period;
  const q = Math.ceil(m / 3);
  return `${y}-Q${q}`;
}

export function TrendChart({
  data,
  currency,
  loading,
}: {
  data?: TrendPoint[];
  currency: Currency;
  loading?: boolean;
}) {
  const [grain, setGrain] = useState<Grain>("monthly");
  const [hover, setHover] = useState<TrendPoint | null>(null);

  const series = useMemo(() => {
    if (!data?.length) return [];
    if (grain === "monthly") return data;
    const map = new Map<string, TrendPoint>();
    for (const p of data) {
      const key = toQuarter(p.period);
      const cur = map.get(key) ?? { period: key, revenue: 0, expenses: 0, net: 0 };
      cur.revenue += p.revenue;
      cur.expenses += p.expenses;
      cur.net += p.net;
      map.set(key, cur);
    }
    return [...map.values()];
  }, [data, grain]);

  const active = hover ?? series[Math.floor(series.length / 2)] ?? null;

  return (
    <section className="panel flex min-h-80 flex-col p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-base font-semibold">Overview</h2>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5 text-muted">
            <i className="size-2 rounded-full bg-income" /> Income
          </span>
          <span className="flex items-center gap-1.5 text-muted">
            <i className="size-2 rounded-full bg-expense" /> Expenses
          </span>
          <div className="flex rounded-full bg-bg p-0.5">
            {(["monthly", "quarterly"] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGrain(g)}
                className={cn(
                  "rounded-full px-3 py-1 capitalize",
                  grain === g ? "bg-surface-2 text-fg" : "text-muted",
                )}
              >
                {g === "monthly" ? "Monthly" : "Quarterly"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <Skeleton className="h-56 w-full rounded-lg" />
      ) : series.length === 0 ? (
        <p className="grid flex-1 place-items-center text-sm text-muted">No activity in this range.</p>
      ) : (
        <div className="relative h-56">
          {active && (
            <div className="pointer-events-none absolute top-2 left-1/2 z-10 -translate-x-1/2 rounded-md bg-accent px-3 py-1.5 text-center text-accent-fg shadow-sm">
              <p className="text-[10px] font-medium uppercase tracking-wide opacity-80">Income</p>
              <p className="tnum text-sm font-semibold">{formatMoney(active.revenue, currency)}</p>
            </div>
          )}
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={series}
              margin={{ top: 28, right: 8, left: 0, bottom: 0 }}
              onMouseMove={(state) => {
                const payload = state?.activePayload?.[0]?.payload as TrendPoint | undefined;
                if (payload) setHover(payload);
              }}
              onMouseLeave={() => setHover(null)}
            >
              <defs>
                <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-income)" stopOpacity={0.18} />
                  <stop offset="100%" stopColor="var(--color-income)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--color-border)" vertical={false} />
              <XAxis
                dataKey="period"
                tickFormatter={(v) => (String(v).includes("Q") ? String(v).slice(5) : formatMonth(String(v)))}
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
              <Tooltip content={() => null} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="none"
                fill="url(#incomeFill)"
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="var(--color-income)"
                strokeWidth={2.4}
                dot={false}
                activeDot={{ r: 5, fill: "var(--color-income)", stroke: "var(--color-bg)", strokeWidth: 2 }}
              />
              <Line
                type="monotone"
                dataKey="expenses"
                stroke="var(--color-expense)"
                strokeWidth={2.4}
                dot={false}
                activeDot={{ r: 5, fill: "var(--color-expense)", stroke: "var(--color-bg)", strokeWidth: 2 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
