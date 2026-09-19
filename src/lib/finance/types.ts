export const CATEGORIES = ["Revenue", "Expense"] as const;
export const STATUSES = ["Paid", "Pending", "Failed"] as const;
export const CURRENCIES = ["USD", "EUR", "GBP", "INR"] as const;

export type Category = (typeof CATEGORIES)[number];
export type Status = (typeof STATUSES)[number];
export type Currency = (typeof CURRENCIES)[number];
export type SortField =
  | "occurred_at"
  | "amount"
  | "category"
  | "status"
  | "party_name"
  | "id";
export type SortOrder = "asc" | "desc";

export type Transaction = {
  id: number;
  occurredAt: string;
  amount: number;
  category: Category;
  status: Status;
  partyId: string;
  partyName: string;
  note: string | null;
};

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

export type Filters = {
  search?: string;
  category?: Category | "";
  status?: Status | "";
  partyId?: string;
  minAmount?: number;
  maxAmount?: number;
  startDate?: string;
  endDate?: string;
};

export type DashboardSummary = {
  balance: number;
  totalRevenue: number;
  totalExpenses: number;
  savings: number;
  transactionCount: number;
  paidCount: number;
  pendingCount: number;
  failedCount: number;
  averageAmount: number;
  paidRevenue: number;
  paidExpenses: number;
};

export type TrendPoint = {
  period: string;
  revenue: number;
  expenses: number;
  net: number;
};

export type Breakdown = {
  key: string;
  total: number;
  count: number;
};

export type PartyStat = {
  partyId: string;
  partyName: string;
  total: number;
  count: number;
  revenue: number;
  expenses: number;
};

export type DashboardOverview = {
  summary: DashboardSummary;
  trends: TrendPoint[];
  categoryBreakdown: Breakdown[];
  statusBreakdown: Breakdown[];
  recent: Transaction[];
  topParties: PartyStat[];
};

export type AlertItem = {
  id: number;
  kind: "failed" | "pending" | "upload" | "system" | "anomaly" | "budget";
  title: string;
  body: string;
  transactionId: number | null;
  read: boolean;
  createdAt: string;
};

export type UserSettings = {
  currency: Currency;
  notifyFailed: boolean;
  notifyPending: boolean;
  seeded: boolean;
};

export type ExportColumnKey =
  | "id"
  | "date"
  | "amount"
  | "category"
  | "status"
  | "party_id"
  | "party_name"
  | "note";

export const EXPORT_COLUMNS: { key: ExportColumnKey; label: string }[] = [
  { key: "id", label: "Transaction ID" },
  { key: "date", label: "Date" },
  { key: "amount", label: "Amount" },
  { key: "category", label: "Category" },
  { key: "status", label: "Status" },
  { key: "party_id", label: "Party ID" },
  { key: "party_name", label: "Name" },
  { key: "note", label: "Note" },
];

export type UploadRow = {
  date: string;
  amount: number;
  category: Category;
  status: Status;
  partyId?: string;
  partyName: string;
  note?: string;
};


export type BudgetEnvelope = {
  id: string;
  name: string;
  monthlyLimit: number;
  keywords: string[];
};

export type BudgetStatus = {
  id: string;
  name: string;
  monthlyLimit: number;
  spent: number;
  remaining: number;
  pct: number;
  over: boolean;
  txCount: number;
};

export type BudgetOverview = {
  month: string;
  envelopes: BudgetStatus[];
  totalLimit: number;
  totalSpent: number;
};

export type AnomalyFlag = {
  transactionId: number;
  partyName: string;
  amount: number;
  baseline: number;
  ratio: number;
  reason: string;
};
