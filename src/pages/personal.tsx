import { useQuery } from "@tanstack/react-query";
import { getSession } from "@/lib/auth";
import { getDashboard, getSettings } from "@/lib/finance/queries";
import { formatMoney } from "@/lib/finance/format";
import { initials } from "@/lib/finance/parties";

export function PersonalPage() {
  const user = getSession();
  const settings = useQuery({ queryKey: ["settings"], queryFn: () => getSettings() });
  const dashboard = useQuery({
    queryKey: ["dashboard", {}],
    queryFn: () => getDashboard({ data: {} }),
  });
  const currency = settings.data?.currency ?? "USD";
  const s = dashboard.data?.summary;

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4">
      <section className="panel p-6">
        <h2 className="font-display text-lg font-semibold">Profile</h2>
        <div className="mt-4 flex items-center gap-4">
          <span className="grid size-12 place-items-center rounded-full bg-accent text-sm font-semibold text-accent-fg">
            {initials(user?.displayName ?? "U")}
          </span>
          <div>
            <p className="font-medium">{user?.displayName}</p>
            <p className="text-sm text-muted">{user?.primaryEmail}</p>
          </div>
        </div>
        <dl className="mt-6 grid gap-3 text-sm">
          <div className="flex justify-between gap-4 border-b border-border pb-3">
            <dt className="text-muted">Name</dt>
            <dd className="font-medium">{user?.displayName ?? "—"}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-border pb-3">
            <dt className="text-muted">Email</dt>
            <dd className="font-medium">{user?.primaryEmail ?? "—"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Currency</dt>
            <dd className="font-medium">{currency}</dd>
          </div>
        </dl>
      </section>
      <section className="panel p-6">
        <h2 className="font-display text-lg font-semibold">Your year at a glance</h2>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg bg-bg p-3">
            <dt className="text-muted">Income</dt>
            <dd className="tnum mt-1 font-display text-lg font-semibold text-income">
              {formatMoney(s?.totalRevenue ?? 0, currency)}
            </dd>
          </div>
          <div className="rounded-lg bg-bg p-3">
            <dt className="text-muted">Expenses</dt>
            <dd className="tnum mt-1 font-display text-lg font-semibold text-expense">
              {formatMoney(s?.totalExpenses ?? 0, currency)}
            </dd>
          </div>
          <div className="rounded-lg bg-bg p-3">
            <dt className="text-muted">Movements</dt>
            <dd className="tnum mt-1 font-display text-lg font-semibold">{s?.transactionCount ?? 0}</dd>
          </div>
          <div className="rounded-lg bg-bg p-3">
            <dt className="text-muted">Failed</dt>
            <dd className="tnum mt-1 font-display text-lg font-semibold text-danger">
              {s?.failedCount ?? 0}
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
