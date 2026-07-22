import { useState, type FormEvent } from "react";
import { Keyboard } from "lucide-react";
import { Button } from "../ui";

export interface ManualEntryProps {
  onSubmit: (code: string) => void;
  disabled?: boolean;
}

/**
 * The fallback path when a camera will not focus, a screen is cracked, or
 * the QR is physically damaged. Per the spec this is NOT optional — it is
 * the single most valuable resilience feature in the whole design, so it
 * stays visible at all times rather than hidden behind a "having trouble?"
 * link.
 */
export function ManualEntry({ onSubmit, disabled }: ManualEntryProps) {
  const [code, setCode] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    onSubmit(trimmed);
    setCode("");
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <label
        htmlFor="manual-short-code"
        className="mb-2 flex items-center gap-2 text-label-md font-semibold uppercase tracking-widest text-on-surface-variant"
      >
        <Keyboard className="h-5 w-5" aria-hidden="true" />
        Short code
      </label>
      <div className="flex gap-2">
        <input
          id="manual-short-code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="T-4417"
          inputMode="text"
          autoComplete="off"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          disabled={disabled}
          className="min-h-[64px] flex-1 rounded-xl border-2 border-outline-variant bg-surface-container-lowest px-4 text-headline-md font-bold uppercase tracking-wider text-on-surface focus:border-primary focus:outline-none disabled:opacity-50"
        />
        <Button
          type="submit"
          disabled={disabled || code.trim().length === 0}
          className="min-h-[64px] !px-6"
        >
          Check
        </Button>
      </div>
    </form>
  );
}
