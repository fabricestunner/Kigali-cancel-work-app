# Backend Requirements — Launch Blockers

**Audience:** owner of the API at `https://kcw.enjoyrwanda.rw/api`
**Raised:** 2026-07-21
**Context:** the Kigali Cancer Walk 2026 frontend is being prepared for public launch. The items below cannot be fixed from the frontend. B1 and B2 block launch entirely.

Each item has a `curl` acceptance test. The frontend team will re-run these to confirm the fix.

---

## B1. Authentication on admin read endpoints — **ACTIVE DATA BREACH**

Verified 2026-07-21. These endpoints return **HTTP 200 with full records** when called with **no `Authorization` header at all**, and also when called with a deliberately invalid token (`Authorization: Bearer bogus`):

| Endpoint | Records returned |
|---|---|
| `GET /payment/orders` | 41 |
| `GET /volunteer` | 38 |
| `GET /donation` | 25 |
| `GET /influencer` | 11 |
| `GET /sponsor` | 0 |
| `GET /donation/stats` | — |

Fields currently readable by anyone on the internet include:

- `/payment/orders` — `full_name`, `email`, `phone_number`, `amount_paid`, `currency`, `payment_ref`, `location`, `delivery_option`
- `/donation` — `full_name`, `email`, `phone`, `amount`, `total_amount`, `payment_ref`, `anonymous`

Note the `anonymous` flag on donations: **donors who explicitly asked to remain anonymous currently have their names publicly readable.**

### Required

Every endpoint above must return `401` without a valid bearer token. The frontend already sends `Authorization: Bearer <token>` on every request (`src/services/api.ts`), so **no frontend change is needed** — this is purely server-side.

### Acceptance test

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://kcw.enjoyrwanda.rw/api/donation
# must print 401

curl -s -o /dev/null -w "%{http_code}\n" -H "Authorization: Bearer bogus" \
  https://kcw.enjoyrwanda.rw/api/donation
# must print 401
```

Repeat for `/payment/orders`, `/volunteer`, `/influencer`, `/sponsor`, `/donation/stats`.

### Escalation

This is exposure of personal data belonging to real donors and buyers. Please escalate to whoever owns legal/compliance for this event — breach-notification obligations may apply under Rwandan data-protection law. Treat this as an incident, not a hardening backlog item.

---

## B2. CORS allowlist rejects cleanly and covers the real production origin — **BLOCKS DEPLOY**

The current allowlist is exactly `http://localhost:5173` and `https://kcw.enjoyrwanda.rw`. Any other `Origin` receives **HTTP 500 with no CORS headers** — the middleware appears to throw rather than reject.

Consequence: if the frontend is served from **any** other origin, every API call fails and the site is completely non-functional. This includes Vercel preview deployments, which get a `*.vercel.app` origin.

### Required

1. Add the real production frontend origin to the allowlist. **Please confirm what that origin will be** — the frontend team needs this before deploying.
2. Decide whether Vercel preview origins (`*.vercel.app`) should be allowed, so staging is testable.
3. Remove `http://localhost:5173` from the production allowlist.
4. Reject a disallowed origin with a clean `403`, not an unhandled `500`.

### Acceptance test

```bash
curl -s -o /dev/null -w "%{http_code}\n" \
  -H "Origin: https://evil.example.com" https://kcw.enjoyrwanda.rw/api/product
# must print 403, not 500
```

---

## B3. Server-side payment verification

Today the client posts a DPO `TransactionToken` to `/payment/callback` and `/donation/callback`, and **the client is the only thing telling the server that money arrived**.

### Required

1. On callback, the server must call DPO's `verifyToken` itself and trust only DPO's answer — never the client's assertion that a payment succeeded.
2. Add a DPO webhook so an order is still confirmed when the customer closes the tab and never returns to `/order-success`. Without this, a paid order silently never reconciles.
3. Confirm whether stock is decremented at **order creation** or at **payment confirmation**. If it is payment confirmation, two customers can both buy the last kit and one will be oversold.

### Question for you

**What is the exact response shape of `POST /payment/callback`?** The frontend has been updated to show a success screen only when payment is confirmed, and it currently keys off `data.status === "paid"` or `data.ok`. Please confirm or correct this, including what is returned on failure.

---

## B4. Server-side total recomputation

The cart lives in the browser's `localStorage` and is user-editable. It holds a **price snapshot** captured when each item was added. `CheckoutPage` sends `total` and `unitPrice` to `/payment/create`.

Two consequences: a cart created before a price change still charges the old price, and a user can edit `localStorage` directly to alter the amount.

### Required

The server must recompute the charged amount from `stock_id` and its own current prices, ignoring any client-supplied total.

### Question for you

Does it already do this? If yes, we will note it and move on. If no, this is a money-loss vector.

---

## B5. Free-kit promotion ("buy 4, get 1 free")

`CartPage` currently tells buyers of 4+ kits: *"A free kit claim token will be emailed to you after payment."* However, the checkout payload contains **no promotion field** — no flag, no eligible count. Token issuance can therefore only be a backend inference from the line items.

### Questions for you

1. **Is free-kit token issuance implemented server-side?** If not, the UI is promising something the system cannot deliver and we will remove the message before launch.
2. **What is the rule for larger orders?** Does 20 kits yield 1 free kit or 5? The conventional reading is `floor(quantity / 4)`. The frontend message is currently singular regardless of quantity, which we will correct once you confirm the rule.
3. Which endpoint issues the token, and what is the token's format and lifetime?

The frontend has `/redeem-kit` wired to `POST /free-kit/verify` and `POST /free-kit/redeem`.

---

## B10. Donation processing fee — rate *and* rounding mode

The frontend displays a 7% processing fee on donations (the button reads e.g. "Pay RWF 10,700" for a RWF 10,000 donation). The frontend computes this as `Math.round(amount * 1.07)` — half-up rounding.

### Questions for you

1. **Does the backend add its own processing fee?** If it does, and the frontend also sends a fee-inclusive total, donors would be charged twice over. The frontend change to send `total_amount` is currently held pending your answer.
2. **What rounding mode does the backend use?** Matching the rate is not enough. If the server uses floor, ceiling, or banker's rounding, the amount we display and the amount you charge will differ by 1 RWF on roughly half of all donations — which surfaces later as persistent reconciliation noise that is tedious to trace.
3. **Which side should own the fee?** Our recommendation is the server owns it outright and returns the charged total, so there is exactly one implementation of the rule rather than two that can drift.

---

## B6. Transactional email verification

The frontend promises an email in four places but **sends none itself** — all four depend entirely on the backend:

| Where | Promise made to the user |
|---|---|
| `CartPage.tsx:221` | free kit claim token, after payment |
| `OrderSuccessPage.tsx:152` | order confirmation |
| `DonationSuccessPage.tsx:88` | donation confirmation |
| `RedeemKitPage.tsx:330` | redemption copy sent to the buyer |

### Required

1. Confirm each of these four emails actually sends.
2. Confirm they arrive at Gmail and Outlook without landing in spam (SPF, DKIM, and DMARC configured for the sending domain).
3. **Tell us the sender address.** The site currently shows two different support addresses (`sales@rgtickets.com` and `info@kigalicancerwalk.rw`) and we need to align them with whatever address these emails come from, so replies reach a monitored inbox.

---

## B7. Protect or remove `POST /donation/test-email`

This endpoint accepts an arbitrary recipient address and sends mail. Combined with B1 (no authentication), it is an **open mail relay running through your sending domain** — the fastest route to getting that domain blacklisted, which would also kill the transactional emails in B6.

### Required

Require admin authentication, or delete the endpoint. The frontend page that called it (`TestEmailPage`) has already been deleted, so nothing depends on it.

### Acceptance test

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST \
  -H "Content-Type: application/json" \
  -d '{"to":"test@example.com"}' \
  https://kcw.enjoyrwanda.rw/api/donation/test-email
# must print 401 or 404
```

---

## B8. Return 401 for expired or invalid tokens

The frontend now has a response interceptor that logs the user out and redirects to `/login` on a `401`. That only works if the API actually returns `401` for an expired session rather than an empty result or a `500`.

Without this, an admin whose session expires sees a misleading "check your connection" error indefinitely, with no way to recover except knowing to navigate to `/login` manually.

---

## B9. Store phone numbers as strings, not integers

`Order.phone_number` is currently returned as an integer. Rwandan mobile numbers begin with `07`, so the leading zero is destroyed: `0780123456` is stored and returned as `780123456`.

### Required

Store and return phone numbers as strings.

### Coordination note

The frontend previously sent `parseInt(phone)`. It is being changed to send a normalized string in the form `+250780123456`. **This is a breaking wire-format change and needs to be deployed in step with your fix.** Please tell us which format you would prefer to receive (`+250780123456` or `0780123456`) and we will match it.

---

---

# QR Ticketing — new feature

Design spec: `docs/superpowers/specs/2026-07-21-ticketing-design.md`. Every kit purchased becomes a marathon ticket with a QR code, scanned once to dispatch the kit and once to admit the holder.

**Prerequisite: B1 and B2 above must be done first.** Adding a `scanner` role to an API that currently authenticates nothing achieves nothing.

## T-B1. Ed25519 signing — asymmetric, not HMAC

Scanners verify tickets **offline**, so verification runs in public JavaScript. With HMAC the verification key is the signing key, so shipping it would let anyone mint unlimited valid tickets.

**Required:** generate an Ed25519 keypair. Sign with the private key server-side. Publish the **public** key for the frontend to embed. The private key must never leave the backend.

Token format (target: under ~120 characters so the QR stays low-density and scans on cheap phones in daylight):

```
KCW1.<base64url(payload)>.<base64url(signature)>

payload = {"tid":4417,"oid":1043,"sz":"M","ev":"kcw2026","iat":1755123456}
```

Sign over the **exact base64url payload string**, not re-serialized JSON — key order would differ and break verification.

## T-B2. Issue tickets on payment confirmation

On confirmed payment, create one ticket per kit unit (an order of 4 kits creates 4 tickets). **Never at order creation** — abandoned checkouts would mint valid tickets.

Each ticket needs a unique human-readable `short_code` (e.g. `T-4417`) printed under the QR. This is the manual fallback when a camera will not focus or a screen is cracked, and it is not optional.

State per ticket: `kit_collected` / `kit_collected_at` / `kit_collected_by`, and `checked_in` / `checked_in_at` / `checked_in_by`. The two stages are **independent** — neither is a precondition for the other.

## T-B3. Email #2

After the existing order confirmation, send a second email with event details, every QR PNG for that order, and each short code. QR generation already exists in your codebase (`/free-kit/redeem` returns a `qr` PNG data URL today).

## T-B4. `scanner` role

Gate volunteers use personal phones. A `scanner` account must reach **only** the ticket endpoints below — never orders, donations, volunteers, or revenue.

## T-B5. Ticket endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/ticket/manifest?event=kcw2026` | Full ticket list for offline use |
| `POST` | `/ticket/scan` | Batch of queued scans, idempotent on `client_scan_id` |
| `GET` | `/ticket/lookup?code=T-4417` | Manual short-code lookup |
| `GET` | `/ticket?order_id=` | Admin: tickets for an order |

`POST /ticket/scan` must be **idempotent** on `client_scan_id` — agents scan offline and replay a queue, so the same scan will arrive more than once. Return authoritative state per ticket, with a `conflict` flag where that stage was already recorded by a different agent.

```json
{ "scans": [
  { "client_scan_id": "uuid", "ticket_id": 4417, "mode": "entry",
    "scanned_at": "2026-08-09T06:12:03Z", "overridden": false }
] }
```

## T-B6. `POST /ticket/group-collect`

Bulk-mark all of a buddy group's kits collected in one action. Scanning 20 QRs at a dispatch table is not workable.

## T-B7. Free kits get tickets

A redeemed "buy 4, get 1 free" kit must also issue a ticket. Confirmed with the client.

## T-B8. `/auth/login` returns `role`

The frontend guard cannot restrict scanner accounts without it.

## Questions for you

1. Can you support Ed25519, or do you need ECDSA P-256? Either works; we need to know which.
2. What is the event identifier for `ev`? We have assumed `kcw2026`.
3. Will you generate short codes, or should we agree a format?
4. **What exactly does the QR encode — the bare token, or a URL containing it?** This matters more than it sounds. Our scanner currently expects the QR to decode to a string starting literally with `KCW1.`. If you encode something like `https://kigalicancerwalk.rw/scan#KCW1.…` instead, every scan fails at the gate. Either answer is fine; we just need it fixed before the event. Also confirm the QR carries no trailing newline or whitespace, which some generators add.
5. Is there any ticket expiry, or are tickets valid indefinitely until scanned? We currently do not check `iat` against a validity window.

---

## Summary — what we need back from you

| # | Item | What we need |
|---|---|---|
| B1 | Admin endpoint auth | Fix + confirmation. **Escalate as an incident.** |
| B2 | CORS | Fix, plus the confirmed production origin |
| B3 | Payment verification | Confirmation + the `/payment/callback` response shape |
| B4 | Total recomputation | Yes/no answer |
| B5 | Free-kit tokens | Yes/no, plus the rule for 8+ kits |
| B6 | Emails | Confirmation + the sender address |
| B7 | test-email endpoint | Protected or deleted |
| B8 | 401 on expiry | Confirmation |
| B9 | Phone as string | Fix + preferred format |
| B10 | Donation fee | Who owns it, and the exact rounding mode |

**Blocking order:** B1 first (it is live). B2 second (nothing can be deployed or tested until it is fixed). Everything else can follow.
