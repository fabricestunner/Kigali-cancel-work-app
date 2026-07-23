import api from "./api";

/** Summary returned by `POST /payment/reconcile` — one sweep of stale pending
 * orders verified against DPO. `errors` carries a reason per DPO token that
 * could not be checked, so a per-token failure never hides the rest of the
 * sweep's outcome. */
export interface ReconcileSummary {
  scanned: number;
  reconciled: number;
  failed: number;
  stillPending: number;
  errors: { dpoToken: string; reason: string }[];
}

/** Triggers an admin-only sweep of stale pending orders against DPO,
 * completing the ones that actually paid. Safe to call repeatedly — the
 * backend's fulfilment is idempotent, so a re-run of an already-settled
 * token is a no-op counted toward `reconciled`. */
export async function reconcilePayments(): Promise<ReconcileSummary> {
  const res = await api.post<ReconcileSummary>("/payment/reconcile");
  return res.data;
}
