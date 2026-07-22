import { Package, DoorOpen } from "lucide-react";
import type { ScanMode } from "../../utils/scanVerdict";

export interface ModeToggleProps {
  mode: ScanMode;
  onChange: (mode: ScanMode) => void;
}

/**
 * The single most consequential control on the page: an agent scanning
 * fifty people in the wrong mode is the worst realistic failure of this
 * whole feature. It is therefore a persistent, always-visible, full-width
 * header — never a small settings toggle — and the active mode is shown
 * with colour, a large label, AND an icon so it survives glare.
 *
 * The caller is responsible for persisting `mode` (see ScanPage), so a
 * reload cannot silently flip an agent from ENTRY back to KIT PICKUP.
 */
export function ModeToggle({ mode, onChange }: ModeToggleProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Scan mode"
      className="grid grid-cols-2 gap-2 rounded-xl bg-surface-container-high p-2"
    >
      <button
        type="button"
        role="radio"
        aria-checked={mode === "kit"}
        onClick={() => onChange("kit")}
        className={`flex min-h-[72px] flex-col items-center justify-center gap-1 rounded-lg text-label-md font-bold uppercase tracking-widest transition-colors ${
          mode === "kit"
            ? "bg-primary text-on-primary shadow-lg"
            : "bg-transparent text-on-surface-variant"
        }`}
      >
        <Package className="h-7 w-7" aria-hidden="true" />
        Kit pickup
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={mode === "entry"}
        onClick={() => onChange("entry")}
        className={`flex min-h-[72px] flex-col items-center justify-center gap-1 rounded-lg text-label-md font-bold uppercase tracking-widest transition-colors ${
          mode === "entry"
            ? "bg-primary text-on-primary shadow-lg"
            : "bg-transparent text-on-surface-variant"
        }`}
      >
        <DoorOpen className="h-7 w-7" aria-hidden="true" />
        Entry
      </button>
    </div>
  );
}
