export const STATUS_STYLES: Record<string, string> = {
  paid: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  failed: "bg-red-100 text-red-700",
  paid_backorder: "bg-amber-100 text-amber-700",
};

// Human-readable labels for statuses that aren't a single word.
export const STATUS_LABELS: Record<string, string> = {
  paid_backorder: "Paid · Backorder",
};

// An order is fully paid (no further payment action needed) when its status
// starts with "paid" — covers both "paid" and "paid_backorder".
export const isPaid = (status: string) => status.startsWith("paid");
