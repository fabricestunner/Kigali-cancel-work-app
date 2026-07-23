import {
  getQueue,
  getQueueCount,
  removeQueueEntries,
  recordConflicts,
  getManifestTicket,
  putManifestTicket,
  reconcileScanResults,
  enqueueScan,
} from "./ticketDb";
import { postScans } from "./ticket.service";
import type { ScanQueueEntry } from "./ticket.service";

/**
 * Flushes the local scan queue to the server on reconnect, with exponential
 * backoff on failure — spec section 6 ("Sync"), T-F8. Every state change is
 * pushed to subscribers so the scanner UI can show an explicit, always-true
 * sync status ("12 scans pending" / "all synced" / "offline") rather than a
 * silent queue — per the spec, "Silent queues are how scans get lost."
 */

export type SyncStatus = "offline" | "synced" | "pending" | "syncing" | "error";

export interface SyncState {
  status: SyncStatus;
  pendingCount: number;
  lastError: string | null;
  lastSyncedAt: string | null;
}

const BASE_DELAY_MS = 2_000;
const MAX_DELAY_MS = 60_000;

function isOnline(): boolean {
  return typeof navigator === "undefined" || navigator.onLine;
}

let state: SyncState = {
  status: isOnline() ? "pending" : "offline",
  pendingCount: 0,
  lastError: null,
  lastSyncedAt: null,
};

type Listener = (state: SyncState) => void;
const listeners = new Set<Listener>();

function setState(patch: Partial<SyncState>): void {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener(state));
}

/** Current sync state, for reading outside a subscription (e.g. on first render). */
export function getSyncState(): SyncState {
  return state;
}

/** Subscribes to sync state changes; fires immediately with the current state. Returns an unsubscribe function. */
export function subscribeSyncState(listener: Listener): () => void {
  listeners.add(listener);
  listener(state);
  return () => listeners.delete(listener);
}

let attempt = 0;
let retryTimer: ReturnType<typeof setTimeout> | null = null;
let flushInFlight = false;
let engineStarted = false;

function clearRetryTimer(): void {
  if (retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }
}

function scheduleRetry(): void {
  if (retryTimer || !isOnline()) return;
  const delay = Math.min(MAX_DELAY_MS, BASE_DELAY_MS * 2 ** attempt);
  attempt += 1;
  retryTimer = setTimeout(() => {
    retryTimer = null;
    void flushQueue();
  }, delay);
}

async function refreshPendingCount(): Promise<number> {
  const count = await getQueueCount();
  setState({ pendingCount: count });
  return count;
}

/**
 * Flushes every queued scan to the server in one batch, reconciles the
 * authoritative response into the local manifest and conflict log, and
 * drops only the entries the server actually acknowledged. Safe to call
 * repeatedly — `flushInFlight` collapses overlapping calls (e.g. an `online`
 * event firing while a periodic retry is already in progress) into one.
 */
export async function flushQueue(): Promise<void> {
  if (flushInFlight) return;

  if (!isOnline()) {
    setState({ status: "offline" });
    return;
  }

  const entries = await getQueue();
  const pending = await refreshPendingCount();

  if (pending === 0) {
    attempt = 0;
    clearRetryTimer();
    setState({ status: "synced", lastError: null });
    return;
  }

  flushInFlight = true;
  setState({ status: "syncing" });

  try {
    const results = await postScans(entries);
    const { manifestPatches, settledClientScanIds, conflicts } = reconcileScanResults(
      entries,
      results,
    );

    for (const patch of manifestPatches) {
      const existing = await getManifestTicket(patch.id);
      if (existing) {
        await putManifestTicket({ ...existing, ...patch });
      }
    }
    if (conflicts.length > 0) {
      await recordConflicts(conflicts);
    }
    await removeQueueEntries(settledClientScanIds);

    const remaining = await refreshPendingCount();
    if (remaining === 0) {
      attempt = 0;
      clearRetryTimer();
      setState({ status: "synced", lastError: null, lastSyncedAt: new Date().toISOString() });
    } else {
      // The server didn't acknowledge every entry in the batch (e.g. it
      // rejected part of it) — keep retrying the rest rather than assuming
      // the whole flush succeeded.
      setState({
        status: "pending",
        lastError: null,
        lastSyncedAt: new Date().toISOString(),
      });
      scheduleRetry();
    }
  } catch (err) {
    setState({
      status: "error",
      lastError: err instanceof Error ? err.message : "Sync failed",
    });
    scheduleRetry();
  } finally {
    flushInFlight = false;
  }
}

/**
 * Writes a scan to the outbound queue and attempts an immediate flush if
 * online. The write itself never depends on connectivity — this is called
 * after the scan has already been verified and applied locally.
 */
export async function queueScan(entry: ScanQueueEntry): Promise<void> {
  await enqueueScan(entry);
  await refreshPendingCount();
  if (isOnline()) {
    attempt = 0;
    void flushQueue();
  } else {
    setState({ status: "offline" });
  }
}

/**
 * Wires the `online`/`offline` listeners and does an initial pending-count
 * read + flush attempt. Idempotent — safe to call once per mount of the
 * scanner page; returns a cleanup function for the effect that started it.
 */
export function startSyncEngine(): () => void {
  if (engineStarted) return () => {};
  engineStarted = true;

  const handleOnline = () => {
    attempt = 0;
    clearRetryTimer();
    setState({ status: "pending" });
    void flushQueue();
  };
  const handleOffline = () => {
    clearRetryTimer();
    setState({ status: "offline" });
  };

  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);

  void refreshPendingCount().then(() => {
    if (isOnline()) void flushQueue();
    else setState({ status: "offline" });
  });

  return () => {
    window.removeEventListener("online", handleOnline);
    window.removeEventListener("offline", handleOffline);
    clearRetryTimer();
    engineStarted = false;
  };
}
