# Order Collection Tracking & Status Exports — Design Spec

**Date:** 2026-07-22
**Status:** approved for planning

## 1. Goal

Let staff record which kits have actually been handed over, and produce a single Excel workbook covering every order broken down by status — so the client can answer "who has paid but not collected?" without reading the database.

## 2. Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Relationship to QR ticketing | **Manual now, derived later** | Usable immediately with no scanner. When ticketing ships, per-ticket scans become the source of truth and the order flag is derived from them. |
| Granularity | **Per `Order` row (per size)** | The backend creates one row per cart line, so per-row tracking records partial collection honestly. |
| Data model | **Separate boolean, NOT a status value** | See below. |
| Export shape | **One workbook, one sheet per status** | A single file to hand to the client or an accountant. |

### Collected is a dimension, not a status

`collected` must **not** be a new value in `Order.status`. An order is *paid* **and** *collected*. Folding collection into `status` would overwrite the payment state, destroying the ability to answer the exact question this feature exists for: who has paid but not picked up.

```
status:    pending | paid | paid_backorder | failed     (payment lifecycle)
collected: false | true                                 (fulfilment)
```

## 3. Data model

Three new columns on `Order`:

| Field | Type | Notes |
|---|---|---|
| `collected` | `Boolean @default(false)` | |
| `collected_at` | `DateTime?` | stamped on transition to true, cleared on false |
| `collected_by` | `String?` | FK to `User.id`; a disputed pickup needs an audit trail |

Add `@@index([collected])` — the "awaiting collection" query runs constantly on event day.

## 4. Backend endpoint

`PATCH /api/payment/orders/:id/collected` — **admin only**, body `{ collected: boolean }`.

**It must refuse to mark an unpaid order collected.** Only `paid` and `paid_backorder` qualify; anything else returns `409` with a message naming the current status. Handing over a kit for a `pending` order means giving away stock nobody paid for, and that is precisely the mistake a tired volunteer makes at a busy pickup table — the API is the right place to make it impossible.

`paid_backorder` **is** allowed: those customers paid, the kit was simply short at the time.

Un-ticking is permitted (mistakes happen) and clears both `collected_at` and `collected_by`.

Response returns the updated order so the client can reconcile without a refetch.

## 5. Frontend

### Orders dashboard

A **Collected** column with a per-row toggle. Rows remain grouped by `payment_ref` with a roll-up per customer:

```
Jean Uwase   ORG-8f2a
  2 × Medium   [✓] collected 14 Aug
  2 × Large    [ ]
  → Partial (2/4)
```

States: **Collected**, **Partial (n/m)**, **Awaiting collection**, and **Not payable** (unpaid — toggle disabled with the reason shown, never a silent no-op).

A filter for collection state sits alongside the existing status filter, because "show me everyone still waiting" is the event-day view.

### Export

`exportData.ts` currently writes one sheet per file. Add `exportWorkbook()` taking multiple named sheets; leave `exportToExcel` untouched — volunteers and influencers still use it.

Workbook contents:

| Sheet | Rows |
|---|---|
| Summary | counts and revenue per status, plus collected / awaiting totals |
| Paid | `status = paid` |
| Collected | paid **and** `collected = true` |
| Awaiting collection | paid **and** `collected = false` — the list staff print |
| Backorder | `paid_backorder` |
| Pending | `pending` |
| Failed | `failed` |

Excel sheet names are capped at 31 characters and cannot contain `[]:*?/\` — the helper must sanitise, and must not emit two sheets with the same name.

Empty sheets are still written, with a "No records" row. A missing tab reads as a bug; an empty one reads as an answer.

## 6. Forward-compatibility with ticketing

The approved ticketing design (`2026-07-21-ticketing-design.md`) tracks `kit_collected` **per ticket**. When that ships:

- Per-ticket scans become the source of truth.
- `Order.collected` is **derived** — true when every ticket for that row is collected.
- The manual toggle is retained as an override for when no scanner is available.

**Whoever implements ticketing must not create a second competing flag.** Two systems answering "was this collected?" will drift, and the disagreement surfaces at the pickup tent with a queue waiting.

## 7. Out of scope

- Partial collection *within* a row (3 of 4 mediums). The row is the unit; splitting further is what tickets are for.
- PDF export of the multi-sheet workbook. The existing single-view PDF export stays.
- Notifying customers that their kit is ready.

## 8. Testing

Pure logic gets Vitest coverage on the existing harness:

- `collectionState(rows)` → `collected` / `partial` / `awaiting` / `not-payable`, including the mixed-status and zero-row cases.
- Sheet-name sanitisation: over-31-character names, illegal characters, duplicate collision.
- Grouping orders by `payment_ref`.

Toggle behaviour and the download itself need manual verification.
