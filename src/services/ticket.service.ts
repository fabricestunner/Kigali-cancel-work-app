import api from "./api";
import type { ScanMode } from "../utils/scanVerdict";

// The event id embedded in every token's `ev` field. Spec section 3 assumes
// "kcw2026" pending confirmation from backend (see docs/BACKEND-REQUIREMENTS.md
// Q2) — update this in one place if that changes.
export const TICKET_EVENT_ID = "kcw2026";

/**
 * One row of the manifest returned by GET /ticket/manifest — the offline
 * source of truth a scanner checks a decoded token's state against. Mirrors
 * the "State per ticket" table in the design spec section 4.
 */
export interface ManifestTicket {
  id: number;
  order_id: number;
  short_code: string;
  size: string;
  kit_collected: boolean;
  kit_collected_at?: string;
  kit_collected_by?: string;
  checked_in: boolean;
  checked_in_at?: string;
  checked_in_by?: string;
}

export interface ScanQueueEntry {
  client_scan_id: string;
  ticket_id: number;
  mode: ScanMode;
  scanned_at: string;
  overridden: boolean;
}

/**
 * Authoritative post-scan state for one ticket, as returned by
 * POST /ticket/scan. `conflict` is set when the stage this scan targeted was
 * already recorded by a *different* agent — surfaced for the duplicate-scan
 * reconciliation report (Phase 3), not acted on specially in Phase 1.
 */
export interface ScanResult {
  ticket_id: number;
  kit_collected: boolean;
  kit_collected_at?: string;
  kit_collected_by?: string;
  checked_in: boolean;
  checked_in_at?: string;
  checked_in_by?: string;
  conflict: boolean;
}

/**
 * Downloads the full ticket list for an event — spec section 7:
 * `GET /ticket/manifest?event=kcw2026`.
 */
export async function getManifest(event: string = TICKET_EVENT_ID): Promise<ManifestTicket[]> {
  const res = await api.get<ManifestTicket[]>("/ticket/manifest", {
    params: { event },
  });
  return res.data;
}

/**
 * Posts a batch of queued scans — spec section 7: `POST /ticket/scan`,
 * idempotent on `client_scan_id`. Phase 1 has no offline queue, so callers
 * typically post a single-entry batch per live scan; the shape still
 * matches the documented contract so Phase 2 can start batching without a
 * server-side change.
 */
export async function postScans(scans: ScanQueueEntry[]): Promise<ScanResult[]> {
  const res = await api.post<ScanResult[]>("/ticket/scan", { scans });
  return res.data;
}

/**
 * Manual short-code lookup when online — spec section 7:
 * `GET /ticket/lookup?code=T-4417`. Returns null (never throws) for a code
 * that does not exist, distinguishing "not found" from a network failure,
 * which callers should still surface to the agent.
 */
export async function lookupByCode(code: string): Promise<ManifestTicket | null> {
  try {
    const res = await api.get<ManifestTicket>("/ticket/lookup", {
      params: { code },
    });
    return res.data;
  } catch (err) {
    const status = (err as { response?: { status?: number } }).response?.status;
    if (status === 404) return null;
    throw err;
  }
}
