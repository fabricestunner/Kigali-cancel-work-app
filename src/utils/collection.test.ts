import { describe, it, expect } from "vitest";
import { collectionState, groupByPaymentRef } from "./collection";

type Row = { id: number; status: string; collected: boolean; payment_ref: string | null };
const row = (o: Partial<Row>): Row =>
  ({ id: 1, status: "paid", collected: false, payment_ref: "A", ...o });

describe("collectionState", () => {
  it("returns not-payable when no row is paid", () => {
    expect(collectionState([row({ status: "pending" })])).toEqual({ state: "not-payable", collected: 0, total: 1 });
  });
  it("returns awaiting when paid but none collected", () => {
    expect(collectionState([row({})])).toEqual({ state: "awaiting", collected: 0, total: 1 });
  });
  it("returns collected when every paid row is collected", () => {
    expect(collectionState([row({ collected: true })])).toEqual({ state: "collected", collected: 1, total: 1 });
  });
  it("returns partial when some are collected", () => {
    expect(collectionState([row({ collected: true }), row({ id: 2 })]))
      .toEqual({ state: "partial", collected: 1, total: 2 });
  });
  it("handles zero rows without throwing", () => {
    expect(collectionState([])).toEqual({ state: "awaiting", collected: 0, total: 0 });
  });
  it("ignores unpaid rows when counting a mixed group", () => {
    expect(collectionState([row({ collected: true }), row({ id: 2, status: "pending" })]))
      .toEqual({ state: "collected", collected: 1, total: 1 });
  });
});

describe("groupByPaymentRef", () => {
  it("groups rows sharing a reference", () => {
    const g = groupByPaymentRef([row({}), row({ id: 2 }), row({ id: 3, payment_ref: "B" })]);
    expect(Object.keys(g).sort()).toEqual(["A", "B"]);
    expect(g.A).toHaveLength(2);
  });
  it("groups rows with no reference under their own id", () => {
    const g = groupByPaymentRef([row({ id: 9, payment_ref: null })]);
    expect(Object.keys(g)).toEqual(["#9"]);
  });
});
