import type { TicketPayload } from "./ticketToken";

/**
 * The scanner is always in exactly one of these modes, chosen before
 * scanning starts. Spec: docs/superpowers/specs/2026-07-21-ticketing-design.md
 * section 5.
 */
export type ScanMode = "kit" | "entry";

export type Verdict = "ALLOW" | "ALREADY_USED" | "ALLOW_UNKNOWN" | "REJECT";

/**
 * Local (manifest/IndexedDB) view of a ticket's two independent stages.
 * Neither stage is a precondition for the other.
 */
export interface TicketState {
  id: number;
  kit_collected: boolean;
  kit_collected_at?: string;
  kit_collected_by?: string;
  checked_in: boolean;
  checked_in_at?: string;
  checked_in_by?: string;
}

export interface ScanVerdictResult {
  verdict: Verdict;
  usedAt?: string;
  usedBy?: string;
}

/**
 * Pure verdict state machine — no I/O, no network. Order of checks matters:
 *
 *   1. A token that failed signature verification (`payload === null`) is
 *      REJECT regardless of anything the manifest knows about the ticket id
 *      it claims — an attacker can forge a payload with any `tid` they like.
 *   2. A verified ticket absent from the local manifest is ALLOW_UNKNOWN —
 *      this is the entire reason for the signed-token design: a purchase
 *      made after the agent's manifest download must still get in.
 *   3. Otherwise, apply the mode-appropriate flag: already flagged for this
 *      mode is ALREADY_USED (with who/when), unflagged is ALLOW.
 */
export function scanVerdict(
  payload: TicketPayload | null,
  known: TicketState | undefined,
  mode: ScanMode,
): ScanVerdictResult {
  if (!payload) {
    return { verdict: "REJECT" };
  }

  if (!known) {
    return { verdict: "ALLOW_UNKNOWN" };
  }

  const used = mode === "kit" ? known.kit_collected : known.checked_in;
  if (used) {
    return {
      verdict: "ALREADY_USED",
      usedAt: mode === "kit" ? known.kit_collected_at : known.checked_in_at,
      usedBy: mode === "kit" ? known.kit_collected_by : known.checked_in_by,
    };
  }

  return { verdict: "ALLOW" };
}
