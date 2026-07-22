# Order Collection Tracking & Status Exports — Implementation Plan

> **For agentic workers:** implement task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** record which kits have been handed over, and export all orders as a single multi-sheet Excel workbook broken down by status.

**Spec:** `docs/superpowers/specs/2026-07-22-order-collection-design.md`

**Tech stack:** React 19, TypeScript 6, Vite 8, Tailwind 4, Vitest 3, `xlsx` (frontend); Express 5, Prisma 5, PostgreSQL (backend).

## Global constraints

- **`collected` is a separate boolean, never a value in `Order.status`.** Folding it into `status` destroys the payment state and with it the whole point of the feature.
- **Frontend first.** The UI is built against the contract below and ships with the toggle disabled behind a clear "requires backend" state, so it is reviewable before the API exists.
- **Do not run `prisma db push` or `prisma migrate`.** There are now four unpushed schema changes queued (`Stock.price`, donation fee columns, `User.role`, and these). They go in **one** reviewed migration, applied by a human against a fresh backup.
- Use the existing Tailwind semantic tokens (`primary`, `on-surface`, `surface-container`, `outline-variant`, `error`). No raw hex.
- `noUnusedLocals` is on in both repos — an unused import fails the build.
- Do not commit. The user reviews and commits.

## API contract (both sides build to this)

```
PATCH /api/payment/orders/:id/collected      admin only
body:     { "collected": true }
200:      the updated order row
409:      { "message": "Cannot mark a pending order collected" }   // unpaid
403/401:  not an admin / not authenticated
```

`Order` gains: `collected: boolean`, `collected_at: string | null`, `collected_by: string | null`.

---

# PHASE 1 — Frontend (build first)

### Task 1: Collection state logic [pure, tested]

**Files:** create `src/utils/collection.ts`, `src/utils/collection.test.ts`

**Interfaces:**
- Produces: `type CollectionState = "collected" | "partial" | "awaiting" | "not-payable"`; `isPayable(status: string): boolean`; `collectionState(rows: { status: string; collected: boolean; quantity: number }[]): { state: CollectionState; collectedUnits: number; totalUnits: number }`; `groupByPaymentRef<T extends { payment_ref: string | null; id: number }>(rows: T[]): Map<string, T[]>`.

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, it, expect } from "vitest";
import { collectionState, isPayable, groupByPaymentRef } from "./collection";

const row = (status: string, collected: boolean, quantity = 1) => ({ status, collected, quantity });

describe("isPayable", () => {
  it("treats paid and backorder as payable", () => {
    expect(isPayable("paid")).toBe(true);
    expect(isPayable("paid_backorder")).toBe(true);
  });

  it("treats everything else as not payable", () => {
    expect(isPayable("pending")).toBe(false);
    expect(isPayable("failed")).toBe(false);
    expect(isPayable("")).toBe(false);
  });
});

describe("collectionState", () => {
  it("reports not-payable when nothing in the group is paid", () => {
    expect(collectionState([row("pending", false, 2)]).state).toBe("not-payable");
  });

  it("reports awaiting when paid but nothing collected", () => {
    const r = collectionState([row("paid", false, 2), row("paid", false, 2)]);
    expect(r.state).toBe("awaiting");
    expect(r.collectedUnits).toBe(0);
    expect(r.totalUnits).toBe(4);
  });

  it("reports partial with unit counts", () => {
    const r = collectionState([row("paid", true, 2), row("paid", false, 2)]);
    expect(r.state).toBe("partial");
    expect(r.collectedUnits).toBe(2);
    expect(r.totalUnits).toBe(4);
  });

  it("reports collected when every payable row is collected", () => {
    const r = collectionState([row("paid", true, 2), row("paid_backorder", true, 1)]);
    expect(r.state).toBe("collected");
    expect(r.collectedUnits).toBe(3);
    expect(r.totalUnits).toBe(3);
  });

  it("ignores unpayable rows when judging completeness", () => {
    // A failed line sitting alongside collected paid lines must not hold the
    // group at "partial" forever — it was never collectable.
    const r = collectionState([row("paid", true, 2), row("failed", false, 1)]);
    expect(r.state).toBe("collected");
    expect(r.totalUnits).toBe(2);
  });

  it("handles an empty group without dividing by zero", () => {
    const r = collectionState([]);
    expect(r.state).toBe("not-payable");
    expect(r.totalUnits).toBe(0);
  });
});

describe("groupByPaymentRef", () => {
  it("groups rows sharing a reference", () => {
    const rows = [
      { id: 1, payment_ref: "ORG-a" },
      { id: 2, payment_ref: "ORG-a" },
      { id: 3, payment_ref: "ORG-b" },
    ];
    const g = groupByPaymentRef(rows);
    expect(g.get("ORG-a")).toHaveLength(2);
    expect(g.get("ORG-b")).toHaveLength(1);
  });

  it("keeps rows with no reference separate rather than merging them", () => {
    const rows = [
      { id: 1, payment_ref: null },
      { id: 2, payment_ref: null },
    ];
    const g = groupByPaymentRef(rows);
    expect(g.size).toBe(2);
  });
});
```

- [ ] **Step 2: Run to confirm failure**

Run: `npm test`
Expected: FAIL — cannot resolve `./collection`.

- [ ] **Step 3: Implement**

Create `src/utils/collection.ts`. Notes that the tests pin down:
- `isPayable` accepts `paid` and `paid_backorder` only.
- `collectionState` counts **units** (`quantity`), not rows, so "2/4" means kits.
- Rows that are not payable are excluded from both totals — a failed line must not hold a group at `partial` permanently.
- Empty input returns `not-payable` with zero totals; never divide by `totalUnits` without guarding.
- `groupByPaymentRef` must key rows with a null ref uniquely (e.g. by id) so unrelated orders never merge into one bogus group.

- [ ] **Step 4: Run to confirm pass**

Run: `npm test`
Expected: PASS — all 38 existing tests plus the new ones.

- [ ] **Step 5: Commit**

```bash
git add src/utils/collection.ts src/utils/collection.test.ts
git commit -m "feat: order collection state logic"
```

### Task 2: Multi-sheet workbook export [pure, tested]

**Files:** modify `src/utils/exportData.ts`; create `src/utils/sheetName.ts`, `src/utils/sheetName.test.ts`

**Interfaces:**
- Produces: `sanitiseSheetName(name: string, taken: Set<string>): string`; `exportWorkbook<T>(opts: { filename: string; sheets: { name: string; title: string; columns: ExportColumn<T>[]; rows: T[] }[] }): void`.

- [ ] **Step 1: Write the failing tests for sheet naming**

Excel rejects names over 31 characters or containing `[ ] : * ? / \`, and silently corrupts a workbook with duplicates. Create `src/utils/sheetName.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { sanitiseSheetName } from "./sheetName";

describe("sanitiseSheetName", () => {
  it("passes a clean name through", () => {
    expect(sanitiseSheetName("Paid", new Set())).toBe("Paid");
  });

  it("truncates to Excel's 31-character limit", () => {
    const out = sanitiseSheetName("A".repeat(50), new Set());
    expect(out).toHaveLength(31);
  });

  it("strips characters Excel forbids", () => {
    const out = sanitiseSheetName("Paid/Backorder:*?[x]", new Set());
    expect(out).not.toMatch(/[[\]:*?/\\]/);
  });

  it("de-duplicates against names already used", () => {
    const taken = new Set(["Paid"]);
    expect(sanitiseSheetName("Paid", taken)).not.toBe("Paid");
  });

  it("de-duplicates without exceeding the limit", () => {
    const taken = new Set(["A".repeat(31)]);
    const out = sanitiseSheetName("A".repeat(50), taken);
    expect(out.length).toBeLessThanOrEqual(31);
    expect(out).not.toBe("A".repeat(31));
  });

  it("never returns an empty name", () => {
    expect(sanitiseSheetName("///", new Set()).length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run to confirm failure**

Run: `npm test`
Expected: FAIL — cannot resolve `./sheetName`.

- [ ] **Step 3: Implement `sanitiseSheetName`**

Strip `[]:*?/\`, trim, truncate to 31, fall back to `"Sheet"` when empty, and on collision append a numeric suffix **while truncating the base further** so the result still fits 31 characters.

- [ ] **Step 4: Run to confirm pass**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Add `exportWorkbook` to `exportData.ts`**

Follow the existing `exportToExcel` structure exactly — same title row, generated-on line, blank row, header, body, same `!cols` widths and `!merges`. Differences:
- Loops over `sheets`, calling `XLSX.utils.book_append_sheet` per sheet with the sanitised name.
- A sheet with no rows still gets written, with a single `No records` row beneath the header. A missing tab reads as a bug; an empty one reads as an answer.
- One `XLSX.writeFile` at the end.

**Do not modify `exportToExcel` or `exportToPdf`** — volunteers and influencers depend on them.

- [ ] **Step 6: Commit**

```bash
git add src/utils/sheetName.ts src/utils/sheetName.test.ts src/utils/exportData.ts
git commit -m "feat: multi-sheet excel workbook export"
```

### Task 3: Order service and types

**Files:** modify `src/hooks/useDashboardData.ts` (the `Order` interface), create `src/services/order.service.ts`

- [ ] **Step 1: Extend the Order type**

Add `collected: boolean`, `collected_at: string | null`, `collected_by: string | null` to the `Order` interface in `useDashboardData.ts`.

Note the known type drift: `Order` is declared there *and* separately in `src/types/index.ts` under the same name for an unrelated localStorage shape. Do not confuse them — the dashboard one is the API shape.

- [ ] **Step 2: Add the service call**

```ts
export async function setOrderCollected(id: number, collected: boolean): Promise<Order> {
  const res = await api.patch<Order>(`/payment/orders/${id}/collected`, { collected });
  return res.data;
}
```

Type the response explicitly; no `any`.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useDashboardData.ts src/services/order.service.ts
git commit -m "feat: order collected service call and types"
```

### Task 4: Collection column and toggle

**Files:** modify `src/pages/DashboardOrdersPage.tsx`; create `src/components/dashboard/CollectionToggle.tsx`, `src/components/dashboard/CollectionBadge.tsx`

- [ ] **Step 1: Build the badge**

`CollectionBadge` renders the four states from `collectionState()`:
- `collected` — green, "Collected"
- `partial` — amber, "Partial (2/4)"
- `awaiting` — neutral, "Awaiting collection"
- `not-payable` — muted, "Not payable"

Colour is never the only signal; each carries text.

- [ ] **Step 2: Build the toggle**

`CollectionToggle` takes `{ order, onToggle, disabled, disabledReason }`. When the order is not payable it renders **disabled with the reason visible** — never a silent no-op. A volunteer clicking a dead control assumes it worked.

Include an in-flight state so a double-click cannot fire two PATCHes.

- [ ] **Step 3: Wire into the orders table**

Add a Collected column. Keep the existing grouping by `payment_ref` and show the roll-up badge on the group header row, with per-row toggles beneath.

Optimistic update on toggle, reverting on failure with an inline error — not `alert()`. (The page currently uses `alert()` at line ~108; do not add more.)

- [ ] **Step 4: Add the collection filter**

Alongside the existing status filter: All / Awaiting collection / Collected. "Show me everyone still waiting" is the event-day view and should be one click.

- [ ] **Step 5: Backend-absent state**

The endpoint does not exist yet. If the PATCH returns 404, show a clear inline notice ("Collection tracking needs the backend update") and revert the optimistic change. Do not fake success.

- [ ] **Step 6: Verify**

Run `npm run dev`, open `/dashboard/orders`.
Expected: the column renders, badges show correct roll-ups, unpayable rows are visibly disabled with a reason, and toggling shows the backend-absent notice rather than a false success.

- [ ] **Step 7: Commit**

```bash
git add src/pages/DashboardOrdersPage.tsx src/components/dashboard/CollectionToggle.tsx src/components/dashboard/CollectionBadge.tsx
git commit -m "feat: collection tracking column on orders dashboard"
```

### Task 5: Wire the workbook export

**Files:** modify `src/pages/DashboardOrdersPage.tsx`

- [ ] **Step 1: Build the sheet definitions**

Sheets per the spec: Summary, Paid, Collected, Awaiting collection, Backorder, Pending, Failed.

Columns for order sheets: reference, customer name, email, phone, size/item, quantity, amount, currency, status, collected, collected at, delivery option, location, buddy group, created at.

Summary: one row per status with count and revenue total, plus collected and awaiting counts. Sum only same-currency amounts — orders are RWF, but do not hardcode the assumption silently; label the column with the currency.

- [ ] **Step 2: Add the export button**

Reuse `ExportMenu` if its shape fits; otherwise a plain button. Export **all** orders, not just the filtered view — the workbook is the whole picture by design.

- [ ] **Step 3: Verify**

Download the file and open it. Confirm: every tab exists, empty tabs say "No records", numbers on Summary match the tab row counts, and no tab name is truncated oddly or duplicated.

- [ ] **Step 4: Commit**

```bash
git add src/pages/DashboardOrdersPage.tsx
git commit -m "feat: multi-sheet order export by status"
```

---

# PHASE 2 — Backend

### Task 6: Schema

**Files:** modify `backend/prisma/schema.prisma`

- [ ] Add to `model Order`:

```prisma
  collected     Boolean   @default(false)
  collected_at  DateTime?
  collected_by  String?

  collected_by_user User? @relation("CollectedBy", fields: [collected_by], references: [id])

  @@index([collected])
```

and the back-relation `collected_orders Order[] @relation("CollectedBy")` on `User`.

- [ ] **Do not push.** Add to the queued migration alongside `Stock.price`, the donation fee columns, and `User.role`. All four go in one reviewed migration against a fresh backup.

### Task 7: Endpoint

**Files:** modify `backend/src/controllers/payment.controller.ts`, `backend/src/routes/payment.routes.ts`

- [ ] **Step 1: Controller**

`setOrderCollected`: validate `id` is an integer and `collected` is a boolean (reject anything else with 400 — do not coerce; `"false"` is truthy).

Load the order. If `!isPayable(order.status)` return **409** with a message naming the actual status. Only `paid` and `paid_backorder` qualify.

On `true`: set `collected`, `collected_at: new Date()`, `collected_by: req.userId`.
On `false`: set `collected: false` and **null both** `collected_at` and `collected_by` — a stale stamp on an un-collected order is worse than none.

Return the updated row.

- [ ] **Step 2: Route**

```ts
router.patch("/orders/:id/collected", requireRole("admin"), setOrderCollected);
```

Place it inside the authenticated section. Add the swagger block with `security: - bearerAuth: []`.

- [ ] **Step 3: Verify**

`npx tsc --noEmit` → 0 errors. Then, once the migration is applied, confirm with curl that a `pending` order returns 409 and a `paid` order returns the updated row.

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma src/controllers/payment.controller.ts src/routes/payment.routes.ts
git commit -m "feat: mark order kits collected"
```

---

# Sequencing

| Order | Work | Gate |
|---|---|---|
| 1 | Tasks 1, 2 — pure logic + tests | None. Fully parallel. |
| 2 | Task 3 — types and service | None. Parallel with 1 and 2. |
| 3 | Task 4 — UI column | Needs Tasks 1 and 3 |
| 4 | Task 5 — export wiring | Needs Tasks 1 and 2 |
| 5 | Tasks 6, 7 — backend | Independent of all frontend work |
| 6 | Apply the combined migration | **Human only.** Fresh backup first. |

**Definition of done:** the orders dashboard shows accurate per-customer collection roll-ups; an unpaid order cannot be marked collected from either the UI or the API; the workbook downloads with every tab present and Summary counts matching the tabs; `npm run build`, `npm test` and `npm run lint` pass in the frontend; `tsc --noEmit` passes in the backend.
