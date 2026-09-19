import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { getSettings, resetDemoData, updateSettings, wipeUserData } from "@/lib/finance/queries";
import type { Currency } from "@/lib/finance/types";

export function SettingsPage() {
  const qc = useQueryClient();
  const settings = useQuery({ queryKey: ["settings"], queryFn: () => getSettings() });

  const save = useMutation({
    mutationFn: (patch: { currency?: Currency; notifyFailed?: boolean; notifyPending?: boolean }) =>
      updateSettings({ data: patch }),
    onSuccess: (next) => {
      qc.setQueryData(["settings"], next);
      toast.success("Settings saved");
    },
    onError: (err) => toast.error(err.message || "Could not save"),
  });

  const reseed = useMutation({
    mutationFn: () => resetDemoData(),
    onSuccess: () => {
      toast.success("Sample ledger restored");
      void qc.invalidateQueries();
    },
  });
  const wipe = useMutation({
    mutationFn: () => wipeUserData(),
    onSuccess: () => {
      toast.success("Your data was deleted");
      void qc.invalidateQueries();
    },
  });

  const s = settings.data;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <section className="panel p-5">
        <h2 className="font-display text-lg font-semibold">Preferences</h2>
        <p className="mt-1 text-sm text-muted">These apply to this browser profile.</p>
        <div className="mt-5 grid gap-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Display currency</p>
              <p className="text-xs text-muted">Formatting only — amounts stay in the ledger as stored.</p>
            </div>
            <Select
              value={s?.currency ?? "USD"}
              onValueChange={(v) => save.mutate({ currency: v as Currency })}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="GBP">GBP</SelectItem>
                <SelectItem value="INR">INR</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Failed transaction alerts</p>
              <p className="text-xs text-muted">Raise a message when a payment is marked failed.</p>
            </div>
            <Switch
              checked={s?.notifyFailed ?? true}
              onCheckedChange={(v) => save.mutate({ notifyFailed: v })}
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Pending transaction alerts</p>
              <p className="text-xs text-muted">Notify when a movement still needs confirmation.</p>
            </div>
            <Switch
              checked={s?.notifyPending ?? true}
              onCheckedChange={(v) => save.mutate({ notifyPending: v })}
            />
          </div>
        </div>
      </section>

      <section className="panel p-5">
        <h2 className="font-display text-lg font-semibold">Privacy</h2>
        <ul className="mt-3 space-y-2 text-sm text-muted">
          <li>All ledger data stays in this browser (localStorage). Nothing is sent to a server.</li>
          <li>Exports download as a CSV on your machine; nothing is emailed or shared.</li>
          <li>Use “Delete my data” below to wipe the local ledger.</li>
        </ul>
      </section>

      <section className="panel p-5">
        <h2 className="font-display text-lg font-semibold">Data</h2>
        <p className="mt-1 text-sm text-muted">
          Restore the 2024 sample ledger, or wipe everything you have imported.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" disabled={reseed.isPending} onClick={() => reseed.mutate()}>
            {reseed.isPending ? "Restoring…" : "Restore sample data"}
          </Button>
          <Button
            variant="danger"
            disabled={wipe.isPending}
            onClick={() => {
              if (window.confirm("Delete all of your transactions, alerts, and uploads?")) {
                wipe.mutate();
              }
            }}
          >
            {wipe.isPending ? "Deleting…" : "Delete my data"}
          </Button>
        </div>
      </section>
    </div>
  );
}
