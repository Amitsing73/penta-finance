import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, PiggyBank, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatMoney } from "@/lib/finance/format";
import {
  getAnomalies,
  getBudgetOverview,
  getSettings,
  updateBudgetLimit,
} from "@/lib/finance/queries";
import { cn } from "@/lib/cn";
import { useState } from "react";

export function BudgetsPage() {
  const qc = useQueryClient();
  const settings = useQuery({ queryKey: ["settings"], queryFn: () => getSettings() });
  const currency = settings.data?.currency ?? "USD";
  const budgets = useQuery({ queryKey: ["budgets"], queryFn: () => getBudgetOverview() });
  const anomalies = useQuery({ queryKey: ["anomalies"], queryFn: () => getAnomalies() });
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const save = useMutation({
    mutationFn: (input: { id: string; monthlyLimit: number }) =>
      updateBudgetLimit({ data: input }),
    onSuccess: () => {
      toast.success("Budget updated");
      void qc.invalidateQueries({ queryKey: ["budgets"] });
    },
  });

  const overview = budgets.data;

  return (
    <div className="flex flex-col gap-4">
      <section className="panel p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold">Envelope budgets</h2>
            <p className="mt-1 text-sm text-muted">
              Monthly spend caps. Expenses auto-route into envelopes by counterparty keywords.
              {overview ? ` Showing ${overview.month}.` : ""}
            </p>
          </div>
          <div className="rounded-lg bg-bg px-4 py-2 text-right">
            <p className="text-xs text-muted">Spent this month</p>
            <p className="tnum font-display text-xl font-semibold">
              {formatMoney(overview?.totalSpent ?? 0, currency)}
              <span className="text-sm font-normal text-muted">
                {" "}
                / {formatMoney(overview?.totalLimit ?? 0, currency)}
              </span>
            </p>
          </div>
        </div>

        <ul className="mt-5 grid gap-3">
          {(overview?.envelopes ?? []).map((env) => {
            const bar = Math.min(100, env.pct);
            return (
              <li key={env.id} className="rounded-xl bg-bg p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="grid size-9 place-items-center rounded-lg bg-accent/15 text-accent">
                      <PiggyBank className="size-4" />
                    </span>
                    <div>
                      <p className="font-medium">{env.name}</p>
                      <p className="text-xs text-muted">
                        {env.txCount} expense{env.txCount === 1 ? "" : "s"} ·{" "}
                        {env.over ? (
                          <span className="text-danger">Over by {formatMoney(env.spent - env.monthlyLimit, currency)}</span>
                        ) : (
                          <>{formatMoney(env.remaining, currency)} left</>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      className="h-9 w-28"
                      inputMode="decimal"
                      value={drafts[env.id] ?? String(env.monthlyLimit)}
                      onChange={(e) => setDrafts((d) => ({ ...d, [env.id]: e.target.value }))}
                      aria-label={`${env.name} monthly limit`}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={save.isPending}
                      onClick={() => {
                        const n = Number(drafts[env.id] ?? env.monthlyLimit);
                        if (!Number.isFinite(n) || n < 0) {
                          toast.error("Enter a valid limit");
                          return;
                        }
                        save.mutate({ id: env.id, monthlyLimit: n });
                      }}
                    >
                      Save
                    </Button>
                  </div>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      env.over ? "bg-danger" : env.pct > 80 ? "bg-pending" : "bg-accent",
                    )}
                    style={{ width: `${bar}%` }}
                  />
                </div>
                <p className="tnum mt-1.5 text-xs text-muted">
                  {formatMoney(env.spent, currency)} · {env.pct}% of limit
                </p>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="panel p-5">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="size-4 text-accent" />
          <h2 className="font-display text-base font-semibold">Anomaly radar</h2>
        </div>
        <p className="text-sm text-muted">
          Amounts at least 2× a counterparty’s historical average (same type, ≥2 prior payments).
        </p>
        <ul className="mt-4 divide-y divide-border">
          {(anomalies.data ?? []).slice(0, 12).map((a) => (
            <li key={a.transactionId} className="flex gap-3 py-3">
              <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg bg-danger/15 text-danger">
                <AlertTriangle className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{a.partyName}</p>
                <p className="text-sm text-muted">{a.reason}</p>
              </div>
              <p className="tnum text-sm font-semibold text-danger">
                {formatMoney(a.amount, currency)}
              </p>
            </li>
          ))}
          {!anomalies.isLoading && !(anomalies.data?.length) && (
            <li className="py-10 text-center text-sm text-muted">
              No unusual amounts right now — your patterns look steady.
            </li>
          )}
        </ul>
      </section>
    </div>
  );
}
