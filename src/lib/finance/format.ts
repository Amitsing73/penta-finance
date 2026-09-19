import { format, parseISO } from "date-fns";
import type { Currency, Status } from "./types";

const CURRENCY_LOCALES: Record<Currency, { locale: string; currency: string }> = {
  USD: { locale: "en-US", currency: "USD" },
  EUR: { locale: "de-DE", currency: "EUR" },
  GBP: { locale: "en-GB", currency: "GBP" },
  INR: { locale: "en-IN", currency: "INR" },
};

export function formatMoney(amount: number, currency: Currency = "USD"): string {
  const cfg = CURRENCY_LOCALES[currency] ?? CURRENCY_LOCALES.USD;
  return new Intl.NumberFormat(cfg.locale, {
    style: "currency",
    currency: cfg.currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatSignedMoney(
  amount: number,
  category: "Revenue" | "Expense",
  currency: Currency = "USD",
): string {
  const formatted = formatMoney(amount, currency);
  return category === "Revenue" ? `+${formatted}` : `-${formatted}`;
}

export function formatCompact(amount: number, currency: Currency = "USD"): string {
  const cfg = CURRENCY_LOCALES[currency] ?? CURRENCY_LOCALES.USD;
  return new Intl.NumberFormat(cfg.locale, {
    style: "currency",
    currency: cfg.currency,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount);
}

export function formatDate(iso: string): string {
  try {
    return format(parseISO(iso), "EEE, d MMM yyyy");
  } catch {
    return iso;
  }
}

export function formatShortDate(iso: string): string {
  try {
    return format(parseISO(iso), "d MMM yyyy");
  } catch {
    return iso;
  }
}

export function formatMonth(period: string): string {
  const [y, m] = period.split("-");
  if (!y || !m) return period;
  const date = new Date(Date.UTC(Number(y), Number(m) - 1, 1));
  return format(date, "MMM");
}

export function statusLabel(status: Status): string {
  if (status === "Paid") return "Completed";
  return status;
}

export function toNumber(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

export function toIso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  return new Date().toISOString();
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
