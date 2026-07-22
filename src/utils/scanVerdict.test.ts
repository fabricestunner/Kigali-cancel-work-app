import { describe, it, expect } from "vitest";
import { scanVerdict } from "./scanVerdict";
import type { TicketState } from "./scanVerdict";

const payload = { tid: 4417, oid: 1043, sz: "M", ev: "kcw2026", iat: 1 };
const fresh: TicketState = { id: 4417, kit_collected: false, checked_in: false };

describe("scanVerdict", () => {
  // --- REJECT: verification failure outranks everything, in both modes ---
  it("rejects when the token failed verification (entry mode)", () => {
    expect(scanVerdict(null, fresh, "entry").verdict).toBe("REJECT");
  });

  it("rejects when the token failed verification (kit mode)", () => {
    expect(scanVerdict(null, fresh, "kit").verdict).toBe("REJECT");
  });

  it("rejects an unverified token even when the manifest knows it", () => {
    expect(scanVerdict(null, fresh, "kit").verdict).toBe("REJECT");
  });

  it("rejects an unverified token even when the manifest has no entry at all", () => {
    expect(scanVerdict(null, undefined, "entry").verdict).toBe("REJECT");
    expect(scanVerdict(null, undefined, "kit").verdict).toBe("REJECT");
  });

  // --- ALLOW: unused ticket, both modes ---
  it("allows an unused ticket in entry mode", () => {
    expect(scanVerdict(payload, fresh, "entry").verdict).toBe("ALLOW");
  });

  it("allows an unused ticket in kit mode", () => {
    expect(scanVerdict(payload, fresh, "kit").verdict).toBe("ALLOW");
  });

  // --- ALREADY_USED: used in the matching mode, both modes ---
  it("flags a ticket already entered, in entry mode", () => {
    const used: TicketState = {
      ...fresh, checked_in: true,
      checked_in_at: "2026-08-09T06:12:03Z", checked_in_by: "Eric",
    };
    const r = scanVerdict(payload, used, "entry");
    expect(r.verdict).toBe("ALREADY_USED");
    expect(r.usedAt).toBe("2026-08-09T06:12:03Z");
    expect(r.usedBy).toBe("Eric");
  });

  it("flags a ticket already collected, in kit mode", () => {
    const used: TicketState = {
      ...fresh, kit_collected: true,
      kit_collected_at: "2026-08-09T05:00:00Z", kit_collected_by: "Alice",
    };
    const r = scanVerdict(payload, used, "kit");
    expect(r.verdict).toBe("ALREADY_USED");
    expect(r.usedAt).toBe("2026-08-09T05:00:00Z");
    expect(r.usedBy).toBe("Alice");
  });

  // --- Independence of the two stages ---
  it("treats the two stages as independent", () => {
    const collected: TicketState = { ...fresh, kit_collected: true };
    expect(scanVerdict(payload, collected, "entry").verdict).toBe("ALLOW");

    const entered: TicketState = { ...fresh, checked_in: true };
    expect(scanVerdict(payload, entered, "kit").verdict).toBe("ALLOW");
  });

  it("flags ALREADY_USED in entry mode even when kit_collected is also true", () => {
    const both: TicketState = { ...fresh, kit_collected: true, checked_in: true };
    expect(scanVerdict(payload, both, "entry").verdict).toBe("ALREADY_USED");
  });

  it("flags ALREADY_USED in kit mode even when checked_in is also true", () => {
    const both: TicketState = { ...fresh, kit_collected: true, checked_in: true };
    expect(scanVerdict(payload, both, "kit").verdict).toBe("ALREADY_USED");
  });

  // --- ALLOW_UNKNOWN: valid ticket missing from the manifest, both modes ---
  it("allows a valid ticket missing from the manifest, in entry mode", () => {
    expect(scanVerdict(payload, undefined, "entry").verdict).toBe("ALLOW_UNKNOWN");
  });

  it("allows a valid ticket missing from the manifest, in kit mode", () => {
    expect(scanVerdict(payload, undefined, "kit").verdict).toBe("ALLOW_UNKNOWN");
  });

  it("does not surface usedAt/usedBy for ALLOW_UNKNOWN", () => {
    const r = scanVerdict(payload, undefined, "entry");
    expect(r.usedAt).toBeUndefined();
    expect(r.usedBy).toBeUndefined();
  });

  it("does not surface usedAt/usedBy for a plain ALLOW", () => {
    const r = scanVerdict(payload, fresh, "kit");
    expect(r.usedAt).toBeUndefined();
    expect(r.usedBy).toBeUndefined();
  });
});
