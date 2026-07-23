import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { ManifestTicket, ScanQueueEntry, ScanResult } from "./ticket.service";
import type { ScanMode } from "../utils/scanVerdict";

/**
 * Offline storage for the scanner — spec section 8: "src/services/ticketDb.ts
 * — IndexedDB manifest and queue." Three stores:
 *
 *   - manifest: every ticket for the event, downloaded on login while
 *     online (section 6), read locally on every scan thereafter.
 *   - queue: outbound scans not yet acknowledged by the server, keyed by the
 *     client-generated `client_scan_id` so re-adding the same scan (it
 *     should never happen, but `put` is used everywhere defensively) is a
 *     no-op rather than a duplicate.
 *   - conflicts: duplicate-scan events the server flagged during sync —
 *     recorded for the Phase 3 reconciliation report rather than dropped.
 */

const DB_NAME = "kcw-ticket-scanner";
const DB_VERSION = 1;
const MANIFEST_STORE = "manifest";
const QUEUE_STORE = "queue";
const CONFLICT_STORE = "conflicts";
const SHORT_CODE_INDEX = "by_short_code";

/**
 * One duplicate-scan event: the server told us, while syncing `client_scan_id`,
 * that the stage it targeted had already been recorded by a different agent.
 * Kept keyed by `client_scan_id` so re-processing the same server ack (see
 * `reconcileScanResults`) never creates a second copy of the same conflict.
 */
export interface ConflictRecord {
  client_scan_id: string;
  ticket_id: number;
  mode: ScanMode;
  scanned_at: string;
  recorded_at: string;
  server_state: ScanResult;
}

/** The subset of a `ManifestTicket` a server ack can actually tell us. */
export interface ManifestPatch {
  id: number;
  kit_collected: boolean;
  kit_collected_at?: string;
  kit_collected_by?: string;
  checked_in: boolean;
  checked_in_at?: string;
  checked_in_by?: string;
}

export interface ReconcileOutcome {
  /** Server-authoritative state to merge into the local manifest, one row per ticket. */
  manifestPatches: ManifestPatch[];
  /** `client_scan_id`s the server has acknowledged — safe to drop from the queue. */
  settledClientScanIds: string[];
  /** Duplicate-scan events to keep for the reconciliation report. */
  conflicts: ConflictRecord[];
}

interface TicketDbSchema extends DBSchema {
  [MANIFEST_STORE]: {
    key: number;
    value: ManifestTicket;
    indexes: { [SHORT_CODE_INDEX]: string };
  };
  [QUEUE_STORE]: {
    key: string;
    value: ScanQueueEntry;
  };
  [CONFLICT_STORE]: {
    key: string;
    value: ConflictRecord;
  };
}

let dbPromise: Promise<IDBPDatabase<TicketDbSchema>> | null = null;

function getDb(): Promise<IDBPDatabase<TicketDbSchema>> {
  if (!dbPromise) {
    dbPromise = openDB<TicketDbSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(MANIFEST_STORE)) {
          const store = db.createObjectStore(MANIFEST_STORE, { keyPath: "id" });
          store.createIndex(SHORT_CODE_INDEX, "short_code", { unique: true });
        }
        if (!db.objectStoreNames.contains(QUEUE_STORE)) {
          db.createObjectStore(QUEUE_STORE, { keyPath: "client_scan_id" });
        }
        if (!db.objectStoreNames.contains(CONFLICT_STORE)) {
          db.createObjectStore(CONFLICT_STORE, { keyPath: "client_scan_id" });
        }
      },
    });
  }
  return dbPromise;
}

// ---------------------------------------------------------------------------
// Manifest
// ---------------------------------------------------------------------------

/** Replaces the entire local manifest — called after a fresh `getManifest()` while online. */
export async function saveManifest(tickets: ManifestTicket[]): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(MANIFEST_STORE, "readwrite");
  await tx.store.clear();
  await Promise.all(tickets.map((t) => tx.store.put(t)));
  await tx.done;
}

export async function getManifestFromDb(): Promise<ManifestTicket[]> {
  const db = await getDb();
  return db.getAll(MANIFEST_STORE);
}

export async function getManifestTicket(id: number): Promise<ManifestTicket | undefined> {
  const db = await getDb();
  return db.get(MANIFEST_STORE, id);
}

export async function getManifestTicketByShortCode(
  shortCode: string,
): Promise<ManifestTicket | undefined> {
  const db = await getDb();
  return db.getFromIndex(MANIFEST_STORE, SHORT_CODE_INDEX, shortCode);
}

/** Upserts one ticket — used both for optimistic local writes and reconciled server state. */
export async function putManifestTicket(ticket: ManifestTicket): Promise<void> {
  const db = await getDb();
  await db.put(MANIFEST_STORE, ticket);
}

/**
 * Applies an offline scan to a ticket's local state *before* the network
 * round-trip — spec section 6: "write the new state locally" happens before
 * the queue append, not after a server response. Pure and synchronous so it
 * can run entirely offline; the caller persists the result with
 * `putManifestTicket`.
 *
 * `mode`'s flag is set unconditionally (not just when previously unset) —
 * ALREADY_USED is a warning the agent can override, and an override must
 * still update the local record, otherwise the override itself would be
 * invisible until the next sync.
 */
export function applyLocalScan(
  existing: ManifestTicket | undefined,
  fallback: { id: number; order_id: number; short_code: string; size: string },
  mode: ScanMode,
  scannedAt: string,
  agentLabel: string,
): ManifestTicket {
  const base: ManifestTicket = existing ?? {
    id: fallback.id,
    order_id: fallback.order_id,
    short_code: fallback.short_code,
    size: fallback.size,
    kit_collected: false,
    checked_in: false,
  };

  if (mode === "kit") {
    return {
      ...base,
      kit_collected: true,
      kit_collected_at: scannedAt,
      kit_collected_by: agentLabel,
    };
  }

  return {
    ...base,
    checked_in: true,
    checked_in_at: scannedAt,
    checked_in_by: agentLabel,
  };
}

// ---------------------------------------------------------------------------
// Queue
// ---------------------------------------------------------------------------

export async function enqueueScan(entry: ScanQueueEntry): Promise<void> {
  const db = await getDb();
  await db.put(QUEUE_STORE, entry);
}

export async function getQueue(): Promise<ScanQueueEntry[]> {
  const db = await getDb();
  return db.getAll(QUEUE_STORE);
}

export async function getQueueCount(): Promise<number> {
  const db = await getDb();
  return db.count(QUEUE_STORE);
}

export async function removeQueueEntries(clientScanIds: string[]): Promise<void> {
  if (clientScanIds.length === 0) return;
  const db = await getDb();
  const tx = db.transaction(QUEUE_STORE, "readwrite");
  await Promise.all(clientScanIds.map((id) => tx.store.delete(id)));
  await tx.done;
}

// ---------------------------------------------------------------------------
// Conflicts
// ---------------------------------------------------------------------------

/** Upserts by `client_scan_id`, so recording the same conflict twice (replay) is a no-op. */
export async function recordConflicts(conflicts: ConflictRecord[]): Promise<void> {
  if (conflicts.length === 0) return;
  const db = await getDb();
  const tx = db.transaction(CONFLICT_STORE, "readwrite");
  await Promise.all(conflicts.map((c) => tx.store.put(c)));
  await tx.done;
}

export async function getConflicts(): Promise<ConflictRecord[]> {
  const db = await getDb();
  return db.getAll(CONFLICT_STORE);
}

// ---------------------------------------------------------------------------
// Reconciliation — pure, no IndexedDB, carries the correctness burden.
// ---------------------------------------------------------------------------

/**
 * Reconciles queued scans against the server's authoritative response —
 * spec section 6 ("Sync") and section 10's three required properties:
 *
 *   1. Idempotent under replay: a deterministic function of its inputs, so
 *      processing the same server ack twice (a resend after a dropped
 *      response) produces identical output — safe for callers to merge into
 *      a Set/Map-keyed store without double-counting.
 *   2. Server state wins: the returned `manifestPatches` always reflect the
 *      server's fields, never the local optimistic write a scan made before
 *      syncing.
 *   3. Conflicts are recorded, not dropped: a `conflict: true` result still
 *      settles its scan and still updates the manifest — it *additionally*
 *      produces a `ConflictRecord` instead of being discarded.
 *
 * `results[i]` is matched to `sentEntries[i]` by array index, mirroring the
 * request/response ordering `postScans` already assumes in
 * `ScanPage.recordScan` (`const [state] = await postScans([...])`) — see the
 * TODO in ticket.service.ts; the response has no `client_scan_id` to key on.
 * A response whose `ticket_id` doesn't match its positional request entry is
 * treated as not yet acknowledged rather than misapplied.
 */
export function reconcileScanResults(
  sentEntries: ScanQueueEntry[],
  results: ScanResult[],
  recordedAt: string = new Date().toISOString(),
): ReconcileOutcome {
  const manifestPatches = new Map<number, ManifestPatch>();
  const settledClientScanIds: string[] = [];
  const conflicts: ConflictRecord[] = [];

  const count = Math.min(sentEntries.length, results.length);
  for (let i = 0; i < count; i++) {
    const entry = sentEntries[i];
    const result = results[i];
    if (!result || result.ticket_id !== entry.ticket_id) continue;

    settledClientScanIds.push(entry.client_scan_id);
    manifestPatches.set(entry.ticket_id, {
      id: entry.ticket_id,
      kit_collected: result.kit_collected,
      kit_collected_at: result.kit_collected_at,
      kit_collected_by: result.kit_collected_by,
      checked_in: result.checked_in,
      checked_in_at: result.checked_in_at,
      checked_in_by: result.checked_in_by,
    });

    if (result.conflict) {
      conflicts.push({
        client_scan_id: entry.client_scan_id,
        ticket_id: entry.ticket_id,
        mode: entry.mode,
        scanned_at: entry.scanned_at,
        recorded_at: recordedAt,
        server_state: result,
      });
    }
  }

  return {
    manifestPatches: [...manifestPatches.values()],
    settledClientScanIds,
    conflicts,
  };
}
