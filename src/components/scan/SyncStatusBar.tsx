import { CloudOff, RefreshCw, CheckCircle2, CloudAlert, Clock } from "lucide-react";
import type { SyncState } from "../../services/ticketSync";

export interface SyncStatusBarProps {
  state: SyncState;
  onSyncNow?: () => void;
}

/**
 * Always-visible sync state — spec section 6 / T-F8: "Silent queues are how
 * scans get lost." An agent must be able to tell, at a glance, whether their
 * work is saved: fully synced, N scans still queued, actively syncing,
 * offline (queued locally, will send once reconnected), or erroring (queued,
 * retrying). Every state pairs a colour with an icon and a word, matching
 * VerdictPanel's outdoor-legibility rules — never colour alone.
 */
export function SyncStatusBar({ state, onSyncNow }: SyncStatusBarProps) {
  const { status, pendingCount } = state;

  const config = {
    offline: {
      icon: CloudOff,
      classes: "bg-surface-container-high text-on-surface-variant",
      label:
        pendingCount > 0
          ? `Offline — ${pendingCount} scan${pendingCount === 1 ? "" : "s"} saved, will sync`
          : "Offline — scans are saved locally",
    },
    syncing: {
      icon: RefreshCw,
      classes: "bg-info-container text-on-info-container",
      label: `Syncing ${pendingCount} scan${pendingCount === 1 ? "" : "s"}…`,
    },
    pending: {
      icon: Clock,
      classes: "bg-tertiary-container text-on-tertiary-container",
      label: `${pendingCount} scan${pendingCount === 1 ? "" : "s"} pending`,
    },
    error: {
      icon: CloudAlert,
      classes: "bg-error-container text-on-error-container",
      label: `${pendingCount} scan${pendingCount === 1 ? "" : "s"} pending — sync failed, retrying`,
    },
    synced: {
      icon: CheckCircle2,
      classes: "bg-success-container text-on-success-container",
      label: "All scans synced",
    },
  }[status];

  const Icon = config.icon;
  const spin = status === "syncing" ? "animate-spin" : "";

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-body-md font-semibold ${config.classes}`}
    >
      <span className="flex items-center gap-2">
        <Icon className={`h-5 w-5 shrink-0 ${spin}`} aria-hidden="true" />
        {config.label}
      </span>
      {onSyncNow && (status === "pending" || status === "error") && (
        <button
          type="button"
          onClick={onSyncNow}
          className="min-h-[36px] shrink-0 rounded-md bg-black/10 px-3 text-label-md font-bold uppercase tracking-wide"
        >
          Sync now
        </button>
      )}
    </div>
  );
}
