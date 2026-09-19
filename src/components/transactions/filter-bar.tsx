import { Search } from "lucide-react";
import type { ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { Category, Filters, Status } from "@/lib/finance/types";

export function FilterBar({
  filters,
  onChange,
  onClear,
  extra,
}: {
  filters: Filters;
  onChange: (next: Filters) => void;
  onClear: () => void;
  extra?: ReactNode;
}) {
  const set = (patch: Partial<Filters>) => onChange({ ...filters, ...patch });
  const active = Object.values(filters).filter((v) => v !== undefined && v !== "" && v !== null).length;

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
      <div className="relative min-w-0 flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle" />
        <Input
          value={filters.search ?? ""}
          onChange={(e) => set({ search: e.target.value })}
          placeholder="Search for anything…"
          className="h-11 rounded-full bg-bg pl-9"
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={filters.category || "all"}
          onValueChange={(v) => set({ category: v === "all" ? "" : (v as Category) })}
        >
          <SelectTrigger className="h-11 w-[140px] rounded-full bg-bg">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="Revenue">Income</SelectItem>
            <SelectItem value="Expense">Expense</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filters.status || "all"}
          onValueChange={(v) => set({ status: v === "all" ? "" : (v as Status) })}
        >
          <SelectTrigger className="h-11 w-[140px] rounded-full bg-bg">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="Paid">Completed</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Failed">Failed</SelectItem>
          </SelectContent>
        </Select>
        <Input
          type="date"
          value={filters.startDate ?? ""}
          onChange={(e) => set({ startDate: e.target.value || undefined })}
          className="h-11 w-[150px] rounded-full bg-bg text-xs"
          aria-label="Start date"
        />
        <Input
          type="date"
          value={filters.endDate ?? ""}
          onChange={(e) => set({ endDate: e.target.value || undefined })}
          className="h-11 w-[150px] rounded-full bg-bg text-xs"
          aria-label="End date"
        />
        {active > 0 && (
          <Button variant="ghost" size="sm" onClick={onClear}>
            Clear
          </Button>
        )}
        {extra}
      </div>
    </div>
  );
}
