import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, LayoutDashboard, LogOut, ScanLine } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CameraScanner } from "../components/scan/CameraScanner";
import { ModeToggle } from "../components/scan/ModeToggle";
import { ManualEntry } from "../components/scan/ManualEntry";
import { VerdictPanel } from "../components/scan/VerdictPanel";
import { SyncStatusBar } from "../components/scan/SyncStatusBar";
import { verifyTicketToken } from "../utils/ticketToken";
import { scanVerdict } from "../utils/scanVerdict";
import type { ScanMode, ScanVerdictResult } from "../utils/scanVerdict";
import { getManifest, lookupByCode, TICKET_EVENT_ID, type ManifestTicket } from "../services/ticket.service";
import {
  saveManifest,
  getManifestFromDb,
  putManifestTicket,
  applyLocalScan,
} from "../services/ticketDb";
import {
  queueScan,
  startSyncEngine,
  subscribeSyncState,
  flushQueue,
  type SyncState,
} from "../services/ticketSync";
import { clearSession } from "../utils/auth";

const MODE_STORAGE_KEY = "scanMode";

/**
 * Label recorded locally as `kit_collected_by` / `checked_in_by` the instant
 * a scan happens — before the server has confirmed anything. It's replaced
 * by the server's own value once `reconcileScanResults` applies the
 * authoritative response (server state wins), so this only matters for the
 * brief window before sync.
 */
function currentAgentLabel(): string {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return "This device";
    const user = JSON.parse(raw) as { name?: string; email?: string };
    return user.name ?? user.email ?? "This device";
  } catch {
    return "This device";
  }
}

function readStoredMode(): ScanMode {
  try {
    const stored = localStorage.getItem(MODE_STORAGE_KEY);
    return stored === "kit" || stored === "entry" ? stored : "entry";
  } catch {
    return "entry";
  }
}

function makeClientScanId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  // Fallback for browsers without crypto.randomUUID — only needs to be
  // unique per device per session, not cryptographically strong.
  return `scan-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

interface DisplayResult extends ScanVerdictResult {
  mode: ScanMode;
  ticketId?: number;
  size?: string;
  shortCode?: string;
}

export function ScanPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<ScanMode>(readStoredMode);
  const [manifest, setManifest] = useState<Map<number, ManifestTicket>>(new Map());
  const [shortCodeIndex, setShortCodeIndex] = useState<Map<string, number>>(new Map());
  const [manifestError, setManifestError] = useState<string | null>(null);
  const [result, setResult] = useState<DisplayResult | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [overridePending, setOverridePending] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const [syncState, setSyncState] = useState<SyncState>(() => ({
    status: "pending",
    pendingCount: 0,
    lastError: null,
    lastSyncedAt: null,
  }));

  // The ticket this override button (if shown) would act on — kept
  // separate from `result` so an override can't accidentally fire against
  // stale state after the agent has moved on to the next scan.
  const pendingOverrideRef = useRef<{
    ticketId: number;
    orderId: number;
    size?: string;
    shortCode?: string;
  } | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(MODE_STORAGE_KEY, mode);
    } catch {
      // Storage can fail in private browsing on some devices — the mode
      // still works for the current session, it just won't survive reload.
    }
  }, [mode]);

  // Offline app shell (T-F8): registered ONLY here, from a page that is
  // itself lazy-loaded and reached only by someone navigating to /scan — an
  // ordinary site visitor never runs this effect. The explicit `scope`
  // means this service worker can only ever control documents under
  // "/scan"; it cannot intercept requests from "/" or "/dashboard".
  // `import.meta.env.PROD` guards it out of `vite dev`, where dist/sw.js
  // doesn't exist.
  useEffect(() => {
    if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/sw.js", { scope: "/scan" })
      .catch(() => {
        // Not fatal — the scanner still works with a live network; it just
        // won't survive a cold start with zero connectivity.
      });
  }, []);

  // Sync engine: starts once, flushes the queue on reconnect with backoff,
  // and drives the always-visible SyncStatusBar — T-F8.
  useEffect(() => {
    const stop = startSyncEngine();
    const unsubscribe = subscribeSyncState(setSyncState);
    return () => {
      unsubscribe();
      stop();
    };
  }, []);

  // Manifest: hydrate from IndexedDB first so the scanner works with zero
  // network (T-F7), then refresh from the server in the background when
  // online. A network failure here is never fatal — the local copy (however
  // stale) keeps scanning correctly; a verified ticket missing from it just
  // reads as ALLOW_UNKNOWN instead of catching a repeat scan.
  useEffect(() => {
    let cancelled = false;

    function applyTickets(tickets: ManifestTicket[]) {
      if (cancelled) return;
      setManifest(new Map(tickets.map((t) => [t.id, t])));
      setShortCodeIndex(new Map(tickets.map((t) => [t.short_code, t.id])));
    }

    (async () => {
      const cached = await getManifestFromDb();
      applyTickets(cached);

      try {
        const tickets = await getManifest(TICKET_EVENT_ID);
        if (cancelled) return;
        await saveManifest(tickets);
        applyTickets(tickets);
        setManifestError(null);
      } catch {
        if (cancelled) return;
        if (cached.length === 0) {
          setManifestError(
            "Could not load the ticket list and no offline copy is saved on this device — scans will still verify by signature, but every one will read as a new/unknown ticket until this reloads online.",
          );
        } else {
          setManifestError(
            "Could not refresh the ticket list — using the last downloaded copy. Repeat scans since then may not be caught until this reloads online.",
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const recordScan = useCallback(
    async (
      ticketId: number,
      orderId: number,
      size: string | undefined,
      shortCode: string | undefined,
      scanMode: ScanMode,
      overridden: boolean,
    ) => {
      const scannedAt = new Date().toISOString();

      // Fully local first: write the new state before any network call, so
      // it's correct even with zero connectivity — spec section 6.
      const existing = manifest.get(ticketId);
      const updated = applyLocalScan(
        existing,
        { id: ticketId, order_id: orderId, short_code: shortCode ?? "", size: size ?? "" },
        scanMode,
        scannedAt,
        currentAgentLabel(),
      );
      await putManifestTicket(updated);
      setManifest((prev) => new Map(prev).set(ticketId, updated));

      // Then enqueue for sync. The queue write never throws for
      // connectivity reasons — offline is a normal, silent-to-the-agent
      // state, surfaced instead through the always-visible SyncStatusBar.
      await queueScan({
        client_scan_id: makeClientScanId(),
        ticket_id: ticketId,
        mode: scanMode,
        scanned_at: scannedAt,
        overridden,
      });
    },
    [manifest],
  );

  const applyVerdict = useCallback(
    (
      ticketId: number | undefined,
      orderId: number | undefined,
      verdict: ScanVerdictResult,
      size?: string,
      shortCode?: string,
    ) => {
      setResult({ ...verdict, mode, ticketId, size, shortCode });
      setSessionCount((c) => c + 1);
      pendingOverrideRef.current =
        verdict.verdict === "ALREADY_USED" && ticketId !== undefined && orderId !== undefined
          ? { ticketId, orderId, size, shortCode }
          : null;

      if (
        (verdict.verdict === "ALLOW" || verdict.verdict === "ALLOW_UNKNOWN") &&
        ticketId !== undefined &&
        orderId !== undefined
      ) {
        void recordScan(ticketId, orderId, size, shortCode, mode, false);
      }
    },
    [mode, recordScan],
  );

  const handleDecoded = useCallback(
    async (raw: string) => {
      if (processing) return;
      setProcessing(true);
      setBanner(null);
      try {
        const publicKey = import.meta.env.VITE_TICKET_PUBLIC_KEY as string | undefined;
        if (!publicKey) {
          setBanner("Scanner is missing its public key configuration — contact an admin.");
          applyVerdict(undefined, undefined, { verdict: "REJECT" });
          return;
        }

        // Fully offline-capable: decode + verify the signature locally,
        // then look up state in the local manifest — no network required.
        const payload = await verifyTicketToken(raw, publicKey, TICKET_EVENT_ID);
        const known = payload ? manifest.get(payload.tid) : undefined;
        const verdict = scanVerdict(payload, known, mode);
        applyVerdict(
          payload?.tid,
          known?.order_id ?? payload?.oid,
          verdict,
          known?.size ?? payload?.sz,
          known?.short_code,
        );
      } finally {
        setProcessing(false);
      }
    },
    [processing, manifest, mode, applyVerdict],
  );

  const handleManualCode = useCallback(
    async (code: string) => {
      if (processing) return;
      setProcessing(true);
      setBanner(null);
      try {
        let ticket: ManifestTicket | undefined = (() => {
          const id = shortCodeIndex.get(code);
          return id !== undefined ? manifest.get(id) : undefined;
        })();

        if (!ticket) {
          if (!navigator.onLine) {
            setBanner(
              "That code isn't in the offline ticket list on this device, and there's no connection to look it up. Try the camera instead if this is a genuine QR ticket.",
            );
            applyVerdict(undefined, undefined, { verdict: "REJECT" });
            return;
          }
          try {
            const found = await lookupByCode(code);
            if (found) {
              ticket = found;
              await putManifestTicket(found);
              setManifest((prev) => new Map(prev).set(found.id, found));
              setShortCodeIndex((prev) => new Map(prev).set(found.short_code, found.id));
            }
          } catch {
            setBanner("Could not look up that code — check the connection and try again.");
            applyVerdict(undefined, undefined, { verdict: "REJECT" });
            return;
          }
        }

        if (!ticket) {
          applyVerdict(undefined, undefined, { verdict: "REJECT" });
          return;
        }

        // A short code found in the manifest/API is trusted directly — it
        // was only ever handed out by us, unlike a QR that could be forged
        // and therefore needs a signature check.
        const verdict = scanVerdict(
          { tid: ticket.id, oid: ticket.order_id, sz: ticket.size, ev: TICKET_EVENT_ID, iat: 0 },
          ticket,
          mode,
        );
        applyVerdict(ticket.id, ticket.order_id, verdict, ticket.size, ticket.short_code);
      } finally {
        setProcessing(false);
      }
    },
    [processing, manifest, shortCodeIndex, mode, applyVerdict],
  );

  const handleOverride = useCallback(() => {
    const pending = pendingOverrideRef.current;
    if (!pending) return;
    setOverridePending(true);
    void recordScan(pending.ticketId, pending.orderId, pending.size, pending.shortCode, mode, true).finally(
      () => {
        setOverridePending(false);
        setResult((prev) => (prev ? { ...prev, verdict: "ALLOW" } : prev));
        pendingOverrideRef.current = null;
      },
    );
  }, [mode, recordScan]);

  const handleLogout = () => {
    clearSession();
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-outline-variant bg-surface-container-lowest px-4 py-3">
        <div className="flex items-center gap-2">
          <ScanLine className="h-6 w-6 text-primary" aria-hidden="true" />
          <div>
            <p className="text-body-md font-bold text-on-surface">KCW Ticket Scanner</p>
            <p className="text-xs text-on-surface-variant">
              {sessionCount} scanned this session
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="flex min-h-[44px] items-center gap-1 rounded-lg px-3 text-label-md font-semibold text-on-surface-variant"
          >
            <LayoutDashboard className="h-5 w-5" aria-hidden="true" />
            Dashboard
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="flex min-h-[44px] items-center gap-1 rounded-lg px-3 text-label-md font-semibold text-on-surface-variant"
          >
            <LogOut className="h-5 w-5" aria-hidden="true" />
            Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-4 p-4">
        <ModeToggle mode={mode} onChange={setMode} />

        <SyncStatusBar state={syncState} onSyncNow={() => void flushQueue()} />

        {manifestError && (
          <div className="flex items-start gap-2 rounded-lg bg-tertiary-container p-3 text-body-md text-on-tertiary-container">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <p>{manifestError}</p>
          </div>
        )}

        {banner && (
          <div className="flex items-start gap-2 rounded-lg bg-error-container p-3 text-body-md text-on-error-container">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <p>{banner}</p>
          </div>
        )}

        <CameraScanner onDecode={handleDecoded} />

        <VerdictPanel
          verdict={result?.verdict ?? null}
          mode={mode}
          size={result?.size}
          shortCode={result?.shortCode}
          usedAt={result?.usedAt}
          usedBy={result?.usedBy}
          onOverride={result?.verdict === "ALREADY_USED" ? handleOverride : undefined}
          overridePending={overridePending}
        />

        <ManualEntry onSubmit={handleManualCode} disabled={processing} />
      </main>
    </div>
  );
}
