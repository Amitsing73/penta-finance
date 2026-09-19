import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Category, Status } from "@/lib/finance/types";

export function AddTransactionDialog({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (input: {
    date: string;
    amount: number;
    category: Category;
    status: Status;
    partyName: string;
    note?: string;
  }) => Promise<void>;
}) {
  const [partyName, setPartyName] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState<Category>("Expense");
  const [status, setStatus] = useState<Status>("Paid");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setPartyName("");
    setAmount("");
    setNote("");
    setError(null);
    setCategory("Expense");
    setStatus("Paid");
  };

  const handle = async () => {
    const n = Number(amount);
    if (!partyName.trim()) return setError("Add a name.");
    if (!Number.isFinite(n) || n <= 0) return setError("Enter a valid amount.");
    setBusy(true);
    setError(null);
    try {
      await onSave({
        date: new Date(`${date}T12:00:00Z`).toISOString(),
        amount: n,
        category,
        status,
        partyName: partyName.trim(),
        note: note.trim() || undefined,
      });
      reset();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v && !busy) {
          reset();
          onClose();
        }
      }}
    >
      <DialogContent>
        <DialogTitle>New transaction</DialogTitle>
        <DialogDescription>Logged privately to your account. Failed and pending rows raise an alert.</DialogDescription>
        <div className="mt-4 grid gap-3">
          <div>
            <Label htmlFor="tx-name">Counterparty</Label>
            <Input id="tx-name" value={partyName} onChange={(e) => setPartyName(e.target.value)} placeholder="Matheus Ferrero" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="tx-amount">Amount</Label>
              <Input id="tx-amount" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="224.00" />
            </div>
            <div>
              <Label htmlFor="tx-date">Date</Label>
              <Input id="tx-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Type</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Revenue">Income</SelectItem>
                  <SelectItem value="Expense">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as Status)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Paid">Completed</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="tx-note">Note</Label>
            <Input id="tx-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional memo" />
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={() => void handle()} disabled={busy}>
            {busy ? "Saving…" : "Add transaction"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
