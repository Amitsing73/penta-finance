import { Badge } from "@/components/ui/badge";
import { statusLabel } from "@/lib/finance/format";
import type { Status } from "@/lib/finance/types";

const TONE: Record<Status, "paid" | "pending" | "failed"> = {
  Paid: "paid",
  Pending: "pending",
  Failed: "failed",
};

export function StatusBadge({ status }: { status: Status }) {
  return <Badge tone={TONE[status]}>{statusLabel(status)}</Badge>;
}
