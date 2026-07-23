import { describe, it, expect } from "vitest";
import { reconcileScanResults } from "./ticketDb";
import type { ScanQueueEntry, ScanResult } from "./ticket.service";

/**
 * These tests cover the pure reconciliation function only — no IndexedDB is
 * touched. Spec: docs/superpowers/specs/2026-07-21-ticketing-design.md
 * section 6, and section 10's three required properties: replay is
 * idempotent, server state wins, conflicts are recorded not dropped.
 */

const RECORDED_AT = "2026-08-09T06:20:00Z";

function entry(overrides: Partial<ScanQueueEntry> = {}): ScanQueueEntry {
  return {
    client_scan_id: "scan-1",
    ticket_id: 4417,
    mode: "entry",
    scanned_at: "2026-08-09T06:12:03Z",
    overridden: false,
    ...overrides,
  };
}

function result(overrides: Partial<ScanResult> = {}): ScanResult {
  return {
    client_scan_id: "scan-1",
    ticket_id: 4417,
    ok: true,
    conflict: false,
    state: {
      kit_collected: false,
      kit_collected_at: null,
      checked_in: true,
      checked_in_at: "2026-08-09T06:12:03Z",
    },
    ...overrides,
  };
}

describe("reconcileScanResults", () => {
  it("is idempotent under replay — reconciling the same ack twice yields identical output", () => {
    const entries = [entry()];
    const results = [result()];

    const first = reconcileScanResults(entries, results, RECORDED_AT);
    const second = reconcileScanResults(entries, results, RECORDED_AT);

    expect(second).toEqual(first);
    expect(first.settledClientScanIds).toEqual(["scan-1"]);

    // A caller merging settled ids into a Set, and conflicts into a Map
    // keyed by client_scan_id, must end up with exactly one entry each even
    // after processing the same server ack twice (e.g. a resend after a
    // dropped response).
    const settled = new Set<string>();
    first.settledClientScanIds.forEach((id) => settled.add(id));
    second.settledClientScanIds.forEach((id) => settled.add(id));
    expect(settled.size).toBe(1);
  });

  it("lets server state win over a conflicting local optimistic guess", () => {
    // Local scan optimistically assumed *this* agent's name/timestamp would
    // stick, but the server is authoritative and recorded a different agent
    // having checked this ticket in earlier.
    const entries = [
      entry({ client_scan_id: "scan-local", scanned_at: "2026-08-09T06:15:00Z" }),
    ];
    const results = [
      result({
        client_scan_id: "scan-local",
        conflict: true,
        // Server recorded an earlier check-in by a different agent; the
        // reconciled manifest must reflect the server's timestamp, not the
        // local optimistic 06:15.
        state: {
          kit_collected: false,
          kit_collected_at: null,
          checked_in: true,
          checked_in_at: "2026-08-09T06:10:00Z",
        },
      }),
    ];

    const { manifestPatches } = reconcileScanResults(entries, results, RECORDED_AT);

    expect(manifestPatches).toHaveLength(1);
    expect(manifestPatches[0]).toMatchObject({
      id: 4417,
      checked_in: true,
      checked_in_at: "2026-08-09T06:10:00Z",
    });
  });

  it("records conflicts rather than dropping them, while still settling and updating the ticket", () => {
    const entries = [entry({ client_scan_id: "scan-conflict" })];
    const results = [result({ client_scan_id: "scan-conflict", conflict: true })];

    const { conflicts, settledClientScanIds, manifestPatches } = reconcileScanResults(
      entries,
      results,
      RECORDED_AT,
    );

    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]).toMatchObject({
      client_scan_id: "scan-conflict",
      ticket_id: 4417,
      mode: "entry",
      recorded_at: RECORDED_AT,
    });
    // A conflict must not be silently dropped from the sync outcome, but the
    // scan itself is still settled and the manifest still gets updated —
    // "recorded, not dropped" is additive, not instead-of.
    expect(settledClientScanIds).toContain("scan-conflict");
    expect(manifestPatches).toHaveLength(1);
  });

  it("does not settle or duplicate output for scans the server has not yet acknowledged", () => {
    const entries = [entry({ client_scan_id: "scan-pending" })];
    const { settledClientScanIds, manifestPatches, conflicts } = reconcileScanResults(
      entries,
      [],
      RECORDED_AT,
    );

    expect(settledClientScanIds).toEqual([]);
    expect(manifestPatches).toEqual([]);
    expect(conflicts).toEqual([]);
  });

  it("matches by client_scan_id, not position, so a reordered response settles the right scan", () => {
    const entries = [
      entry({ client_scan_id: "scan-a", ticket_id: 1 }),
      entry({ client_scan_id: "scan-b", ticket_id: 2 }),
    ];
    // Server returns them in the opposite order. Positional matching would
    // apply ticket 2's state to scan-a; keyed matching must not.
    const results = [
      result({ client_scan_id: "scan-b", ticket_id: 2 }),
      result({ client_scan_id: "scan-a", ticket_id: 1 }),
    ];

    const { settledClientScanIds, manifestPatches } = reconcileScanResults(
      entries,
      results,
      RECORDED_AT,
    );

    expect(settledClientScanIds.sort()).toEqual(["scan-a", "scan-b"]);
    expect(manifestPatches.map((p) => p.id).sort()).toEqual([1, 2]);
  });

  it("leaves a rejected scan (ok:false) queued rather than settling it", () => {
    const entries = [entry({ client_scan_id: "scan-bad" })];
    const results = [
      result({ client_scan_id: "scan-bad", ok: false, error: "ticket not found", state: undefined }),
    ];

    const { settledClientScanIds, manifestPatches, conflicts } = reconcileScanResults(
      entries,
      results,
      RECORDED_AT,
    );

    expect(settledClientScanIds).toEqual([]);
    expect(manifestPatches).toEqual([]);
    expect(conflicts).toEqual([]);
  });
});
