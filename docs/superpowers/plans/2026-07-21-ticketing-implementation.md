# QR Ticketing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Turn every purchased kit into a scannable QR ticket that admits its holder to the marathon and releases their kit, with a scanner that keeps working when the network does not.

**Architecture:** Ed25519-signed self-contained tokens verified offline by a scanner PWA, backed by a synced ticket manifest in IndexedDB. Backend owns issuance, signing, and reconciliation; frontend owns the scanner and admin views. See `docs/superpowers/specs/2026-07-21-ticketing-design.md`.

**Tech Stack:** React 19, TypeScript 6, Vite 8, react-router-dom 7, Tailwind 4, Vitest 3. New: `@noble/ed25519`, `@zxing/browser`, `idb`, `vite-plugin-pwa`.

## Global Constraints

- **The private signing key never enters this repo, any `VITE_*` variable, or any bundle.** Only the Ed25519 **public** key ships, via `VITE_TICKET_PUBLIC_KEY`.
- QR payload stays under ~120 characters. Larger payloads raise QR density and fail to scan on cheap phones in daylight.
- Tickets are issued on **payment confirmation**, never at order creation.
- The `/scan` route and all its dependencies must be **lazy-loaded**. None of the QR, crypto, or IndexedDB libraries may reach ordinary visitors; the main bundle is already 1.79 MB.
- Never send write requests to the production API while testing. Read-only GETs only.
- Use the existing Tailwind semantic tokens (`primary`, `on-surface`, `surface-container`, `outline-variant`, `error`). No raw hex or `bg-purple-600`.
- Scanner UI must be legible **outdoors in bright sun, one-handed, on a cheap Android phone**. Large targets, high contrast, no hover-dependent affordances.
- Work on a branch. Do not commit to `main`.

---

# Ownership split

## BACKEND (not this repo — append to `docs/BACKEND-REQUIREMENTS.md`)

| ID | Item |
|----|------|
| T-B1 | Ed25519 keypair; publish public key; sign tokens |
| T-B2 | Issue N tickets on payment confirmation, with unique short codes |
| T-B3 | Email #2: event details + QR PNGs + short codes |
| T-B4 | `scanner` role, restricted to ticket endpoints only |
| T-B5 | `GET /ticket/manifest`, `POST /ticket/scan` (idempotent), `GET /ticket/lookup` |
| T-B6 | `POST /ticket/group-collect` for buddy groups |
| T-B7 | Free-kit redemption also issues a ticket |
| T-B8 | `/auth/login` returns `role` |

## FRONTEND (this repo)

| ID | Item | Phase |
|----|------|-------|
| T-F1 | `ticketToken.ts` — decode + Ed25519 verify (pure, tested) | 1 |
| T-F2 | `scanVerdict.ts` — verdict state machine (pure, tested) | 1 |
| T-F3 | Role-aware `ProtectedRoute` | 1 |
| T-F4 | Scanner UI shell — mode toggle, verdict panel, manual entry | 1 |
| T-F5 | Camera capture + decode | 1 |
| T-F6 | `ticket.service.ts` + live wiring | 1 |
| T-F7 | IndexedDB manifest + queue | 2 |
| T-F8 | Sync engine + service worker | 2 |
| T-F9 | Admin ticket views + duplicate report | 3 |

**Buildable before the backend exists:** T-F1, T-F2, T-F3, T-F4, T-F5 — all validated against locally generated test keypairs and fixture data. T-F6 onward needs the real contract.

---

# PHASE 1 — Scanner (online)

### Task 1: Token decode and verification [T-F1]

**Files:**
- Create: `src/utils/ticketToken.ts`, `src/utils/ticketToken.test.ts`
- Modify: `package.json`

**Interfaces:**
- Produces: `type TicketPayload = { tid: number; oid: number; sz: string; ev: string; iat: number }`; `decodeTicketToken(raw: string): TicketPayload | null`; `verifyTicketToken(raw: string, publicKeyHex: string, expectedEvent: string): Promise<TicketPayload | null>`.

- [ ] **Step 1: Install the crypto library**

```bash
npm install @noble/ed25519@^2
```

`@noble/ed25519` is audited, dependency-free, and ~8 KB. Do not hand-roll signature verification.

- [ ] **Step 2: Write the failing tests**

Create `src/utils/ticketToken.test.ts`:

```ts
import { describe, it, expect, beforeAll } from "vitest";
import * as ed from "@noble/ed25519";
import { decodeTicketToken, verifyTicketToken } from "./ticketToken";

const EVENT = "kcw2026";
let publicKeyHex: string;
let validToken: string;

function b64url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function mint(payload: object, privKey: Uint8Array): Promise<string> {
  const body = b64url(new TextEncoder().encode(JSON.stringify(payload)));
  const sig = await ed.signAsync(new TextEncoder().encode(body), privKey);
  return `KCW1.${body}.${b64url(sig)}`;
}

beforeAll(async () => {
  const priv = ed.utils.randomPrivateKey();
  publicKeyHex = Buffer.from(await ed.getPublicKeyAsync(priv)).toString("hex");
  validToken = await mint(
    { tid: 4417, oid: 1043, sz: "M", ev: EVENT, iat: 1755123456 },
    priv,
  );
});

describe("decodeTicketToken", () => {
  it("reads the payload without verifying", () => {
    const p = decodeTicketToken(validToken);
    expect(p).toEqual({ tid: 4417, oid: 1043, sz: "M", ev: EVENT, iat: 1755123456 });
  });

  it("rejects a token without the KCW1 prefix", () => {
    expect(decodeTicketToken("NOPE.abc.def")).toBeNull();
  });

  it("rejects malformed input", () => {
    expect(decodeTicketToken("")).toBeNull();
    expect(decodeTicketToken("KCW1.notbase64!!.x")).toBeNull();
    expect(decodeTicketToken("KCW1.onlytwoparts")).toBeNull();
  });
});

describe("verifyTicketToken", () => {
  it("accepts a genuine token", async () => {
    const p = await verifyTicketToken(validToken, publicKeyHex, EVENT);
    expect(p?.tid).toBe(4417);
  });

  it("rejects a tampered payload", async () => {
    const [, body, sig] = validToken.split(".");
    const forged = JSON.parse(
      new TextDecoder().decode(
        Uint8Array.from(atob(body.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0)),
      ),
    );
    forged.tid = 9999;
    const forgedBody = b64url(new TextEncoder().encode(JSON.stringify(forged)));
    expect(await verifyTicketToken(`KCW1.${forgedBody}.${sig}`, publicKeyHex, EVENT)).toBeNull();
  });

  it("rejects a token signed by a different key", async () => {
    const otherPriv = ed.utils.randomPrivateKey();
    const otherToken = await mint(
      { tid: 1, oid: 1, sz: "L", ev: EVENT, iat: 1 }, otherPriv,
    );
    expect(await verifyTicketToken(otherToken, publicKeyHex, EVENT)).toBeNull();
  });

  it("rejects a ticket for a different event", async () => {
    expect(await verifyTicketToken(validToken, publicKeyHex, "kcw2027")).toBeNull();
  });

  it("rejects garbage without throwing", async () => {
    expect(await verifyTicketToken("garbage", publicKeyHex, EVENT)).toBeNull();
  });
});
```

- [ ] **Step 3: Run to confirm failure**

Run: `npm test`
Expected: FAIL — cannot resolve `./ticketToken`.

- [ ] **Step 4: Implement**

Create `src/utils/ticketToken.ts`. Requirements:
- `TOKEN_PREFIX = "KCW1"`.
- Split on `.` into exactly three parts; anything else returns `null`.
- base64url-decode the payload, `JSON.parse` it inside try/catch, and validate that `tid`, `oid`, `sz`, `ev`, `iat` are present with the right primitive types. A payload missing fields returns `null`.
- `verifyTicketToken` decodes first, returns `null` on decode failure, compares `payload.ev !== expectedEvent` → `null`, then verifies the Ed25519 signature over the **raw base64url payload string** (not the re-serialized JSON — re-serializing changes key order and breaks the signature).
- Every path returns `null` rather than throwing. A scanner must never crash on a bad QR.

- [ ] **Step 5: Run to confirm pass**

Run: `npm test`
Expected: PASS — all 9 token tests green, plus the existing 15.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/utils/ticketToken.ts src/utils/ticketToken.test.ts
git commit -m "feat: ed25519 ticket token decode and verification"
```

### Task 2: Scan verdict state machine [T-F2]

**Files:**
- Create: `src/utils/scanVerdict.ts`, `src/utils/scanVerdict.test.ts`

**Interfaces:**
- Produces: `type ScanMode = "kit" | "entry"`; `type Verdict = "ALLOW" | "ALREADY_USED" | "ALLOW_UNKNOWN" | "REJECT"`; `type TicketState = { id: number; kit_collected: boolean; kit_collected_at?: string; kit_collected_by?: string; checked_in: boolean; checked_in_at?: string; checked_in_by?: string }`; `scanVerdict(payload: TicketPayload | null, known: TicketState | undefined, mode: ScanMode): { verdict: Verdict; usedAt?: string; usedBy?: string }`.

- [ ] **Step 1: Write the failing tests**

Create `src/utils/scanVerdict.test.ts` covering every cell of the verdict table:

```ts
import { describe, it, expect } from "vitest";
import { scanVerdict } from "./scanVerdict";
import type { TicketState } from "./scanVerdict";

const payload = { tid: 4417, oid: 1043, sz: "M", ev: "kcw2026", iat: 1 };
const fresh: TicketState = { id: 4417, kit_collected: false, checked_in: false };

describe("scanVerdict", () => {
  it("rejects when the token failed verification", () => {
    expect(scanVerdict(null, fresh, "entry").verdict).toBe("REJECT");
  });

  it("allows an unused ticket in entry mode", () => {
    expect(scanVerdict(payload, fresh, "entry").verdict).toBe("ALLOW");
  });

  it("allows an unused ticket in kit mode", () => {
    expect(scanVerdict(payload, fresh, "kit").verdict).toBe("ALLOW");
  });

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
    const used: TicketState = { ...fresh, kit_collected: true, kit_collected_by: "Alice" };
    expect(scanVerdict(payload, used, "kit").verdict).toBe("ALREADY_USED");
  });

  it("treats the two stages as independent", () => {
    const collected: TicketState = { ...fresh, kit_collected: true };
    expect(scanVerdict(payload, collected, "entry").verdict).toBe("ALLOW");

    const entered: TicketState = { ...fresh, checked_in: true };
    expect(scanVerdict(payload, entered, "kit").verdict).toBe("ALLOW");
  });

  it("allows a valid ticket missing from the manifest", () => {
    expect(scanVerdict(payload, undefined, "entry").verdict).toBe("ALLOW_UNKNOWN");
    expect(scanVerdict(payload, undefined, "kit").verdict).toBe("ALLOW_UNKNOWN");
  });

  it("rejects an unverified token even when the manifest knows it", () => {
    expect(scanVerdict(null, fresh, "kit").verdict).toBe("REJECT");
  });
});
```

- [ ] **Step 2: Run to confirm failure**

Run: `npm test`
Expected: FAIL — cannot resolve `./scanVerdict`.

- [ ] **Step 3: Implement**

Create `src/utils/scanVerdict.ts`. Order of checks matters: verification failure outranks everything (`REJECT`), then an absent manifest entry gives `ALLOW_UNKNOWN`, then the mode-appropriate flag gives `ALREADY_USED` or `ALLOW`. Keep it a pure function with no I/O.

- [ ] **Step 4: Run to confirm pass**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/utils/scanVerdict.ts src/utils/scanVerdict.test.ts
git commit -m "feat: scan verdict state machine"
```

### Task 3: Role-aware route guard [T-F3]

Scanner accounts must reach `/scan` and nothing else. `ProtectedRoute` currently only checks for a token's existence.

**Files:**
- Modify: `src/utils/auth.ts`, `src/components/ProtectedRoute.tsx`

**Interfaces:**
- Produces: `getUserRole(): string | null` from `auth.ts`; `ProtectedRoute` accepts an optional `allowedRoles?: string[]`.

- [ ] **Step 1: Read the stored user shape**

Read `src/pages/LoginPage.tsx` around lines 53–70 to confirm exactly what is written to `localStorage.user`. Backend item T-B8 adds `role`; until it ships, `getUserRole()` returns `null`.

- [ ] **Step 2: Add the role reader**

In `src/utils/auth.ts` add `getUserRole()`, parsing `localStorage.user` inside try/catch and returning `null` on any failure. Never throw — a corrupted value must not white-screen the app.

- [ ] **Step 3: Make the guard role-aware**

Extend `ProtectedRoute` with `allowedRoles?: string[]`. When omitted, behaviour is unchanged. When supplied and the user's role is not in the list, redirect to a safe landing page rather than rendering. **Treat a `null` role as permitted for now**, so the dashboard keeps working before T-B8 lands; add a `TODO(T-B8)` comment stating this must tighten to deny-by-default once the backend returns a role.

- [ ] **Step 4: Verify manually**

Run `npm run dev`. With `localStorage.user` set to `{"role":"scanner"}`, `/dashboard` must redirect. With `{"role":"admin"}` it must render.

- [ ] **Step 5: Commit**

```bash
git add src/utils/auth.ts src/components/ProtectedRoute.tsx
git commit -m "feat: role-aware route guard"
```

### Task 4: Scanner UI shell [T-F4]

**Files:**
- Create: `src/pages/ScanPage.tsx`, `src/components/scan/VerdictPanel.tsx`, `src/components/scan/ModeToggle.tsx`, `src/components/scan/ManualEntry.tsx`
- Modify: `src/App.tsx`

This is the piece agents actually hold. Design constraints are functional, not decorative: usable **outdoors in bright sun, one-handed, on a cheap Android phone, by a volunteer trained for ninety seconds.**

- [ ] **Step 1: Build the verdict panel**

`VerdictPanel` takes `{ verdict, size, shortCode, usedAt, usedBy }`. The verdict must be readable at arm's length in sunlight:
- Colour fills the panel — it is the primary signal, not a small badge.
- A redundant icon and word accompany every colour, so it survives glare and colour-blindness. Never colour alone.
- `ALLOW` green, `ALREADY_USED` amber, `ALLOW_UNKNOWN` blue, `REJECT` red — mapped to the existing tokens where possible, with `text-error` for reject.
- Kit size renders **largest of all** in KIT mode — it is the one thing the dispatch agent must read to hand over the right item.
- `ALREADY_USED` shows when and by whom.

- [ ] **Step 2: Build the mode toggle**

`ModeToggle` switches KIT PICKUP / ENTRY. The current mode must be unmistakable — an agent scanning fifty people in the wrong mode is the worst realistic failure. Make it a persistent, high-contrast header, not a subtle segmented control, and persist the choice to `localStorage` so a page reload cannot silently flip it.

- [ ] **Step 3: Build manual entry**

`ManualEntry` accepts a short code (`T-4417`) and runs the same verdict path. This is the fallback when a camera fails and it is **not optional**. Large numeric-friendly input, `inputMode="text"`, `autocapitalize="characters"`.

- [ ] **Step 4: Assemble the page**

`ScanPage` composes mode toggle, camera area (Task 5), verdict panel, manual entry, and a session scan count. Add the lazy route in `App.tsx`:

```tsx
const ScanPage = lazy(() =>
  import("./pages/ScanPage").then((m) => ({ default: m.ScanPage })),
);
```

wrapped in `<Suspense>` and `<ProtectedRoute allowedRoles={["scanner", "admin"]}>`. Lazy-loading is mandatory — the crypto and QR libraries must not reach ordinary visitors.

- [ ] **Step 5: Verify**

Run `npm run build`. Confirm a **separate chunk** is emitted for the scanner and the main chunk has not grown materially.

- [ ] **Step 6: Commit**

```bash
git add src/pages/ScanPage.tsx src/components/scan/ src/App.tsx
git commit -m "feat: scanner UI shell with mode toggle and manual entry"
```

### Task 5: Camera capture [T-F5]

**Files:**
- Create: `src/components/scan/CameraScanner.tsx`
- Modify: `package.json`

- [ ] **Step 1: Install**

```bash
npm install @zxing/browser@^0.1
```

- [ ] **Step 2: Implement with a native fast path**

`CameraScanner` takes `onDecode(raw: string)`. Prefer the native `BarcodeDetector` API where available (Chrome on Android — much faster and lighter), falling back to ZXing. Request the rear camera with `facingMode: "environment"`.

Handle every failure explicitly, because all of them will happen at a real gate:
- **Permission denied** — explain how to re-enable it and keep manual entry prominent.
- **No camera** — fall back to manual entry silently.
- **Insecure context** — getUserMedia requires HTTPS; say so plainly rather than failing mysteriously.
- **Continuous scanning** — debounce so one QR held in frame does not fire dozens of times. Ignore repeats of the same value within ~3 seconds.

- [ ] **Step 3: Release the camera**

Stop all tracks on unmount and when the tab is hidden. A scanner holding the camera open drains a volunteer's battery through a whole event day.

- [ ] **Step 4: Verify on real devices**

`npm run build && npx vite preview --host`, open on a real Android phone and a real iPhone over HTTPS or a tunnel. Camera access will **not** work over plain `http://` on a phone. Test in direct sunlight.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json src/components/scan/CameraScanner.tsx
git commit -m "feat: camera QR capture with native fast path and fallbacks"
```

### Task 6: Service layer and live wiring [T-F6]

**Blocked on backend T-B5.** Build against fixtures until the contract is live.

**Files:**
- Create: `src/services/ticket.service.ts`
- Modify: `src/pages/ScanPage.tsx`

- [ ] **Step 1: Define the service**

Mirror the contract in the spec: `getManifest(event)`, `postScans(scans)`, `lookupByCode(code)`. Type the responses explicitly; do not use `any`.

- [ ] **Step 2: Wire the page**

Load the manifest on mount, verify scans against it, POST each scan. Surface failures inline — never a silent `catch {}`.

- [ ] **Step 3: Commit**

```bash
git add src/services/ticket.service.ts src/pages/ScanPage.tsx
git commit -m "feat: ticket service and live scanner wiring"
```

---

# PHASE 2 — Offline (after Phase 1 is proven)

### Task 7: IndexedDB manifest and queue [T-F7]
Store the manifest and outbound queue via `idb`. Queue entries carry a client-generated `client_scan_id` so replay is idempotent. Unit-test reconciliation: replay is idempotent, server state wins, conflicts are recorded not dropped.

### Task 8: Sync engine and service worker [T-F8]
Flush the queue on reconnect with exponential backoff. Add `vite-plugin-pwa` for the offline app shell. Show explicit sync state — "12 scans pending" — so an agent always knows whether their work has been saved. Silent queues are how scans get lost.

---

# PHASE 3 — Admin views

### Task 9: Ticket dashboard [T-F9]
`/dashboard/tickets` with short-code search, per-order ticket lists, collected/entered counts, and the duplicate-scan reconciliation report that closes the offline gap. Add a matching `Sidebar` entry — and per the earlier audit, **only** add the link once the route exists.

---

# Sequencing

| Order | Work | Owner | Gate |
|---|---|---|---|
| 1 | Close the API auth breach (B1) | Backend | **Hard gate.** A scanner role on an unauthenticated API is theatre. |
| 2 | T-F1, T-F2 — pure logic + tests | Frontend | None. Start now. |
| 3 | T-F3, T-F4, T-F5 — guard, UI, camera | Frontend | Needs T-F1/T-F2 |
| 4 | T-B1…T-B5 — signing, issuance, endpoints | Backend | Needs B1 done |
| 5 | T-F6 — live wiring | Frontend | **Blocked on T-B5** |
| 6 | Real-device testing with actual agents | Both | Before Phase 2 |
| 7 | Phase 2 — offline | Frontend | Only after Phase 1 is proven |
| 8 | Phase 3 — admin views | Frontend | Independent |

**Definition of done for the event:** a volunteer who has never seen the app can be handed a phone, shown the mode toggle once, and scan a hundred tickets in daylight without assistance — including at least one already-used ticket and one deliberately invalid QR, each producing an unmistakable result.
