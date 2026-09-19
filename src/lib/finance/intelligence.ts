import { round2 } from "./format";
import type {
  AnomalyFlag,
  BudgetEnvelope,
  BudgetOverview,
  BudgetStatus,
  Transaction,
} from "./types";

export const DEFAULT_ENVELOPES: BudgetEnvelope[] = [
  {
    id: "people",
    name: "People & transfers",
    monthlyLimit: 8000,
    keywords: [
      "matheus",
      "floyd",
      "jerome",
      "cameron",
      "miles",
      "bell",
      "williamson",
      "ferrero",
      "transfer",
    ],
  },
  {
    id: "ops",
    name: "Ops & fees",
    monthlyLimit: 1500,
    keywords: ["fee", "ops", "service", "bank", "subscription"],
  },
  {
    id: "other",
    name: "Other spend",
    monthlyLimit: 2500,
    keywords: [],
  },
];

function currentMonthKey(d = new Date()): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function matchEnvelope(tx: Transaction, envelopes: BudgetEnvelope[]): string {
  const hay = `${tx.partyName} ${tx.note ?? ""}`.toLowerCase();
  for (const env of envelopes) {
    if (env.id === "other") continue;
    if (env.keywords.some((k) => hay.includes(k.toLowerCase()))) return env.id;
  }
  return "other";
}

export function buildBudgetOverview(
  transactions: Transaction[],
  envelopes: BudgetEnvelope[],
  month?: string,
): BudgetOverview {
  const m = month ?? currentMonthKey();
  const monthTx = transactions.filter(
    (t) => t.category === "Expense" && t.occurredAt.startsWith(m) && t.status !== "Failed",
  );

  const spentBy = new Map<string, { spent: number; count: number }>();
  for (const env of envelopes) spentBy.set(env.id, { spent: 0, count: 0 });

  for (const tx of monthTx) {
    const id = matchEnvelope(tx, envelopes);
    const cur = spentBy.get(id) ?? { spent: 0, count: 0 };
    cur.spent += tx.amount;
    cur.count += 1;
    spentBy.set(id, cur);
  }

  const statuses: BudgetStatus[] = envelopes.map((env) => {
    const { spent, count } = spentBy.get(env.id) ?? { spent: 0, count: 0 };
    const s = round2(spent);
    const limit = env.monthlyLimit;
    const pct = limit > 0 ? Math.min(999, Math.round((s / limit) * 100)) : 0;
    return {
      id: env.id,
      name: env.name,
      monthlyLimit: limit,
      spent: s,
      remaining: round2(Math.max(0, limit - s)),
      pct,
      over: limit > 0 && s > limit,
      txCount: count,
    };
  });

  const totalLimit = round2(envelopes.reduce((a, e) => a + e.monthlyLimit, 0));
  const totalSpent = round2(statuses.reduce((a, s) => a + s.spent, 0));

  return { month: m, envelopes: statuses, totalLimit, totalSpent };
}

/** Flag amounts that are ≥ 2× the party's historical average (same category). */
export function detectAnomalies(transactions: Transaction[]): AnomalyFlag[] {
  const byParty = new Map<string, Transaction[]>();
  for (const tx of transactions) {
    if (tx.status === "Failed") continue;
    const key = `${tx.partyId}::${tx.category}`;
    const list = byParty.get(key) ?? [];
    list.push(tx);
    byParty.set(key, list);
  }

  const flags: AnomalyFlag[] = [];
  for (const [, list] of byParty) {
    if (list.length < 3) continue;
    const sorted = [...list].sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));
    for (let i = 0; i < sorted.length; i++) {
      const prior = sorted.slice(0, i);
      if (prior.length < 2) continue;
      const baseline = prior.reduce((s, t) => s + t.amount, 0) / prior.length;
      if (baseline <= 0) continue;
      const tx = sorted[i]!;
      const ratio = tx.amount / baseline;
      if (ratio >= 2 && tx.amount >= baseline + 40) {
        flags.push({
          transactionId: tx.id,
          partyName: tx.partyName,
          amount: tx.amount,
          baseline: round2(baseline),
          ratio: round2(ratio),
          reason: `${tx.amount.toFixed(0)} is ${ratio.toFixed(1)}× usual for ${tx.partyName} (avg ${baseline.toFixed(0)})`,
        });
      }
    }
  }
  return flags;
}
