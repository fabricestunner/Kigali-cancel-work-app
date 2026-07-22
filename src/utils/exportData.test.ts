import { describe, it, expect } from "vitest";
import { sanitizeSheetName, dedupeSheetNames } from "./exportData";

describe("sanitizeSheetName", () => {
  it("passes short, legal names through unchanged", () => {
    expect(sanitizeSheetName("Paid")).toBe("Paid");
  });

  it("truncates names over the 31-character Excel limit", () => {
    const long = "Awaiting Collection For Everyone Ever"; // 38 chars
    const result = sanitizeSheetName(long);
    expect(result.length).toBeLessThanOrEqual(31);
    expect(result).toBe(long.slice(0, 31));
  });

  it("strips each character illegal in Excel sheet names", () => {
    expect(sanitizeSheetName("A[b")).toBe("Ab");
    expect(sanitizeSheetName("A]b")).toBe("Ab");
    expect(sanitizeSheetName("A:b")).toBe("Ab");
    expect(sanitizeSheetName("A*b")).toBe("Ab");
    expect(sanitizeSheetName("A?b")).toBe("Ab");
    expect(sanitizeSheetName("A/b")).toBe("Ab");
    expect(sanitizeSheetName("A\\b")).toBe("Ab");
  });

  it("strips all illegal characters at once", () => {
    expect(sanitizeSheetName("Q1: Orders [Paid]/*Final*?")).toBe(
      "Q1 Orders PaidFinal",
    );
  });

  it("falls back to a placeholder when nothing legal remains", () => {
    expect(sanitizeSheetName("[]:*?/\\")).toBe("Sheet");
  });
});

describe("dedupeSheetNames", () => {
  it("leaves already-unique names untouched", () => {
    expect(dedupeSheetNames(["Paid", "Pending", "Failed"])).toEqual([
      "Paid",
      "Pending",
      "Failed",
    ]);
  });

  it("de-duplicates identical names deterministically", () => {
    const result = dedupeSheetNames(["Orders", "Orders", "Orders"]);
    expect(result).toEqual(["Orders", "Orders (2)", "Orders (3)"]);
    // Determinism: same input always yields the same output.
    expect(dedupeSheetNames(["Orders", "Orders", "Orders"])).toEqual(result);
  });

  it("de-duplicates names that only collide after sanitisation/truncation", () => {
    const a = "Awaiting Collection: Kit Pickup A"; // sanitises + truncates
    const b = "Awaiting Collection: Kit Pickup B"; // to the same 31 chars
    const result = dedupeSheetNames([a, b]);
    expect(result[0]).not.toBe(result[1]);
    expect(result.every((n) => n.length <= 31)).toBe(true);
  });

  it("keeps de-duplicated names within the 31-character limit", () => {
    const longDupe = "This Sheet Name Is Definitely Over The Limit";
    const result = dedupeSheetNames([longDupe, longDupe, longDupe]);
    expect(new Set(result).size).toBe(3);
    for (const name of result) {
      expect(name.length).toBeLessThanOrEqual(31);
    }
  });
});
