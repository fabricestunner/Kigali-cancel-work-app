import { CheckCircle2, AlertTriangle, HelpCircle, XCircle } from "lucide-react";
import type { Verdict, ScanMode } from "../../utils/scanVerdict";

export interface VerdictPanelProps {
  verdict: Verdict | null;
  mode: ScanMode;
  size?: string;
  shortCode?: string;
  usedAt?: string;
  usedBy?: string;
  /**
   * ALREADY_USED warns but never hard-blocks — the agent keeps discretion,
   * since a legitimate re-scan is far more common than fraud. Passing this
   * renders an explicit "override and allow" action; every use is recorded
   * by the caller with `overridden: true`.
   */
  onOverride?: () => void;
  overridePending?: boolean;
}

/**
 * Full-bleed verdict display, designed to be read at arm's length in direct
 * sunlight by an agent who has thirty seconds of training. Colour fills the
 * whole panel — it is the primary signal — but every colour is paired with
 * a redundant icon AND a word, since bright sun and colour blindness both
 * defeat colour alone.
 */
const VERDICT_CONFIG: Record<
  Verdict,
  { label: string; sublabel: string; icon: typeof CheckCircle2; classes: string }
> = {
  ALLOW: {
    label: "ALLOW",
    sublabel: "Valid ticket",
    icon: CheckCircle2,
    classes: "bg-success text-on-success",
  },
  ALREADY_USED: {
    label: "ALREADY USED",
    sublabel: "Agent discretion — see details below",
    icon: AlertTriangle,
    classes: "bg-tertiary-container text-on-tertiary-container",
  },
  ALLOW_UNKNOWN: {
    label: "ALLOW",
    sublabel: "Valid — recent purchase, not yet on list",
    icon: HelpCircle,
    classes: "bg-info text-on-info",
  },
  REJECT: {
    label: "NOT VALID",
    sublabel: "Do not admit",
    icon: XCircle,
    classes: "bg-error text-on-error",
  },
};

function formatTimestamp(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

export function VerdictPanel({
  verdict,
  mode,
  size,
  shortCode,
  usedAt,
  usedBy,
  onOverride,
  overridePending,
}: VerdictPanelProps) {
  if (!verdict) {
    return (
      <div className="w-full rounded-xl border-2 border-dashed border-outline-variant bg-surface-container p-8 text-center">
        <p className="text-headline-md font-semibold text-on-surface-variant">
          Scan a QR or enter a short code
        </p>
      </div>
    );
  }

  const config = VERDICT_CONFIG[verdict];
  const Icon = config.icon;

  return (
    <div
      role="status"
      aria-live="assertive"
      className={`w-full rounded-xl p-6 sm:p-8 ${config.classes}`}
    >
      <div className="flex items-center gap-4">
        <Icon className="h-16 w-16 shrink-0" strokeWidth={2.5} aria-hidden="true" />
        <div>
          <p className="text-display-lg leading-none font-extrabold tracking-tight">
            {config.label}
          </p>
          <p className="mt-2 text-body-lg font-semibold opacity-90">
            {config.sublabel}
          </p>
        </div>
      </div>

      {/* Kit size is the single most important thing a KIT-mode dispatch
          agent reads, so it renders larger than everything else on the
          panel when relevant. */}
      {mode === "kit" && size && verdict !== "REJECT" && (
        <div className="mt-6 rounded-lg bg-black/10 p-4 text-center">
          <p className="text-label-md uppercase tracking-widest opacity-80">
            Kit size
          </p>
          <p className="text-[72px] font-extrabold leading-none">{size}</p>
        </div>
      )}

      {shortCode && verdict !== "REJECT" && (
        <p className="mt-4 text-body-lg font-mono font-semibold">{shortCode}</p>
      )}

      {verdict === "ALREADY_USED" && (usedAt || usedBy) && (
        <div className="mt-4 rounded-lg bg-black/10 p-4">
          <p className="text-body-md font-semibold">
            {usedBy ? `Recorded by ${usedBy}` : "Already recorded"}
            {usedAt ? ` · ${formatTimestamp(usedAt)}` : ""}
          </p>
        </div>
      )}

      {verdict === "ALREADY_USED" && onOverride && (
        <button
          type="button"
          onClick={onOverride}
          disabled={overridePending}
          className="mt-4 min-h-[64px] w-full rounded-xl bg-on-tertiary-container text-body-lg font-bold uppercase tracking-wide text-tertiary-container transition-opacity active:scale-[0.98] disabled:opacity-60"
        >
          {overridePending ? "Recording override…" : "Override — allow anyway"}
        </button>
      )}
    </div>
  );
}
