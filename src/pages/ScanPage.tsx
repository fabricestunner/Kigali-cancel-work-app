import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, LogOut, ScanLine } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CameraScanner } from "../components/scan/CameraScanner";
import { ModeToggle } from "../components/scan/ModeToggle";
import { ManualEntry } from "../components/scan/ManualEntry";
import { VerdictPanel } from "../components/scan/VerdictPanel";
import { verifyTicketToken } from "../utils/ticketToken";
import { scanVerdict } from "../utils/scanVerdict";
import type { ScanMode, ScanVerdictResult } from "../utils/scanVerdict";
import {
  getManifest,
  postScans,
  lookupByCode,
  TICKET_EVENT_ID,
  type ManifestTicket,
} from "../services/ticket.service";
import { clearSession } from "../utils/auth";

const MODE_STORAGE_KEY = "scanMode";

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

  // The ticket this override button (if shown) would act on — kept
  // separate from `result` so an override can't accidentally fire against
  // stale state after the agent has moved on to the next scan.
  const pendingOverrideRef = useRef<{ ticketId: number; size?: string; shortCode?: string } | null>(
    null,
  );

  useEffect(() => {
    try {
      localStorage.setItem(MODE_STORAGE_KEY, mode);
    } catch {
      // Storage can fail in private browsing on some devices — the mode
      // still works for the current session, it just won't survive reload.
    }
  }, [mode]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const tickets = await getManifest(TICKET_EVENT_ID);
        if (cancelled) return;
        setManifest(new Map(tickets.map((t) => [t.id, t])));
        setShortCodeIndex(new Map(tickets.map((t) => [t.short_code, t.id])));
        setManifestError(null);
      } catch {
        if (cancelled) return;
        // Not fatal: signed tokens still verify locally without the
        // manifest, they just always read as ALLOW_UNKNOWN instead of
        // catching a repeat scan. Manual code lookup still hits the API
        // directly per code.
        setManifestError(
          "Could not load the ticket list — scans will still work, but repeat scans may not be caught until this reloads.",
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const recordScan = useCallback(
    async (ticketId: number, scanMode: ScanMode, overridden: boolean) => {
      try {
        const [state] = await postScans([
          {
            client_scan_id: makeClientScanId(),
            ticket_id: ticketId,
            mode: scanMode,
            scanned_at: new Date().toISOString(),
            overridden,
          },
        ]);
        if (state) {
          setManifest((prev) => {
            const next = new Map(prev);
            const existing = next.get(ticketId);
            if (existing) {
              next.set(ticketId, {
                ...existing,
                kit_collected: state.kit_collected,
                kit_collected_at: state.kit_collected_at,
                kit_collected_by: state.kit_collected_by,
                checked_in: state.checked_in,
                checked_in_at: state.checked_in_at,
                checked_in_by: state.checked_in_by,
              });
            }
            return next;
          });
        }
      } catch {
        setBanner(
          "This scan was allowed here, but could not be saved to the server. Check the connection — the same ticket may show as unused again until it syncs.",
        );
      }
    },
    [],
  );

  const applyVerdict = useCallback(
    (ticketId: number | undefined, verdict: ScanVerdictResult, size?: string, shortCode?: string) => {
      setResult({ ...verdict, mode, ticketId, size, shortCode });
      setSessionCount((c) => c + 1);
      pendingOverrideRef.current =
        verdict.verdict === "ALREADY_USED" && ticketId !== undefined
          ? { ticketId, size, shortCode }
          : null;

      if ((verdict.verdict === "ALLOW" || verdict.verdict === "ALLOW_UNKNOWN") && ticketId !== undefined) {
        void recordScan(ticketId, mode, false);
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
          applyVerdict(undefined, { verdict: "REJECT" });
          return;
        }

        const payload = await verifyTicketToken(raw, publicKey, TICKET_EVENT_ID);
        const known = payload ? manifest.get(payload.tid) : undefined;
        const verdict = scanVerdict(payload, known, mode);
        applyVerdict(payload?.tid, verdict, known?.size ?? payload?.sz, known?.short_code);
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
          try {
            const found = await lookupByCode(code);
            if (found) {
              ticket = found;
              setManifest((prev) => new Map(prev).set(found.id, found));
              setShortCodeIndex((prev) => new Map(prev).set(found.short_code, found.id));
            }
          } catch {
            setBanner("Could not look up that code — check the connection and try again.");
            applyVerdict(undefined, { verdict: "REJECT" });
            return;
          }
        }

        if (!ticket) {
          applyVerdict(undefined, { verdict: "REJECT" });
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
        applyVerdict(ticket.id, verdict, ticket.size, ticket.short_code);
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
    void recordScan(pending.ticketId, mode, true).finally(() => {
      setOverridePending(false);
      setResult((prev) => (prev ? { ...prev, verdict: "ALLOW" } : prev));
      pendingOverrideRef.current = null;
    });
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
        <button
          type="button"
          onClick={handleLogout}
          className="flex min-h-[44px] items-center gap-1 rounded-lg px-3 text-label-md font-semibold text-on-surface-variant"
        >
          <LogOut className="h-5 w-5" aria-hidden="true" />
          Sign out
        </button>
      </header>

      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-4 p-4">
        <ModeToggle mode={mode} onChange={setMode} />

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
