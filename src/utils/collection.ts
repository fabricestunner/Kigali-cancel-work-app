// An order is fully paid (no further payment action needed) when its status
// starts with "paid" — covers both "paid" and "paid_backorder". Mirrors
// isPaid() in src/components/dashboard/recentOrders.helpers.ts, duplicated
// here to keep this module free of React/component imports.
const isPaidStatus = (status: string) => status.startsWith("paid");

export type CollectionStateValue = "collected" | "partial" | "awaiting" | "not-payable";

export interface CollectionSummary {
  state: CollectionStateValue;
  collected: number;
  total: number;
}

interface CollectionRow {
  status: string;
  collected: boolean;
}

/**
 * Summarises collection progress across a group of order rows (typically the
 * rows sharing a payment_ref).
 *
 * `total` counts only paid rows once at least one exists — an unpaid row can
 * never be collected, so it is excluded from the denominator of a payable
 * group. When *no* row in the group is paid, `total` falls back to the full
 * row count instead, so a "not-payable" group still reports how many order
 * lines are waiting on payment rather than reporting 0.
 */
export function collectionState(rows: CollectionRow[]): CollectionSummary {
  const paidRows = rows.filter((r) => isPaidStatus(r.status));

  if (paidRows.length === 0) {
    return {
      state: rows.length === 0 ? "awaiting" : "not-payable",
      collected: 0,
      total: rows.length,
    };
  }

  const collectedCount = paidRows.filter((r) => r.collected).length;

  let state: CollectionStateValue;
  if (collectedCount === 0) {
    state = "awaiting";
  } else if (collectedCount === paidRows.length) {
    state = "collected";
  } else {
    state = "partial";
  }

  return { state, collected: collectedCount, total: paidRows.length };
}

interface PaymentRefRow {
  id: number;
  payment_ref: string | null;
}

/**
 * Groups rows by payment_ref. Rows with no reference are grouped under their
 * own id (`#<id>`), each forming a singleton group rather than being merged
 * together under a shared "null" key.
 */
export function groupByPaymentRef<T extends PaymentRefRow>(rows: T[]): Record<string, T[]> {
  const groups: Record<string, T[]> = {};
  for (const row of rows) {
    const key = row.payment_ref ?? `#${row.id}`;
    (groups[key] ??= []).push(row);
  }
  return groups;
}
