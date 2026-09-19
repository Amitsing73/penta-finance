import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { AlertTriangle, Bell, CheckCheck, Clock3, PiggyBank, Sparkles, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/finance/format";
import { listAlerts, markAlertRead, markAllAlertsRead } from "@/lib/finance/queries";
import type { AlertItem } from "@/lib/finance/types";
import { cn } from "@/lib/cn";

const ICONS: Record<AlertItem["kind"], typeof Bell> = {
  failed: AlertTriangle,
  pending: Clock3,
  upload: Upload,
  system: Bell,
  anomaly: Sparkles,
  budget: PiggyBank,
};

export function AlertsPage() {
  const qc = useQueryClient();
  const alerts = useQuery({ queryKey: ["alerts"], queryFn: () => listAlerts() });

  const mark = useMutation({
    mutationFn: (id: number) => markAlertRead({ data: { id, read: true } }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["alerts"] }),
  });
  const markAll = useMutation({
    mutationFn: () => markAllAlertsRead(),
    onSuccess: () => {
      toast.success("All alerts marked read");
      void qc.invalidateQueries({ queryKey: ["alerts"] });
    },
  });

  return (
    <section className="panel p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold">Messages</h2>
          <p className="text-sm text-muted">
            Failed payments, pending confirmations, and import notices.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={!alerts.data?.unread || markAll.isPending}
          onClick={() => markAll.mutate()}
        >
          <CheckCheck className="size-4" />
          Mark all read
        </Button>
      </div>
      <ul className="divide-y divide-border">
        {(alerts.data?.items ?? []).map((item) => {
          const Icon = ICONS[item.kind] ?? Bell;
          return (
            <li
              key={item.id}
              className={cn(
                "flex gap-3 py-3",
                item.read ? "opacity-70" : "",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 grid size-10 shrink-0 place-items-center rounded-lg",
                  item.kind === "failed"
                    ? "bg-danger/15 text-danger"
                    : item.kind === "pending"
                      ? "bg-pending/15 text-pending"
                      : "bg-accent/15 text-accent",
                )}
              >
                <Icon className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{item.title}</p>
                  {!item.read && <span className="size-1.5 rounded-full bg-accent" />}
                </div>
                <p className="mt-0.5 text-sm text-muted">{item.body}</p>
                <p className="mt-1 text-xs text-subtle">{formatDate(item.createdAt)}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                {!item.read && (
                  <Button variant="ghost" size="sm" onClick={() => mark.mutate(item.id)}>
                    Read
                  </Button>
                )}
                {item.transactionId && (
                  <Link to="/transactions" className="text-xs text-accent hover:underline">
                    View ledger
                  </Link>
                )}
              </div>
            </li>
          );
        })}
        {!alerts.isLoading && !alerts.data?.items.length && (
          <li className="py-12 text-center text-sm text-muted">You are all caught up.</li>
        )}
      </ul>
    </section>
  );
}
