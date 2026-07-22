# QR Ticketing — Design Spec

**Date:** 2026-07-21
**Status:** approved for planning
**Context:** Kigali Cancer Walk 2026. Backend is a remote service (`https://kcw.enjoyrwanda.rw/api`) whose source is not in this repo; roughly 70% of this feature is backend work.

---

## 1. Goal

Every kit purchased becomes a marathon ticket. Each ticket carries a QR code, delivered by email after payment. Agents scan that QR twice over the ticket's life: once to dispatch the kit (before or on event day) and once to admit the holder at the gate.

## 2. Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Ticket granularity | One ticket per kit unit, **unnamed bearer tokens** | An order of 4 kits yields 4 independent QRs the buyer forwards. No new checkout fields. |
| Scan model | **Two independent stages**: `kit_collected`, `checked_in` | Kits may be collected before event day; a single-use ticket would lock those buyers out of entry. |
| Connectivity | **Offline-capable** scanner | Mobile networks at mass gatherings are unreliable. Scanning must not stop when signal does. |
| Token format | **Signed token + synced manifest** | Signature proves authenticity offline even for tickets bought after the manifest download; the manifest supplies used/unused state. |
| Signing | **Asymmetric (Ed25519)** | The scanner is public JavaScript. Only the public key may ship. |
| Agent access | **Dedicated `scanner` role** | Gate volunteers on personal phones must not hold donor or revenue data. |
| Buddy groups | **Bulk collect, individual entry** | One action dispatches a group's kits; each person still scans to enter. |

### Confirmed assumptions

- A redeemed free kit ("buy 4, get 1 free") **does** receive a ticket.
- Donations **do not** grant entry. Donors get a ticket only if they also buy a kit.

### Accepted limitation

Two agents scanning offline at different gates can each admit the **same** forwarded QR once; the conflict surfaces only at sync. This is inherent to offline validation. Mitigations: sync whenever signal allows, prefer a single entry gate, and produce a duplicate-scan reconciliation report afterwards. Closing the gap entirely would require online-only scanning, which was rejected.

---

## 3. Token format

QR payload. **Corrected 2026-07-21:** an earlier draft of this spec claimed a ~120-character target. That is unachievable and the claim was wrong. An Ed25519 signature is 64 bytes = 86 base64url characters, the prefix and dots are 7, and the compact payload is ~74, giving a **178-character floor** — verified empirically against Node's native Ed25519. At error-correction level M this is a QR version 9 (53×53 modules), which scans reliably at 440px. Treat ~180 as the real target. Do not "optimise" the payload below it by dropping fields: `src/utils/ticketToken.ts` requires all five, and shortening them breaks every ticket.

```
KCW1.<base64url(payload)>.<base64url(signature)>
```

`payload` is compact JSON:

```json
{ "tid": 4417, "oid": 1043, "sz": "M", "ev": "kcw2026", "iat": 1755123456 }
```

| Field | Meaning |
|---|---|
| `tid` | ticket id (primary key) |
| `oid` | order id |
| `sz` | kit size, shown to the dispatch agent |
| `ev` | event id, so tickets from a future event never validate against this one |
| `iat` | issued-at, unix seconds |

`signature` is Ed25519 over the exact base64url payload string. The `KCW1.` prefix is a format version, so the scheme can change without ambiguity.

**Every ticket also carries a human-readable short code** (`T-4417`), printed under the QR in the email and enterable by hand in the scanner. This is the fallback when a camera will not focus, a screen is cracked, or the QR is damaged. It is not optional — it is the single most valuable resilience feature in this design.

### Key handling

- Private key: backend only. Never in any frontend bundle, `VITE_*` variable, or repo.
- Public key: shipped to the scanner via `VITE_TICKET_PUBLIC_KEY`. Public by design and safe to expose.
- Key rotation invalidates all outstanding tickets, so it must not happen between issuance and the event.

---

## 4. Ticket lifecycle

Tickets are created **when payment is confirmed**, never at order creation — otherwise abandoned checkouts mint valid tickets.

```
payment confirmed
  └─ create N tickets (N = total kit quantity on the order)
       ├─ sign each token
       ├─ render QR PNG
       └─ send Email #2 (event details + all QRs + short codes)
```

State per ticket:

| Field | Type |
|---|---|
| `id` | int |
| `order_id` | int |
| `size` | string |
| `short_code` | string, unique |
| `kit_collected` | bool |
| `kit_collected_at` | timestamp, nullable |
| `kit_collected_by` | agent id, nullable |
| `checked_in` | bool |
| `checked_in_at` | timestamp, nullable |
| `checked_in_by` | agent id, nullable |

The two stages are independent. Neither is a precondition for the other: someone may enter without having collected a kit, or collect without entering.

---

## 5. Scan verdicts

The scanner is always in one of two modes, chosen before scanning: **KIT PICKUP** or **ENTRY**.

| Situation | Verdict | Agent sees |
|---|---|---|
| Signature valid, unused in this mode | `ALLOW` | Green. Size, short code. Stamp applied. |
| Signature valid, already used in this mode | `ALREADY_USED` | Amber. When, and by which agent. |
| Signature valid, ticket not in manifest | `ALLOW_UNKNOWN` | Blue. "Valid — recent purchase." Allowed, queued. |
| Signature invalid, malformed, or wrong event | `REJECT` | Red. "Not a valid ticket." |

`ALLOW_UNKNOWN` is the entire reason for the signed-token design: a customer who buys the evening before, after the agent's manifest download, still gets in.

`ALREADY_USED` **warns but does not hard-block** — the agent retains discretion, since a legitimate re-scan (agent error, screen re-shown) is more common than fraud. Every override is recorded.

---

## 6. Offline behaviour

**Manifest.** On login with signal, the scanner downloads all tickets for the event and stores them in IndexedDB: `id`, `short_code`, `size`, both state flags, timestamps. For an event of a few thousand tickets this is a small payload.

**Scanning.** Fully local: decode → verify signature with the public key → look up state in IndexedDB → apply mode → write the new state locally → append to an outbound queue.

**Queue.** Each entry: `{ client_scan_id (uuid), ticket_id, mode, scanned_at, agent_id, overridden }`. The `client_scan_id` makes replay idempotent, so a flaky connection cannot double-count.

**Sync.** When online, the queue batch-POSTs. The server is the source of truth and returns authoritative state, which overwrites local. Conflicts (server already recorded that stage by another agent at an earlier time) are recorded as duplicate-scan events for the reconciliation report rather than silently dropped.

**App shell** is a service worker PWA so the scanner loads with no network at all.

---

## 7. API contract (backend)

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/ticket/manifest?event=kcw2026` | Full ticket list for offline use. Scanner role. |
| `POST` | `/ticket/scan` | Batch of queued scans. Idempotent on `client_scan_id`. Returns authoritative state per ticket. |
| `GET` | `/ticket/lookup?code=T-4417` | Manual short-code lookup when online. |
| `GET` | `/ticket?order_id=` | Admin: tickets for an order. |
| `POST` | `/ticket/group-collect` | Bulk-mark a buddy group's kits collected. |
| `POST` | `/auth/login` | Existing. Must now return a `role` field. |

`POST /ticket/scan` request:

```json
{ "scans": [
  { "client_scan_id": "uuid", "ticket_id": 4417, "mode": "entry",
    "scanned_at": "2026-08-09T06:12:03Z", "overridden": false }
] }
```

Response returns, per scan, the accepted state and a `conflict` flag where the stage was already recorded by a different agent.

**Backend must also:** add the `scanner` role and restrict it to the ticket endpoints only; issue tickets on payment confirmation; send Email #2; and generate QR PNGs (a capability that already exists — `/free-kit/redeem` returns a `qr` PNG data URL today).

---

## 8. Frontend scope

**New:**
- `/scan` — scanner PWA, scanner-role only. Mode toggle, camera view, verdict panel, manual short-code entry, sync status, session scan count.
- `src/utils/ticketToken.ts` — decode and Ed25519-verify. Pure, unit-tested.
- `src/utils/scanVerdict.ts` — `canScan(ticket, mode) → verdict`. Pure, unit-tested.
- `src/services/ticketDb.ts` — IndexedDB manifest and queue.
- `src/services/ticket.service.ts` — API calls.
- `/dashboard/tickets` — admin: search by short code, per-order tickets, collected/entered counts, duplicate-scan report.

**Modified:** `OrderSuccessPage` gains a "your tickets are on their way by email" note; `App.tsx` routes; `ProtectedRoute` becomes role-aware.

**Dependencies:** a QR decoding library (`@zxing/browser`, with the native `BarcodeDetector` API as a fast path where available), `@noble/ed25519` for verification, `idb` for IndexedDB, and `vite-plugin-pwa` for the service worker. All are small; the scanner route must be lazy-loaded so none of this reaches ordinary visitors.

---

## 9. Build order

**Phase 1 — online scanner.** Full UI, real camera, live API calls, no offline. Ships early and gets into agents' hands for real-world testing.

**Phase 2 — offline.** IndexedDB manifest, queue, sync, service worker.

**Phase 3 — admin views.** Ticket search, counts, reconciliation report.

Building online-first is deliberate. The end state is identical, but offline sync is where subtle bugs hide, and debugging a scanner and its sync layer simultaneously the week before the event is how launches fail.

---

## 10. Testing

Pure functions carry the test burden, on the Vitest harness already in the repo:

- **Token:** valid signature passes; tampered payload fails; wrong event fails; malformed input fails; expired format version fails.
- **Verdict machine:** every cell of the verdict table, in both modes.
- **Queue reconciliation:** replay is idempotent; server state wins; conflicts are recorded not dropped.

Camera capture and PWA install need manual testing on real Android and iOS devices in daylight.

---

## 11. Prerequisites

1. **The open API authentication breach (`docs/BACKEND-REQUIREMENTS.md` B1) must be closed first.** Adding a scanner role to a backend that currently authenticates nothing achieves nothing.
2. The backend must confirm the Ed25519 signing scheme and publish the public key.
3. CORS (B2) must be fixed or the scanner cannot be tested from any deployed origin.
