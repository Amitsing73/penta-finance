import sample from "@/data/sample-transactions.json";
import { transactionsToCsv } from "./csv";
import { noteFor, partyFromId } from "./parties";
import { round2 } from "./format";
import type {
  AlertItem,
  Breakdown,
  Category,
  Currency,
  DashboardOverview,
  DashboardSummary,
  ExportColumnKey,
  Filters,
  Pagination,
  PartyStat,
  SortField,
  SortOrder,
  Status,
  Transaction,
  TrendPoint,
  UploadRow,
  UserSettings,
  BudgetEnvelope,
  BudgetOverview,
  AnomalyFlag,
} from "./types";
import { DEFAULT_ENVELOPES, buildBudgetOverview, detectAnomalies } from "./intelligence";

type SampleRow = {
  id: number;
  date: string;
  amount: number;
  category: "Revenue" | "Expense";
  status: "Paid" | "Pending";
  user_id: string;
};

type UploadRecord = {
  id: number;
  filename: string;
  rowCount: number;
  errorCount: number;
  createdAt: string;
};

type Ledger = {
  nextTxId: number;
  nextAlertId: number;
  nextUploadId: number;
  settings: UserSettings;
  transactions: Transaction[];
  alerts: AlertItem[];
  uploads: UploadRecord[];
  budgets: BudgetEnvelope[];
};

const STORAGE_KEY = "penta.ledger.v2";

function emptySummary(): DashboardSummary {
  return {
    balance: 0,
    totalRevenue: 0,
    totalExpenses: 0,
    savings: 0,
    transactionCount: 0,
    paidCount: 0,
    pendingCount: 0,
    failedCount: 0,
    averageAmount: 0,
    paidRevenue: 0,
    paidExpenses: 0,
  };
}

function seedTransactions(): Transaction[] {
  const pendingSeen = { n: 0 };
  return (sample as SampleRow[]).map((row) => {
    const party = partyFromId(row.user_id);
    let status: Status = "Paid";
    if (row.status === "Pending") {
      pendingSeen.n += 1;
      status = pendingSeen.n % 5 === 0 ? "Failed" : "Pending";
    }
    const category = row.category as Category;
    return {
      id: row.id,
      occurredAt: row.date.includes("T") ? row.date : `${row.date}T12:00:00.000Z`,
      amount: Number(row.amount),
      category,
      status,
      partyId: party.id,
      partyName: party.name,
      note: noteFor(category, party.name),
    };
  });
}

function seedAlerts(txs: Transaction[]): AlertItem[] {
  const alerts: AlertItem[] = [];
  let id = 1;
  for (const tx of txs) {
    if (tx.status === "Failed") {
      alerts.push({
        id: id++,
        kind: "failed",
        title: "Transaction failed",
        body: `Payment of ${tx.amount.toFixed(2)} with ${tx.partyName} could not be completed.`,
        transactionId: tx.id,
        read: false,
        createdAt: tx.occurredAt,
      });
    } else if (tx.status === "Pending") {
      alerts.push({
        id: id++,
        kind: "pending",
        title: "Awaiting confirmation",
        body: `A ${tx.category.toLowerCase()} of ${tx.amount.toFixed(2)} with ${tx.partyName} is still pending.`,
        transactionId: tx.id,
        read: false,
        createdAt: tx.occurredAt,
      });
    }
  }
  alerts.push({
    id: id++,
    kind: "system",
    title: "Welcome to Penta",
    body: "Sample 2024 ledger loaded. Filter, export, and import CSV to explore the dashboard.",
    transactionId: null,
    read: false,
    createdAt: new Date().toISOString(),
  });
  return alerts.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function createSeededLedger(): Ledger {
  const transactions = seedTransactions();
  const alerts = seedAlerts(transactions);
  const maxTx = transactions.reduce((m, t) => Math.max(m, t.id), 0);
  const maxAlert = alerts.reduce((m, t) => Math.max(m, t.id), 0);
  return {
    nextTxId: maxTx + 1,
    nextAlertId: maxAlert + 1,
    nextUploadId: 1,
    settings: { currency: "USD", notifyFailed: true, notifyPending: true, seeded: true },
    transactions,
    alerts,
    uploads: [],
    budgets: DEFAULT_ENVELOPES.map((e) => ({ ...e, keywords: [...e.keywords] })),
  };
}

function load(): Ledger {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem("penta.ledger.v1");
    if (!raw) return createSeededLedger();
    const parsed = JSON.parse(raw) as Ledger;
    if (!parsed.transactions) return createSeededLedger();
    if (!parsed.budgets?.length) {
      parsed.budgets = DEFAULT_ENVELOPES.map((e) => ({ ...e, keywords: [...e.keywords] }));
    }
    return parsed;
  } catch {
    return createSeededLedger();
  }
}

function save(ledger: Ledger) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ledger));
}

let ledger: Ledger | null = null;
const listeners = new Set<() => void>();

function getLedger(): Ledger {
  if (!ledger) {
    ledger = load();
    save(ledger);
  }
  return ledger;
}

function commit() {
  if (!ledger) return;
  save(ledger);
  listeners.forEach((fn) => fn());
}

export function subscribeLedger(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function matches(tx: Transaction, filters: Filters): boolean {
  if (filters.category && tx.category !== filters.category) return false;
  if (filters.status && tx.status !== filters.status) return false;
  if (filters.partyId && tx.partyId !== filters.partyId) return false;
  if (filters.minAmount !== undefined && tx.amount < filters.minAmount) return false;
  if (filters.maxAmount !== undefined && tx.amount > filters.maxAmount) return false;
  if (filters.startDate && tx.occurredAt < `${filters.startDate}T00:00:00.000Z`) return false;
  if (filters.endDate && tx.occurredAt > `${filters.endDate}T23:59:59.999Z`) return false;
  if (filters.search?.trim()) {
    const term = filters.search.trim().toLowerCase();
    const hay = [
      tx.partyName,
      tx.partyId,
      tx.category,
      tx.status,
      tx.note ?? "",
      String(tx.id),
      String(tx.amount),
    ]
      .join(" ")
      .toLowerCase();
    if (!hay.includes(term)) return false;
  }
  return true;
}

function sortTx(a: Transaction, b: Transaction, sortBy: SortField, sortOrder: SortOrder) {
  const dir = sortOrder === "asc" ? 1 : -1;
  let cmp = 0;
  switch (sortBy) {
    case "amount":
      cmp = a.amount - b.amount;
      break;
    case "category":
      cmp = a.category.localeCompare(b.category);
      break;
    case "status":
      cmp = a.status.localeCompare(b.status);
      break;
    case "party_name":
      cmp = a.partyName.localeCompare(b.partyName);
      break;
    case "id":
      cmp = a.id - b.id;
      break;
    default:
      cmp = a.occurredAt.localeCompare(b.occurredAt);
  }
  if (cmp === 0) cmp = a.id - b.id;
  return cmp * dir;
}

function computeSummary(rows: Transaction[]): DashboardSummary {
  if (!rows.length) return emptySummary();
  let totalRevenue = 0;
  let totalExpenses = 0;
  let paidRevenue = 0;
  let paidExpenses = 0;
  let paidCount = 0;
  let pendingCount = 0;
  let failedCount = 0;
  let totalAmount = 0;
  for (const tx of rows) {
    totalAmount += tx.amount;
    if (tx.category === "Revenue") totalRevenue += tx.amount;
    else totalExpenses += tx.amount;
    if (tx.status === "Paid") {
      paidCount += 1;
      if (tx.category === "Revenue") paidRevenue += tx.amount;
      else paidExpenses += tx.amount;
    } else if (tx.status === "Pending") pendingCount += 1;
    else failedCount += 1;
  }
  const balance = round2(paidRevenue - paidExpenses);
  return {
    balance,
    totalRevenue: round2(totalRevenue),
    totalExpenses: round2(totalExpenses),
    savings: round2(Math.max(0, balance * 0.18)),
    transactionCount: rows.length,
    paidCount,
    pendingCount,
    failedCount,
    averageAmount: round2(totalAmount / rows.length),
    paidRevenue: round2(paidRevenue),
    paidExpenses: round2(paidExpenses),
  };
}

export function getSettings(): UserSettings {
  return { ...getLedger().settings };
}

export function updateSettings(patch: Partial<Pick<UserSettings, "currency" | "notifyFailed" | "notifyPending">>): UserSettings {
  const L = getLedger();
  L.settings = { ...L.settings, ...patch };
  commit();
  return { ...L.settings };
}

export function getDashboard(filters: Filters = {}): DashboardOverview {
  const rows = getLedger().transactions.filter((t) => matches(t, filters));
  const summary = computeSummary(rows);
  const trendMap = new Map<string, TrendPoint>();
  for (const tx of rows) {
    const period = tx.occurredAt.slice(0, 7);
    const cur = trendMap.get(period) ?? { period, revenue: 0, expenses: 0, net: 0 };
    if (tx.category === "Revenue") cur.revenue += tx.amount;
    else cur.expenses += tx.amount;
    cur.net = round2(cur.revenue - cur.expenses);
    trendMap.set(period, cur);
  }
  const trends = [...trendMap.values()]
    .sort((a, b) => a.period.localeCompare(b.period))
    .map((t) => ({
      ...t,
      revenue: round2(t.revenue),
      expenses: round2(t.expenses),
      net: round2(t.net),
    }));

  const catMap = new Map<string, Breakdown>();
  const statusMap = new Map<string, Breakdown>();
  const partyMap = new Map<string, PartyStat>();
  for (const tx of rows) {
    const c = catMap.get(tx.category) ?? { key: tx.category, total: 0, count: 0 };
    c.total += tx.amount;
    c.count += 1;
    catMap.set(tx.category, c);

    const s = statusMap.get(tx.status) ?? { key: tx.status, total: 0, count: 0 };
    s.total += tx.amount;
    s.count += 1;
    statusMap.set(tx.status, s);

    const p =
      partyMap.get(tx.partyId) ?? {
        partyId: tx.partyId,
        partyName: tx.partyName,
        total: 0,
        count: 0,
        revenue: 0,
        expenses: 0,
      };
    p.total += tx.amount;
    p.count += 1;
    if (tx.category === "Revenue") p.revenue += tx.amount;
    else p.expenses += tx.amount;
    partyMap.set(tx.partyId, p);
  }

  const recent = [...rows].sort((a, b) => sortTx(a, b, "occurred_at", "desc")).slice(0, 6);
  const topParties = [...partyMap.values()]
    .map((p) => ({
      ...p,
      total: round2(p.total),
      revenue: round2(p.revenue),
      expenses: round2(p.expenses),
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 6);

  return {
    summary,
    trends,
    categoryBreakdown: [...catMap.values()].map((d) => ({ ...d, total: round2(d.total) })),
    statusBreakdown: [...statusMap.values()].map((d) => ({ ...d, total: round2(d.total) })),
    recent,
    topParties,
  };
}

export function listTransactions(input: {
  page: number;
  limit: number;
  sortBy: SortField;
  sortOrder: SortOrder;
  filters: Filters;
}): { data: Transaction[]; pagination: Pagination } {
  const filtered = getLedger()
    .transactions.filter((t) => matches(t, input.filters))
    .sort((a, b) => sortTx(a, b, input.sortBy, input.sortOrder));
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / input.limit));
  const page = Math.min(input.page, totalPages);
  const start = (page - 1) * input.limit;
  return {
    data: filtered.slice(start, start + input.limit),
    pagination: {
      page,
      limit: input.limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
}

export function exportTransactions(input: {
  filters: Filters;
  sortBy: SortField;
  sortOrder: SortOrder;
  columns: string[];
  filename?: string;
}) {
  const { data } = listTransactions({
    page: 1,
    limit: 100_000,
    sortBy: input.sortBy,
    sortOrder: input.sortOrder,
    filters: input.filters,
  });
  const columns = input.columns as ExportColumnKey[];
  const csv = transactionsToCsv(data, columns);
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const base = (input.filename ?? "transactions").replace(/[^\w.-]+/g, "_");
  return { csv, filename: `${base}_${stamp}.csv`, rowCount: data.length };
}

function pushAlert(kind: AlertItem["kind"], title: string, body: string, transactionId: number | null) {
  const L = getLedger();
  L.alerts.unshift({
    id: L.nextAlertId++,
    kind,
    title,
    body,
    transactionId,
    read: false,
    createdAt: new Date().toISOString(),
  });
}

export function addTransaction(input: {
  date: string;
  amount: number;
  category: Category;
  status: Status;
  partyName: string;
  note?: string;
}) {
  const L = getLedger();
  const party = partyFromId(input.partyName.toLowerCase().replace(/\s+/g, "_"), input.partyName);
  const tx: Transaction = {
    id: L.nextTxId++,
    occurredAt: input.date,
    amount: round2(input.amount),
    category: input.category,
    status: input.status,
    partyId: party.id,
    partyName: party.name,
    note: input.note?.trim() || noteFor(input.category, party.name),
  };
  L.transactions.push(tx);
  if (input.status === "Failed" && L.settings.notifyFailed) {
    pushAlert(
      "failed",
      "Transaction failed",
      `Payment of ${tx.amount.toFixed(2)} with ${party.name} could not be completed.`,
      tx.id,
    );
  } else if (input.status === "Pending" && L.settings.notifyPending) {
    pushAlert(
      "pending",
      "Awaiting confirmation",
      `A ${tx.category.toLowerCase()} of ${tx.amount.toFixed(2)} with ${party.name} is still pending.`,
      tx.id,
    );
  }
  // Creative signals: anomaly vs party baseline + budget envelope pressure
  const anomalies = detectAnomalies(L.transactions);
  const flag = anomalies.find((a) => a.transactionId === tx.id);
  if (flag) {
    pushAlert("anomaly", "Unusual amount", flag.reason, tx.id);
  }
  if (tx.category === "Expense" && tx.status !== "Failed") {
    const overview = buildBudgetOverview(L.transactions, L.budgets);
    const statuses = overview.envelopes.filter((e) => e.over);
    for (const s of statuses) {
      const already = L.alerts.some(
        (a) => a.kind === "budget" && a.title.includes(s.name) && !a.read && a.createdAt.slice(0, 10) === new Date().toISOString().slice(0, 10),
      );
      if (!already && s.over) {
        pushAlert(
          "budget",
          `${s.name} over budget`,
          `Spent ${s.spent.toFixed(0)} of ${s.monthlyLimit.toFixed(0)} this month (${s.pct}%).`,
          tx.id,
        );
      }
    }
  }
  commit();
  return { id: tx.id };
}

export function importTransactions(input: { filename: string; rows: UploadRow[] }) {
  let inserted = 0;
  let errors = 0;
  for (const raw of input.rows.slice(0, 500)) {
    try {
      addTransaction({
        date: raw.date,
        amount: raw.amount,
        category: raw.category,
        status: raw.status,
        partyName: raw.partyName,
        note: raw.note,
      });
      inserted += 1;
    } catch {
      errors += 1;
    }
  }
  const L = getLedger();
  L.uploads.unshift({
    id: L.nextUploadId++,
    filename: input.filename,
    rowCount: inserted,
    errorCount: errors,
    createdAt: new Date().toISOString(),
  });
  pushAlert(
    "upload",
    "Data uploaded",
    `Imported ${inserted} transaction${inserted === 1 ? "" : "s"} from ${input.filename}${errors ? ` (${errors} skipped)` : ""}.`,
    null,
  );
  commit();
  return { inserted, errors, alerts: 1 };
}

export function listAlerts() {
  const items = getLedger().alerts;
  return { items, unread: items.filter((a) => !a.read).length };
}

export function markAlertRead(id: number, read = true) {
  const item = getLedger().alerts.find((a) => a.id === id);
  if (item) item.read = read;
  commit();
  return { ok: true };
}

export function markAllAlertsRead() {
  getLedger().alerts.forEach((a) => {
    a.read = true;
  });
  commit();
  return { ok: true };
}

export function listUploads() {
  return getLedger().uploads;
}

export function resetDemoData() {
  ledger = createSeededLedger();
  commit();
  return { ok: true };
}

export function wipeUserData() {
  const currency = getLedger().settings.currency;
  ledger = {
    nextTxId: 1,
    nextAlertId: 1,
    nextUploadId: 1,
    settings: { currency, notifyFailed: true, notifyPending: true, seeded: false },
    transactions: [],
    alerts: [],
    uploads: [],
    budgets: DEFAULT_ENVELOPES.map((e) => ({ ...e, keywords: [...e.keywords] })),
  };
  commit();
  return { ok: true };
}

export function getBudgetOverview(): BudgetOverview {
  const L = getLedger();
  return buildBudgetOverview(L.transactions, L.budgets);
}

export function listBudgets(): BudgetEnvelope[] {
  return getLedger().budgets.map((b) => ({ ...b, keywords: [...b.keywords] }));
}

export function updateBudgetLimit(id: string, monthlyLimit: number): BudgetEnvelope[] {
  const L = getLedger();
  const hit = L.budgets.find((b) => b.id === id);
  if (hit) {
    hit.monthlyLimit = Math.max(0, monthlyLimit);
    commit();
  }
  return listBudgets();
}

export function getAnomalies(): AnomalyFlag[] {
  return detectAnomalies(getLedger().transactions);
}

/** Map transactionId → anomaly for table badges. */
export function getAnomalyMap(): Record<number, AnomalyFlag> {
  const map: Record<number, AnomalyFlag> = {};
  for (const a of getAnomalies()) map[a.transactionId] = a;
  return map;
}

export type { Currency };
