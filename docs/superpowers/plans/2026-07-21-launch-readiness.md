# Kigali Cancer Walk 2026 — Launch Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the data-exposure breach, remove the unsafe payment and email pages, make the money flows trustworthy, and get the platform to a state that can be handed to a client without embarrassment.

**Architecture:** This repo is frontend-only (React 19 + TypeScript + Vite, deployed on Vercel). The backend is a separate remote service at `https://kcw.enjoyrwanda.rw/api` whose source is not available here. Work is therefore split three ways: **BACKEND** items are specifications handed to the backend owner with curl-based acceptance tests we run ourselves; **FRONTEND** items are code changes in this repo; **DEVOPS** items are build, deploy, config, and repo-hygiene changes.

**Tech Stack:** React 19.2, TypeScript 6.0, Vite 8, react-router-dom 7.16, Tailwind CSS 4.3, axios 1.17, framer-motion 12, recharts 3.8, jspdf 4.2 + xlsx 0.18 (exports). Payment gateway: DPO (redirect-based). No test runner currently installed.

## Global Constraints

- **Never send write requests (POST/PUT/PATCH/DELETE) to `https://kcw.enjoyrwanda.rw/api` while testing.** It is production with real donor and buyer records. Read-only GET probes only.
- Currency values arrive from the API as **strings**, not numbers. Every arithmetic use must be wrapped in `Number()`.
- `VITE_*` environment variables are **inlined into the public bundle**. Never put a secret, SMTP password, or payment key in one. The API base URL is fine.
- Do not commit `dist/`. It is correctly gitignored today — keep it that way.
- Preserve the existing Tailwind semantic tokens (`primary`, `on-surface`, `surface-container`, `outline-variant`, …). Do not introduce raw Tailwind colors like `bg-purple-700` in new UI.
- Work on a branch off `main`. Do not push to `main` directly.
- The event date is currently `"TBD"` in `src/data/index.ts:56` while `src/components/CountdownTimer.tsx:8` counts down to `2026-08-09T07:00:00`. **Get the real date from the client before Task F12.** Do not invent one.

---

# Ownership split

## BACKEND (not this repo — hand to backend owner)

| ID | Item | Severity |
|----|------|----------|
| B1 | Require authentication on all admin read endpoints | **BREACH — do first** |
| B2 | Fix CORS allowlist + 500-on-rejected-origin | **BLOCKER** |
| B3 | Verify DPO token server-side; add webhook confirmation | **BLOCKER** |
| B4 | Recompute order totals server-side; never trust client `total` | **BLOCKER** |
| B5 | Confirm free-kit token issuance actually exists | High |
| B6 | Confirm the four transactional emails actually send | High |
| B7 | Protect or remove `POST /donation/test-email` | High |
| B8 | Return 401 (not 200) for expired/invalid tokens | Medium |
| B9 | Store phone numbers as strings, not integers | Medium |

## FRONTEND (this repo)

| ID | Item | Severity |
|----|------|----------|
| F1 | Delete `PaymentPage.tsx` + `/payment` route | **BLOCKER** |
| F2 | Delete `TestEmailPage.tsx` + `/dashboard/test-email` route | **BLOCKER** |
| F3 | Add `ProtectedRoute` guard on `/dashboard/*` | **BLOCKER** |
| F4 | Add 401 response interceptor + working logout | High |
| F5 | Add `ErrorBoundary` | High |
| F6 | Add public 404 route + dashboard 404 | High |
| F7 | Gate `/order-success` on verified payment | High |
| F8 | Stop clearing the cart before payment | High |
| F9 | Enforce stock limits in cart and add-to-cart | High |
| F10 | Single-source the 7% donation fee | High |
| F11 | Route the two orphaned admin pages | High |
| F12 | Wire `/redeem-kit` into the UI | Medium |
| F13 | Shared `+250` phone validation and normalization | Medium |
| F14 | Fix type drift; delete duplicate interfaces | Medium |
| F15 | Dashboard resilience: `allSettled`, error-gated KPIs, currency fix | Medium |
| F16 | Content fixes: dates, stats, contact addresses, legal links | Medium |
| F17 | Replace `alert()` with inline UI; surface real errors | Low |
| F18 | Delete orphan components; accessibility labels | Low |

## DEVOPS

| ID | Item | Severity |
|----|------|----------|
| D1 | `VITE_API_BASE_URL` env config + Vercel project settings | High |
| D2 | Route-level code splitting (`React.lazy`) + `manualChunks` | High |
| D3 | Open Graph / Twitter Card tags + `og-image.jpg` | High |
| D4 | Image compression (5.2 MB → under 400 KB) | High |
| D5 | Vercel security headers + asset caching | Medium |
| D6 | Add Vitest + tests for money math | Medium |
| D7 | Repo hygiene: README, `_redirects`, lint gate in CI | Low |

---

# File structure

**Created:**
- `src/components/ProtectedRoute.tsx` — auth gate for the dashboard branch
- `src/components/ErrorBoundary.tsx` — top-level crash fallback
- `src/pages/NotFoundPage.tsx` — public 404
- `src/utils/phone.ts` — Rwandan phone normalize + validate (pure, testable)
- `src/utils/pricing.ts` — donation fee + free-kit math (pure, testable)
- `src/utils/auth.ts` — token read/clear helpers, single source of truth
- `.env.example`, `.env.development` — env config
- `docs/BACKEND-REQUIREMENTS.md` — the B-series handoff spec

**Modified:** `src/App.tsx`, `src/main.tsx`, `src/services/api.ts`, `src/context/CartContext.tsx`, `src/pages/CheckoutPage.tsx`, `src/pages/OrderSuccessPage.tsx`, `src/pages/CartPage.tsx`, `src/pages/BuyKitPage.tsx`, `src/pages/DonationPage.tsx`, `src/pages/DonationSuccessPage.tsx`, `src/components/dashboard/Sidebar.tsx`, `src/hooks/useDashboardData.ts`, `src/pages/DashboardPage.tsx`, `src/data/index.ts`, `index.html`, `vite.config.ts`, `vercel.json`

**Deleted:** `src/pages/PaymentPage.tsx`, `src/pages/TestEmailPage.tsx`, `src/components/dashboard/ParticipantsCheckIn.tsx`, `src/components/dashboard/RevenueChart.tsx`, `public/_redirects`

---

# PHASE 0 — Emergency (today)

The breach is live. Phase 0 is the only phase that matters until it is closed.

### Task 0.1: Hand the backend owner a written spec [BACKEND]

**Files:**
- Create: `docs/BACKEND-REQUIREMENTS.md`

- [ ] **Step 1: Write the handoff document**

Create `docs/BACKEND-REQUIREMENTS.md` with exactly this content:

```markdown
# Backend Requirements — Launch Blockers

## B1. Authentication on admin read endpoints (BREACH — live now)

Verified 2026-07-21: these endpoints return HTTP 200 with full records and
**no** Authorization header, and also with a deliberately invalid token:

| Endpoint | Records exposed |
|---|---|
| GET /payment/orders | 41 |
| GET /volunteer | 38 |
| GET /donation | 25 |
| GET /influencer | 11 |
| GET /sponsor | 0 |
| GET /donation/stats | — |

Exposed fields include full_name, email, phone_number, amount_paid,
payment_ref, location. Donation records include an `anonymous` flag —
anonymous donors' names are currently public.

**Required:** every endpoint above must return 401 without a valid bearer
token. The frontend already sends `Authorization: Bearer <token>`
(src/services/api.ts:14-20), so no client change is needed.

**This is a personal-data breach under Rwandan data-protection law.
Escalate to whoever owns legal/compliance for this event — notification
obligations may apply.**

**Acceptance test:**
    curl -s -o /dev/null -w "%{http_code}\n" https://kcw.enjoyrwanda.rw/api/donation
    # must print 401
    curl -s -o /dev/null -w "%{http_code}\n" -H "Authorization: Bearer bogus" \
      https://kcw.enjoyrwanda.rw/api/donation
    # must print 401

## B2. CORS allowlist rejects cleanly and covers the real origin

Current allowlist is exactly `http://localhost:5173` and
`https://kcw.enjoyrwanda.rw`. Any other Origin receives **HTTP 500 with no
CORS headers** — the middleware throws instead of rejecting.

**Required:**
1. Add the real production frontend origin to the allowlist. If the site
   will be served from any domain other than kcw.enjoyrwanda.rw, every API
   call currently fails and the site is completely non-functional.
2. Remove `http://localhost:5173` from the production allowlist.
3. Reject disallowed origins with 403, not an unhandled 500.

**Acceptance test:**
    curl -s -o /dev/null -w "%{http_code}\n" \
      -H "Origin: https://evil.example.com" https://kcw.enjoyrwanda.rw/api/product
    # must print 403, not 500

## B3. Server-side payment verification

The client currently posts a DPO `TransactionToken` to /payment/callback and
/donation/callback, and the client is the only thing telling the server that
money arrived (src/pages/OrderSuccessPage.tsx:49,
src/pages/DonationSuccessPage.tsx:240).

**Required:**
1. On callback, the server must call DPO's `verifyToken` itself and trust
   only DPO's answer — never the client's assertion.
2. Add a DPO webhook so orders are confirmed even when the customer closes
   the tab and never returns to /order-success.
3. Confirm which of order-creation vs payment-confirmation decrements stock.
   If it is payment-confirmation, two customers can both buy the last kit.

## B4. Server-side total recomputation

The cart lives in `localStorage` and is user-editable. It holds a **price
snapshot** taken when the item was added, and CheckoutPage sends `total` and
`unitPrice` to /payment/create.

**Required:** the server must recompute the charged amount from `stock_id`
and its own current prices, and ignore any client-supplied total. Confirm
whether it does today.

## B5. Free-kit token issuance

CartPage tells buyers of 4+ kits: "A free kit claim token will be emailed to
you after payment." The checkout payload contains **no promotion field** —
no flag, no eligible count. Token issuance can only be a backend inference
from line items.

**Required:** confirm the backend implements this. If not, the UI is making
a promise the system cannot keep and the message must be removed.
Also confirm the intended rule for large orders: does 20 kits yield 1 free
kit or 5? (floor(qty/4) is the conventional reading.)

## B6. Transactional email verification

The frontend promises an email in four places but sends none itself:
- CartPage.tsx:221 — free kit claim token
- OrderSuccessPage.tsx:152 — order confirmation
- DonationSuccessPage.tsx:88 — donation confirmation
- RedeemKitPage.tsx:330 — redemption copy to buyer

**Required:** confirm each of these actually sends, from a monitored sender
address, and that they survive spam filtering to Gmail and Outlook. Provide
the sender address so we can align the site's support address with it.

## B7. Protect or remove POST /donation/test-email

This endpoint accepts an arbitrary recipient and sends mail. Combined with
B1 it is an open relay running through your domain, which will get the
sending domain blacklisted. Require admin auth or delete it. The frontend
page that called it is being deleted regardless.

## B8. Return 401 for expired tokens
So the frontend interceptor can log the user out instead of showing a
misleading "check your connection" error forever.

## B9. Store phone numbers as strings
`Order.phone_number` is currently an integer, so Rwandan numbers lose their
leading zero (0780123456 becomes 780123456). Store as a string.
```

- [ ] **Step 2: Commit**

```bash
git add docs/BACKEND-REQUIREMENTS.md
git commit -m "docs: backend launch-blocker requirements and acceptance tests"
```

- [ ] **Step 3: Send it**

Send `docs/BACKEND-REQUIREMENTS.md` to the backend owner. Flag B1 as an active data breach, not a hardening request. Ask for an ETA on B1 and B2 specifically — everything else can follow.

### Task 0.2: Delete the fake payment page [FRONTEND — F1]

`src/pages/PaymentPage.tsx` collects card number, expiry, and CVV into React state under a banner reading "We do not store card or mobile money credentials", then fakes success with `setTimeout(3000)` and shows a fabricated receipt. Nothing navigates to it; the real flow redirects to DPO. It is pure PCI liability.

**Files:**
- Delete: `src/pages/PaymentPage.tsx`
- Modify: `src/App.tsx:23` (import), `src/App.tsx:79` (route)

- [ ] **Step 1: Delete the file and its route**

```bash
git rm src/pages/PaymentPage.tsx
```

In `src/App.tsx`, delete line 23:
```tsx
import { PaymentPage } from "./pages/PaymentPage";
```
and delete line 79:
```tsx
<Route path="/payment" element={<PaymentPage />} />
```

- [ ] **Step 2: Verify nothing else referenced it**

Run: `grep -rn "PaymentPage\|\"/payment\"" src/`
Expected: no matches other than `/payment/create`, `/payment/callback`, and `/payment/orders` API paths (those are backend endpoints and must stay).

- [ ] **Step 3: Verify the build still passes**

Run: `npm run build`
Expected: `✓ built in …` with no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "fix: remove fake payment page that collected card data without processing it"
```

### Task 0.3: Delete the test-email page [FRONTEND — F2]

`src/pages/TestEmailPage.tsx` POSTs an arbitrary recipient to `/donation/test-email`. Its own footer at line 154 claims "requires admin login" — it does not. Reachable by URL with no guard.

**Files:**
- Delete: `src/pages/TestEmailPage.tsx`
- Modify: `src/App.tsx:33` (import), `src/App.tsx:55` (route)

- [ ] **Step 1: Delete the file and its route**

```bash
git rm src/pages/TestEmailPage.tsx
```

In `src/App.tsx`, delete line 33:
```tsx
import { TestEmailPage } from "./pages/TestEmailPage";
```
and delete line 55:
```tsx
<Route path="/dashboard/test-email" element={<TestEmailPage />} />
```

- [ ] **Step 2: Verify**

Run: `grep -rn "TestEmailPage\|test-email" src/`
Expected: no matches.

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "fix: remove unguarded test-email page that could relay mail through the backend"
```

### Task 0.4: Add the dashboard auth guard [FRONTEND — F3]

This does **not** fix the breach (B1 does) but it stops casual discovery and gives a real login flow.

**Files:**
- Create: `src/utils/auth.ts`, `src/components/ProtectedRoute.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Produces: `getAuthToken(): string | null`, `clearAuth(): void`, `isAuthenticated(): boolean` from `src/utils/auth.ts`; default-exported `ProtectedRoute` component wrapping children.

- [ ] **Step 1: Create the auth helper**

Create `src/utils/auth.ts`:

```ts
const TOKEN_KEY = "authToken";
const USER_KEY = "user";

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  return Boolean(getAuthToken());
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
```

- [ ] **Step 2: Create the guard**

Create `src/components/ProtectedRoute.tsx`:

```tsx
import { Navigate, useLocation } from "react-router-dom";
import { isAuthenticated } from "../utils/auth";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
}
```

- [ ] **Step 3: Wrap the dashboard branch**

In `src/App.tsx`, add the import after line 34:
```tsx
import { ProtectedRoute } from "./components/ProtectedRoute";
```

Then wrap the dashboard `<Routes>` block (currently lines 42–57) so it reads:

```tsx
  if (isDashboard) {
    return (
      <ProtectedRoute>
        <Routes>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/dashboard/sponsors" element={<DashboardSponsorsPage />} />
          <Route path="/dashboard/donations" element={<DashboardDonationsPage />} />
          <Route path="/dashboard/orders" element={<DashboardOrdersPage />} />
          <Route path="/dashboard/volunteers" element={<DashboardVolunteersPage />} />
          <Route path="/dashboard/buddy-groups" element={<DashboardBuddyGroupsPage />} />
          <Route path="/dashboard/*" element={<DashboardPage />} />
        </Routes>
      </ProtectedRoute>
    );
  }
```

- [ ] **Step 4: Verify manually**

Run: `npm run dev`

In the browser:
1. Open DevTools → Application → Local Storage → delete `authToken`.
2. Navigate to `http://localhost:5173/dashboard`.
   Expected: redirected to `/login`, dashboard never renders.
3. In the console run `localStorage.setItem("authToken","test")`, reload `/dashboard`.
   Expected: dashboard renders.

- [ ] **Step 5: Commit**

```bash
git add src/utils/auth.ts src/components/ProtectedRoute.tsx src/App.tsx
git commit -m "feat: guard dashboard routes behind authentication"
```

### Task 0.5: 401 interceptor and working logout [FRONTEND — F4]

Today there is no response interceptor, so an expired session shows "Failed to load…" forever. And Sidebar "Logout" is a `<Link to="/">` that never clears the token — on a shared machine the next person is still logged in.

**Files:**
- Modify: `src/services/api.ts`, `src/components/dashboard/Sidebar.tsx:174-184`

- [ ] **Step 1: Add the response interceptor**

In `src/services/api.ts`, add after the existing request interceptor (after line 20):

```ts
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearAuth();
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);
```

Add the import at the top of the file:
```ts
import { clearAuth } from "../utils/auth";
```

- [ ] **Step 2: Make logout actually log out**

In `src/components/dashboard/Sidebar.tsx`, replace the logout `<Link to="/">` block (lines 168–178) with:

```tsx
          <button
            onClick={() => {
              clearAuth();
              navigate("/login", { replace: true });
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/80 hover:bg-white/10 hover:text-white transition-colors"
          >
            <LogOut className="w-5 h-5" />
            {!isCollapsed && (
              <span className="font-['Inter'] text-sm font-semibold">
                Logout
              </span>
            )}
          </button>
```

Update the react-router import on line 2 to include `useNavigate`:
```tsx
import { Link, useLocation, useNavigate } from "react-router-dom";
```
Add `import { clearAuth } from "../../utils/auth";` to the imports, and add `const navigate = useNavigate();` next to the existing `const location = useLocation();` on line 82.

- [ ] **Step 3: Verify**

Run: `npm run dev`, log in (or set a fake `authToken`), open `/dashboard`, click Logout.
Expected: redirected to `/login`; DevTools → Local Storage shows `authToken` and `user` both gone; navigating back to `/dashboard` redirects to `/login`.

- [ ] **Step 4: Commit**

```bash
git add src/services/api.ts src/components/dashboard/Sidebar.tsx
git commit -m "feat: log out on 401 and make the logout button clear the session"
```

---

# PHASE 1 — Money correctness

Do not launch with these open. Each one either costs revenue or tells a customer something untrue.

### Task 1.1: Add Vitest and test the money math [DEVOPS — D6]

There is no test runner. The cart and fee arithmetic is exactly the kind of pure logic worth testing, and Tasks 1.2–1.4 depend on it.

**Files:**
- Modify: `package.json`, `vite.config.ts`
- Create: `src/utils/pricing.ts`, `src/utils/pricing.test.ts`

**Interfaces:**
- Produces: `DONATION_FEE_RATE`, `applyDonationFee(amount: number): number`, `freeKitsEarned(totalKits: number): number`, `kitsUntilNextFree(totalKits: number): number` from `src/utils/pricing.ts`.

- [ ] **Step 1: Install Vitest**

```bash
npm install -D vitest@^3
```

- [ ] **Step 2: Configure it**

Replace `vite.config.ts` with:

```ts
/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
```

Add to the `scripts` block in `package.json`:
```json
    "test": "vitest run",
    "test:watch": "vitest",
```

- [ ] **Step 3: Write the failing tests**

Create `src/utils/pricing.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  DONATION_FEE_RATE,
  applyDonationFee,
  freeKitsEarned,
  kitsUntilNextFree,
} from "./pricing";

describe("applyDonationFee", () => {
  it("adds the 7% processing fee", () => {
    expect(DONATION_FEE_RATE).toBe(0.07);
    expect(applyDonationFee(10000)).toBe(10700);
  });

  it("rounds to a whole unit so the charged amount is never fractional", () => {
    expect(applyDonationFee(333)).toBe(356);
  });
});

describe("freeKitsEarned", () => {
  it("gives nothing below the threshold", () => {
    expect(freeKitsEarned(0)).toBe(0);
    expect(freeKitsEarned(3)).toBe(0);
  });

  it("gives one free kit at exactly four", () => {
    expect(freeKitsEarned(4)).toBe(1);
  });

  it("scales with every additional four kits", () => {
    expect(freeKitsEarned(7)).toBe(1);
    expect(freeKitsEarned(8)).toBe(2);
    expect(freeKitsEarned(20)).toBe(5);
  });
});

describe("kitsUntilNextFree", () => {
  it("counts down to the threshold", () => {
    expect(kitsUntilNextFree(0)).toBe(4);
    expect(kitsUntilNextFree(3)).toBe(1);
  });

  it("never returns a negative or zero remainder at the threshold", () => {
    expect(kitsUntilNextFree(4)).toBe(4);
    expect(kitsUntilNextFree(5)).toBe(3);
  });
});
```

- [ ] **Step 4: Run the tests to confirm they fail**

Run: `npm test`
Expected: FAIL — `Failed to resolve import "./pricing"`.

- [ ] **Step 5: Implement**

Create `src/utils/pricing.ts`:

```ts
/** Processing fee added to donations. Must match the backend's rate. */
export const DONATION_FEE_RATE = 0.07;

/** Free-kit promotion: every FREE_KIT_THRESHOLD kits earns one free kit. */
export const FREE_KIT_THRESHOLD = 4;

export function applyDonationFee(amount: number): number {
  return Math.round(amount * (1 + DONATION_FEE_RATE));
}

export function freeKitsEarned(totalKits: number): number {
  if (totalKits < FREE_KIT_THRESHOLD) return 0;
  return Math.floor(totalKits / FREE_KIT_THRESHOLD);
}

export function kitsUntilNextFree(totalKits: number): number {
  const remainder = totalKits % FREE_KIT_THRESHOLD;
  return FREE_KIT_THRESHOLD - remainder;
}
```

- [ ] **Step 6: Run the tests to confirm they pass**

Run: `npm test`
Expected: PASS — 7 tests passing.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json vite.config.ts src/utils/pricing.ts src/utils/pricing.test.ts
git commit -m "test: add vitest and cover donation fee and free-kit math"
```

### Task 1.2: Stop clearing the cart before payment [FRONTEND — F8]

`src/pages/CheckoutPage.tsx:110` calls `clearCart()` immediately before redirecting to DPO. Any failed or abandoned payment leaves the customer with an empty cart.

**Files:**
- Modify: `src/pages/CheckoutPage.tsx:110`, `src/pages/OrderSuccessPage.tsx`

- [ ] **Step 1: Remove the premature clear**

In `src/pages/CheckoutPage.tsx`, delete the `clearCart();` call on line 110. Leave the `localStorage.setItem("lastOrder", …)` write on line 108 — `/order-success` still needs it. Remove `clearCart` from the `useCart()` destructure if it is now unused (TypeScript's `noUnusedLocals` will flag it at build time if so).

- [ ] **Step 2: Clear on confirmed payment instead**

In `src/pages/OrderSuccessPage.tsx`, inside the success branch of the payment-verification effect added in Task 1.3, call `clearCart()` only once the callback confirms payment. Add to the imports:

```tsx
import { useCart } from "../context/CartContext";
```
and inside the component:
```tsx
const { clearCart } = useCart();
```

- [ ] **Step 3: Verify manually**

Run: `npm run dev`. Add kits to the cart, go to checkout, submit, then press the browser Back button from the DPO page (or close the tab and return to `/cart`).
Expected: the cart still contains the items.

- [ ] **Step 4: Commit**

```bash
git add src/pages/CheckoutPage.tsx src/pages/OrderSuccessPage.tsx
git commit -m "fix: keep the cart until payment is confirmed so failed payments can retry"
```

### Task 1.3: Gate the order success page on real verification [FRONTEND — F7]

`/order-success` currently renders "Payment Successful! Your order is confirmed" unconditionally from `localStorage.lastOrder`, which is written *before* payment. And a failed `/payment/callback` is swallowed to `console.error` while the user still sees success.

`src/pages/DonationSuccessPage.tsx:212-318` already implements the correct pattern (`verifyStatus` with verifying / verified / failed states and a retry button). Port it.

**Files:**
- Modify: `src/pages/OrderSuccessPage.tsx:29-56, 100-152`

- [ ] **Step 1: Read the reference implementation**

Read `src/pages/DonationSuccessPage.tsx` lines 212–318 in full before writing anything. Match its state machine and its visual treatment so the two success pages behave consistently.

- [ ] **Step 2: Add the verification state machine**

In `src/pages/OrderSuccessPage.tsx`, add near the top of the component:

```tsx
type VerifyStatus = "idle" | "verifying" | "verified" | "failed";

const [verifyStatus, setVerifyStatus] = useState<VerifyStatus>("idle");
const [verifyError, setVerifyError] = useState("");

const [searchParams] = useSearchParams();
const transactionToken = searchParams.get("TransactionToken");
```

Import `useSearchParams` from `react-router-dom`.

Replace the existing callback effect (lines ~44–56) with:

```tsx
const verifyPayment = useCallback(async () => {
  if (!transactionToken) return;
  setVerifyStatus("verifying");
  setVerifyError("");
  try {
    const { data } = await api.post("/payment/callback", {
      TransactionToken: transactionToken,
    });
    if (data?.status === "paid" || data?.ok) {
      setVerifyStatus("verified");
      clearCart();
      localStorage.removeItem("lastOrder");
    } else {
      setVerifyStatus("failed");
      setVerifyError(data?.message || "Payment could not be confirmed.");
    }
  } catch (err) {
    setVerifyStatus("failed");
    setVerifyError(
      axios.isAxiosError(err) && err.response?.data?.message
        ? err.response.data.message
        : "We could not reach the payment service to confirm your order.",
    );
  }
}, [transactionToken, clearCart]);

useEffect(() => {
  verifyPayment();
}, [verifyPayment]);
```

Import `useCallback` from react, and `axios` for the type guard.

- [ ] **Step 3: Gate the success hero on the verified state**

Wrap the "Payment Successful!" hero (currently lines ~100–152) so it renders only when `verifyStatus === "verified"`. Add these branches:

- `verifyStatus === "idle"` (no token in the URL): render a neutral "We don't have a payment reference for this page" message with a link to `/buy-kit` — **never** the word "Successful".
- `verifyStatus === "verifying"`: a spinner and "Confirming your payment…".
- `verifyStatus === "failed"`: a red panel showing `verifyError`, a **Retry** button calling `verifyPayment()`, and the support email from `eventInfo.email`. State clearly that money may still have been taken and they should not pay again before contacting support.

Use the existing Tailwind tokens (`text-on-surface`, `bg-surface-container`, `border-outline-variant`) to match the rest of the site.

- [ ] **Step 4: Verify manually**

Run: `npm run dev`.
1. Open `http://localhost:5173/order-success` with no query string.
   Expected: neutral message, **no** "Payment Successful".
2. Open `http://localhost:5173/order-success?TransactionToken=invalid123`.
   Expected: "Confirming your payment…" then the failed state with a retry button.

- [ ] **Step 5: Commit**

```bash
git add src/pages/OrderSuccessPage.tsx
git commit -m "fix: only claim payment success after the server confirms it"
```

### Task 1.4: Enforce stock limits in the cart [FRONTEND — F9]

Two independent holes: `BuyKitPage.tsx:52-66` checks only the *new* quantity, so adding 3 twice yields 6 of an item with 3 remaining; and `CartPage.tsx:146-153` increments with no stock reference at all.

**Files:**
- Modify: `src/types/index.ts`, `src/context/CartContext.tsx`, `src/pages/BuyKitPage.tsx:52-66`, `src/pages/CartPage.tsx:146-153`

- [ ] **Step 1: Carry stock on the cart item**

In `src/types/index.ts`, add `remaining` to `CartItem`:

```ts
export interface CartItem {
  id: string;
  product: Product;
  size: string;
  quantity: number;
  stockId: number;
  /** Stock level captured when the item was added; revalidated at checkout. */
  remaining: number;
}
```

- [ ] **Step 2: Cap quantity in the context**

In `src/context/CartContext.tsx`, update `addToCart` to accept `remaining` and clamp the merged total, and clamp `updateQuantity`:

```tsx
  const addToCart = (
    product: Product,
    size: string,
    quantity: number,
    stockId: number,
    remaining: number,
  ) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find(
        (item) => item.product.id === product.id && item.size === size,
      );

      if (existingItem) {
        const merged = Math.min(existingItem.quantity + quantity, remaining);
        return prevItems.map((item) =>
          item === existingItem ? { ...item, quantity: merged, remaining } : item,
        );
      }

      return [
        ...prevItems,
        {
          id: `${product.id}-${size}-${Date.now()}`,
          product,
          size,
          quantity: Math.min(quantity, remaining),
          stockId,
          remaining,
        },
      ];
    });
  };

  const updateQuantity = (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(cartItemId);
      return;
    }

    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === cartItemId
          ? { ...item, quantity: Math.min(quantity, item.remaining) }
          : item,
      ),
    );
  };
```

Update the `CartContextType` signature for `addToCart` to match.

- [ ] **Step 3: Also guard the JSON.parse (fixes the white-screen risk, F5 prerequisite)**

Still in `src/context/CartContext.tsx`, replace the unguarded parse on lines 20–25 with:

```tsx
  useEffect(() => {
    const savedCart = localStorage.getItem("cart");
    if (!savedCart) return;
    try {
      const parsed = JSON.parse(savedCart);
      if (Array.isArray(parsed)) setCartItems(parsed);
    } catch {
      localStorage.removeItem("cart");
    }
  }, []);
```

Without this, a corrupted `localStorage.cart` white-screens every page, because `CartProvider` wraps the whole router.

- [ ] **Step 4: Pass stock from the buy page**

In `src/pages/BuyKitPage.tsx`, update the `addToCart(...)` call to pass the selected size's `remaining` as the fifth argument, and change the pre-add check so it accounts for what is already in the cart for that size rather than only the new quantity.

- [ ] **Step 5: Cap the cart stepper**

In `src/pages/CartPage.tsx` around lines 146–153, disable the `+` button when `item.quantity >= item.remaining` and show "Only N left" beneath the row when the cap is hit. Use `text-error` for the notice.

- [ ] **Step 6: Verify manually**

Run: `npm run dev`. Pick a size and note its remaining count on `/buy-kit`.
1. Add that many, then try to add more.
   Expected: quantity caps at `remaining`, with a visible notice.
2. In the cart, hold the `+` button past the limit.
   Expected: it disables at `remaining`.
3. In DevTools run `localStorage.setItem("cart","{{{not json")` and reload.
   Expected: the site loads normally with an empty cart — no white screen.

- [ ] **Step 7: Commit**

```bash
git add src/types/index.ts src/context/CartContext.tsx src/pages/BuyKitPage.tsx src/pages/CartPage.tsx
git commit -m "fix: enforce stock ceilings in cart and recover from corrupted cart storage"
```

### Task 1.5: Single-source the donation fee [FRONTEND — F10]

`DonationPage.tsx:59-67` computes a 7% fee and the button says "Pay RWF 10,700", but the payload at lines 99–106 sends only the base amount. Then `DonationPage.tsx:118` stores the **pre-fee** total, which `DonationSuccessPage.tsx:108` displays as **"Total Paid"** — a receipt showing the wrong number.

**Files:**
- Modify: `src/pages/DonationPage.tsx:59-67, 99-106, 118`, `src/services/donation.service.ts:3-10`, `src/pages/DonationSuccessPage.tsx:108`

- [ ] **Step 1: Use the shared helper**

In `src/pages/DonationPage.tsx`, replace the inline fee arithmetic on lines 59–67 with `applyDonationFee` from `src/utils/pricing.ts` (created in Task 1.1).

- [ ] **Step 2: Send the charged amount explicitly**

Add `total_amount` to `CreateDonationDTO` in `src/services/donation.service.ts`:

```ts
export interface CreateDonationDTO {
  full_name: string;
  email: string;
  phone: string;
  amount: number;
  currency: "USD" | "RWF";
  quantity: number;
  /** Amount actually charged, including the processing fee. */
  total_amount: number;
}
```

Include it in the payload at `DonationPage.tsx:99-106` using `applyDonationFee(...)`.

**Then confirm with the backend owner (B5 handoff) which value it charges.** If the backend already adds its own fee, sending this would double-charge — resolve before deploying. This task is blocked on that answer.

- [ ] **Step 3: Store the post-fee amount for the receipt**

At `DonationPage.tsx:118`, store the **post-fee** total in `localStorage.lastDonation` so `DonationSuccessPage.tsx:108` renders a "Total Paid" that matches what the donor was actually charged.

- [ ] **Step 4: Verify manually**

Run: `npm run dev`. Open `/donate`, pick RWF 10,000, open the modal.
Expected: the button reads "Pay RWF 10,700"; after the flow the success page's "Total Paid" also reads 10,700, not 10,000.

- [ ] **Step 5: Commit**

```bash
git add src/pages/DonationPage.tsx src/services/donation.service.ts src/pages/DonationSuccessPage.tsx
git commit -m "fix: charge and display the same donation total including the processing fee"
```

### Task 1.6: Correct the free-kit messaging [FRONTEND — C2/C3]

`CartPage.tsx:34` is a plain `>= 4` boolean, so 20 kits shows the same "a free kit" message as 4.

**Files:**
- Modify: `src/pages/CartPage.tsx:32-35, 218-224`

- [ ] **Step 1: Use the shared helpers**

Replace the inline `qualifiesForFreeKit` / `kitsUntilFree` calculations on lines 32–35 with `freeKitsEarned` and `kitsUntilNextFree` from `src/utils/pricing.ts`.

- [ ] **Step 2: Pluralize the message**

Update the banner at lines 218–224 to say "You qualify for **N** free kits" when `freeKitsEarned(totalKitQuantity) > 1`, singular when 1.

**Only ship the banner at all if the backend confirms B5.** If free-kit issuance is not implemented server-side, delete the banner rather than promising something the system will not deliver.

- [ ] **Step 3: Verify**

Run: `npm test` — the pricing tests still pass.
Run: `npm run dev`, add 8 kits.
Expected: "You qualify for 2 free kits".

- [ ] **Step 4: Commit**

```bash
git add src/pages/CartPage.tsx
git commit -m "fix: free-kit banner reflects the actual number earned"
```

### Task 1.7: Shared Rwandan phone validation [FRONTEND — F13]

`CheckoutPage.tsx:100` does `parseInt(phone.replace(/\D/g,""), 10)`, which destroys the leading zero (`0780123456` → `780123456`) and yields `NaN` → `null` for input like `"call me"`. No form anywhere validates `+250`. A required sponsor phone (`SponsorsPage.tsx:558`) accepts `"asdf"`, making a multi-million-RWF lead uncontactable.

**Files:**
- Create: `src/utils/phone.ts`, `src/utils/phone.test.ts`
- Modify: `src/pages/CheckoutPage.tsx:100`, `src/pages/DonationPage.tsx:502-511`, `src/pages/RegisterVolunteerPage.tsx:148-155`, `src/pages/RegisterInfluencerPage.tsx:203-210`, `src/pages/SponsorsPage.tsx:556-565`

**Interfaces:**
- Produces: `normalizeRwandanPhone(input: string): string | null` (returns `+2507XXXXXXXX` or null), `isValidRwandanPhone(input: string): boolean`.

- [ ] **Step 1: Write the failing tests**

Create `src/utils/phone.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { normalizeRwandanPhone, isValidRwandanPhone } from "./phone";

describe("normalizeRwandanPhone", () => {
  it("accepts the common local format and preserves the leading zero", () => {
    expect(normalizeRwandanPhone("0780123456")).toBe("+250780123456");
  });

  it("accepts spaced international format", () => {
    expect(normalizeRwandanPhone("+250 780 123 456")).toBe("+250780123456");
  });

  it("accepts the country code without a plus", () => {
    expect(normalizeRwandanPhone("250780123456")).toBe("+250780123456");
  });

  it("accepts a bare nine-digit subscriber number", () => {
    expect(normalizeRwandanPhone("780123456")).toBe("+250780123456");
  });

  it("rejects non-numeric junk", () => {
    expect(normalizeRwandanPhone("call me")).toBeNull();
  });

  it("rejects numbers that are too short or too long", () => {
    expect(normalizeRwandanPhone("078012")).toBeNull();
    expect(normalizeRwandanPhone("07801234567890")).toBeNull();
  });

  it("rejects a valid-length number that is not a Rwandan mobile prefix", () => {
    expect(normalizeRwandanPhone("0123456789")).toBeNull();
  });
});

describe("isValidRwandanPhone", () => {
  it("agrees with the normalizer", () => {
    expect(isValidRwandanPhone("0780123456")).toBe(true);
    expect(isValidRwandanPhone("asdf")).toBe(false);
  });
});
```

- [ ] **Step 2: Run to confirm failure**

Run: `npm test`
Expected: FAIL — cannot resolve `./phone`.

- [ ] **Step 3: Implement**

Create `src/utils/phone.ts`:

```ts
/**
 * Rwandan mobile numbers are 9 subscriber digits beginning with 7
 * (MTN 78/79, Airtel 72/73), optionally prefixed with 0 or +250.
 */
const SUBSCRIBER = /^7[2389]\d{7}$/;

export function normalizeRwandanPhone(input: string): string | null {
  const digits = input.replace(/\D/g, "");

  let subscriber = digits;
  if (subscriber.startsWith("250")) subscriber = subscriber.slice(3);
  else if (subscriber.startsWith("0")) subscriber = subscriber.slice(1);

  if (!SUBSCRIBER.test(subscriber)) return null;
  return `+250${subscriber}`;
}

export function isValidRwandanPhone(input: string): boolean {
  return normalizeRwandanPhone(input) !== null;
}
```

- [ ] **Step 4: Run to confirm pass**

Run: `npm test`
Expected: PASS — all phone tests green.

- [ ] **Step 5: Apply to checkout**

In `src/pages/CheckoutPage.tsx`, replace the `parseInt(...)` on line 100 with `normalizeRwandanPhone(formData.phoneNumber)` and send the **string**. Block submission with an inline field error when it returns null.

Note this changes the wire type of `phone_number` from number to string — that is deliberate and matches backend item B9. Coordinate the deploy with the backend owner.

- [ ] **Step 6: Apply to the other four forms**

Add the same `isValidRwandanPhone` check with an inline error message ("Enter a valid Rwandan number, e.g. 0780123456") to `DonationPage.tsx`, `RegisterVolunteerPage.tsx`, `RegisterInfluencerPage.tsx`, and `SponsorsPage.tsx`. In the two forms where phone is optional, validate only when non-empty.

- [ ] **Step 7: Verify manually**

Run: `npm run dev`. In each of the five forms, enter `asdf`.
Expected: inline error, submission blocked. Then enter `0780123456`.
Expected: accepted.

- [ ] **Step 8: Commit**

```bash
git add src/utils/phone.ts src/utils/phone.test.ts src/pages/CheckoutPage.tsx src/pages/DonationPage.tsx src/pages/RegisterVolunteerPage.tsx src/pages/RegisterInfluencerPage.tsx src/pages/SponsorsPage.tsx
git commit -m "fix: validate and normalize Rwandan phone numbers across all forms"
```

---

# PHASE 2 — Reachability and resilience

### Task 2.1: Error boundary [FRONTEND — F5]

There is no error boundary anywhere. React 19 unmounts the whole tree on an uncaught render error, so one bad API response white-screens every visitor.

**Files:**
- Create: `src/components/ErrorBoundary.tsx`
- Modify: `src/main.tsx`

- [ ] **Step 1: Create the boundary**

Create `src/components/ErrorBoundary.tsx`:

```tsx
import { Component, type ReactNode } from "react";
import { eventInfo } from "../data";

interface Props { children: ReactNode }
interface State { hasError: boolean }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: { componentStack?: string | null }) {
    console.error("Unhandled render error:", error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center bg-surface px-6">
        <div className="max-w-md text-center">
          <h1 className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-on-surface mb-3">
            Something went wrong
          </h1>
          <p className="font-['Inter'] text-on-surface-variant mb-6">
            Sorry — this page failed to load. Please try again. If it keeps
            happening, contact us at{" "}
            <a href={`mailto:${eventInfo.email}`} className="text-primary underline">
              {eventInfo.email}
            </a>
            .
          </p>
          <button
            onClick={() => window.location.assign("/")}
            className="px-6 py-3 rounded-xl bg-primary text-on-primary font-semibold"
          >
            Back to home
          </button>
        </div>
      </div>
    );
  }
}
```

- [ ] **Step 2: Wrap the app**

Replace `src/main.tsx` with:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
```

- [ ] **Step 3: Verify it catches**

Temporarily add `throw new Error("boundary test");` at the top of `HomePage`'s render, run `npm run dev`, load `/`.
Expected: the fallback UI, not a blank page. **Remove the throw before committing.**

- [ ] **Step 4: Commit**

```bash
git add src/components/ErrorBoundary.tsx src/main.tsx
git commit -m "feat: add error boundary so a render failure does not white-screen the site"
```

### Task 2.2: 404 routes [FRONTEND — F6]

No `path="*"` exists on the public branch, so a typo'd or stale WhatsApp link renders navbar + empty `<main>` + footer. The dashboard's catch-all silently renders `DashboardPage`, which is what turns every broken sidebar link into an invisible bug.

**Files:**
- Create: `src/pages/NotFoundPage.tsx`
- Modify: `src/App.tsx:56` and after `:82`

- [ ] **Step 1: Create the page**

Create `src/pages/NotFoundPage.tsx` — a centered layout with "404", "We can't find that page", and buttons to `/` and `/buy-kit`. Use `font-['Plus_Jakarta_Sans']` for the heading and the `text-on-surface` / `text-on-surface-variant` / `bg-primary` tokens, matching `ErrorBoundary`.

- [ ] **Step 2: Register both routes**

In `src/App.tsx`, add as the final public route after line 82:
```tsx
<Route path="*" element={<NotFoundPage />} />
```

And replace the dashboard catch-all on line 56 with a redirect, so a bad admin URL lands somewhere honest:
```tsx
<Route path="/dashboard/*" element={<Navigate to="/dashboard" replace />} />
```
Add `Navigate` to the react-router-dom import on lines 1–6.

- [ ] **Step 3: Verify**

Run: `npm run dev`. Visit `/this-does-not-exist`.
Expected: the 404 page, not a blank middle.

- [ ] **Step 4: Commit**

```bash
git add src/pages/NotFoundPage.tsx src/App.tsx
git commit -m "feat: add 404 page and stop the dashboard catch-all hiding bad links"
```

### Task 2.3: Route the orphaned admin pages [FRONTEND — F11]

`InventoryPage.tsx` (14 KB) and `DashboardInfluencersPage.tsx` (27 KB) are fully built and never routed, while `Sidebar.tsx:56,71` links to them. Consequence: **there is no working UI to restock inventory**, and influencer registrations are collected with no screen to view them.

**Files:**
- Modify: `src/App.tsx`, `src/components/dashboard/Sidebar.tsx:48-52, 73-82`, `src/pages/InventoryPage.tsx:111-138, 174-189`

- [ ] **Step 1: Add the two routes**

In `src/App.tsx`, add the imports:
```tsx
import { InventoryPage } from "./pages/InventoryPage";
import { DashboardInfluencersPage } from "./pages/DashboardInfluencersPage";
```
and the routes inside the dashboard `<Routes>`:
```tsx
<Route path="/dashboard/inventory" element={<InventoryPage />} />
<Route path="/dashboard/influencers" element={<DashboardInfluencersPage />} />
```

Check the export style of each file first — if either is a default export, adjust the import accordingly.

- [ ] **Step 2: Remove the three sidebar links with no destination**

In `src/components/dashboard/Sidebar.tsx`, delete the `navItems` entries for **Payments** (`/dashboard/payments`), **Reports** (`/dashboard/reports`), and **Settings** (`/dashboard/settings`). No pages exist for these; a link that silently renders the dashboard overview is worse than no link. Re-add them when the pages are built.

- [ ] **Step 3: Add error handling to the inventory writes**

`InventoryPage.tsx:111-138` (`handleRestock`) and `:174-189` (`handleAddSize`) have **no try/catch**. A failed restock leaves the modal open with no error, and the admin believes stock was updated when it was not. Wrap both in try/catch, surface the error inline, and keep the modal open on failure.

- [ ] **Step 4: Verify**

Run: `npm run dev`, log in, click every remaining sidebar item.
Expected: all eight land on their own distinct page; none silently renders the dashboard overview.

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx src/components/dashboard/Sidebar.tsx src/pages/InventoryPage.tsx
git commit -m "fix: route inventory and influencer admin pages, drop links with no destination"
```

### Task 2.4: Make the free-kit funnel reachable [FRONTEND — F12]

`/redeem-kit` is routed but nothing in the entire UI links to it. A customer who deletes the confirmation email cannot claim a kit they paid for.

**Files:**
- Modify: `src/pages/OrderSuccessPage.tsx`, `src/components/Navbar.tsx:14-22`, `src/pages/CartPage.tsx:218-224`, `src/pages/RedeemKitPage.tsx:45`

- [ ] **Step 1: Link it from the three natural entry points**

Add a "Claim your free kit" link to `/redeem-kit`: on the verified branch of `OrderSuccessPage` (only when the order qualified), in the `CartPage` free-kit banner, and in the `Navbar` `navLinks` array.

- [ ] **Step 2: Fix the silent stock failure**

`RedeemKitPage.tsx:45` does `.catch(() => setStocks([]))`, so a failed stock fetch leaves a permanent "Loading sizes…" with no explanation. Add an error state with a retry button.

- [ ] **Step 3: Verify**

Run: `npm run dev`, add 4 kits to the cart.
Expected: the banner includes a working link to `/redeem-kit`.

- [ ] **Step 4: Commit**

```bash
git add src/pages/OrderSuccessPage.tsx src/components/Navbar.tsx src/pages/CartPage.tsx src/pages/RedeemKitPage.tsx
git commit -m "feat: make the free-kit redemption page reachable from the UI"
```

### Task 2.5: Dashboard resilience and the currency bug [FRONTEND — F15]

Three defects: `useDashboardData.ts:120-129` uses `Promise.all`, so one failing endpoint blanks the entire dashboard; `DashboardPage.tsx:107-140` renders real-looking zeros during an outage because tiles are gated on `loading` but not `error`; and `DashboardPage.tsx:111` computes `totalRevenue = orderRevenue + totalRWF`, summing `amount_paid` across **all** paid orders regardless of their `currency`, so any USD order inflates the RWF total 1:1.

**Files:**
- Modify: `src/hooks/useDashboardData.ts:107-141`, `src/pages/DashboardPage.tsx:100-150`

- [ ] **Step 1: Degrade gracefully**

Switch `Promise.all` to `Promise.allSettled` and track which sections failed, so a single bad endpoint degrades one panel instead of the whole page.

- [ ] **Step 2: Never render fabricated zeros**

Gate the KPI tile values on `error` as well as `loading` — show an em dash, not `0 RWF`, when the data could not be loaded.

- [ ] **Step 3: Stop adding USD to RWF**

Filter `paidOrders` by `currency` before summing, and display RWF and USD as separate figures. Do not convert between them with a hardcoded rate.

- [ ] **Step 4: Verify**

Run: `npm run dev`, open DevTools → Network → set "Offline", load `/dashboard`.
Expected: an error banner and em dashes — no `0 RWF` presented as fact.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useDashboardData.ts src/pages/DashboardPage.tsx
git commit -m "fix: dashboard degrades per-section and stops mixing USD into RWF totals"
```

### Task 2.6: Resolve the type drift [FRONTEND — F14]

`useDashboardData.ts:4-83` redeclares five interfaces that already exist in the service files, each narrower than the real payload. `DashboardPage.tsx:8` imports `Volunteer`/`Influencer` from the hook, so `v.affiliation` is a compile error even though the API returns it. Separately, two unrelated types are both called `Order` (`types/index.ts:34` and `useDashboardData.ts:19`). And two declared types contradict the wire: `Product.price` is declared `number` but arrives as the string `"25000"`, and `DonationStats.totalUSD/totalRWF` are declared `number` but arrive as strings.

**Files:**
- Modify: `src/types/index.ts:1-9, 34-41`, `src/services/donation.service.ts:31-32`, `src/hooks/useDashboardData.ts:4-83`, `src/pages/DashboardPage.tsx:8`

- [ ] **Step 1: Make the declared types match the wire**

In `src/types/index.ts`, change `Product.price` to `string`. In `src/services/donation.service.ts:31-32`, change `totalUSD` and `totalRWF` to `string`.

- [ ] **Step 2: Rename the colliding type**

Rename `Order` in `src/types/index.ts:34` to `LocalOrderReceipt` (it is the localStorage receipt shape, unrelated to the API's order). Update `CheckoutPage.tsx` and `OrderSuccessPage.tsx`.

- [ ] **Step 3: Delete the duplicates**

Remove the local `StockItem`, `Order`, `Donation`, `Sponsor`, `Volunteer`, `Influencer`, and `DonationStats` interfaces from `useDashboardData.ts` and re-export the service-file versions instead.

- [ ] **Step 4: Fix the fallout**

Run: `npm run build`. Every site where a now-`string` price or stat is used in arithmetic without `Number()` becomes a type error — that is the point. Wrap each in `Number()`.

Expected: build passes with zero errors.

- [ ] **Step 5: Commit**

```bash
git add src/types/index.ts src/services/donation.service.ts src/hooks/useDashboardData.ts src/pages/DashboardPage.tsx src/pages/CheckoutPage.tsx src/pages/OrderSuccessPage.tsx
git commit -m "refactor: align declared types with the API and remove duplicate interfaces"
```

---

# PHASE 3 — DevOps and launch polish

### Task 3.1: Environment-based API URL [DEVOPS — D1]

`src/services/api.ts:4-6` hardcodes the production URL with a commented-out localhost line. Switching environments requires editing and committing source.

**Files:**
- Create: `.env.example`, `.env.development`
- Modify: `src/services/api.ts:1-12`, `.gitignore`

- [ ] **Step 1: Parameterize**

Replace lines 3–12 of `src/services/api.ts` with:

```ts
const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL ?? "https://kcw.enjoyrwanda.rw/api",
  headers: { "Content-Type": "application/json" },
  timeout: 20000,
});
```

Two deliberate changes beyond the URL: the `ngrok-skip-browser-warning` header is **removed** (an ngrok leftover that forces a CORS preflight on every call), and the timeout goes from 10 s to 20 s, since a checkout POST from a congested Rwandan mobile network timing out mid-payment is the worst possible failure mode.

- [ ] **Step 2: Add env files**

Create `.env.example`:
```
# Public — inlined into the client bundle. Never put secrets here.
VITE_API_BASE_URL=https://kcw.enjoyrwanda.rw/api
```

Create `.env.development`:
```
VITE_API_BASE_URL=http://localhost:5000/api
```

Append to `.gitignore`:
```
.env*.local
```

- [ ] **Step 3: Set it in Vercel**

In the Vercel project → Settings → Environment Variables, add `VITE_API_BASE_URL` = `https://kcw.enjoyrwanda.rw/api` for Production and Preview. **Preview deployments get a `*.vercel.app` origin, which the backend's CORS allowlist currently rejects with a 500 — this is why backend item B2 must land first or previews will be entirely broken.**

- [ ] **Step 4: Verify**

Run: `npm run build && npx vite preview`
Open the site, DevTools → Network. Expected: requests go to `kcw.enjoyrwanda.rw`, and no `ngrok-skip-browser-warning` header is sent.

- [ ] **Step 5: Commit**

```bash
git add .env.example .env.development .gitignore src/services/api.ts
git commit -m "chore: configure API base URL by environment and drop the ngrok header"
```

### Task 3.2: Code splitting [DEVOPS — D2]

The whole app is one 1.7 MB chunk (519 KB gzipped) because every route is statically imported in `App.tsx:10-34`. Every public visitor downloads the admin dashboard, recharts, jspdf, xlsx, and html2canvas to read the homepage — roughly 8–15 s to first render on Rwandan mobile.

**Files:**
- Modify: `src/App.tsx:10-34`, `vite.config.ts`

- [ ] **Step 1: Record the baseline**

Run: `npm run build`
Note the `dist/assets/index-*.js` size. Baseline: **1,698 kB raw / 519 kB gzip**.

- [ ] **Step 2: Lazy-load the dashboard and secondary public routes**

In `src/App.tsx`, convert every `Dashboard*Page`, `InventoryPage`, plus `CheckoutPage`, `RedeemKitPage`, `SponsorsPage`, and `FAQPage` to `React.lazy`:

```tsx
import { lazy, Suspense } from "react";

const DashboardPage = lazy(() =>
  import("./pages/DashboardPage").then((m) => ({ default: m.DashboardPage })),
);
```

(The `.then` mapping is required because these are named exports, not default exports.)

Keep `HomePage`, `Navbar`, and `Footer` eager — they are the first paint.

Wrap **both** `<Routes>` blocks in `<Suspense fallback={<PageLoader />}>`, where `PageLoader` is a small centered spinner using `text-primary`.

- [ ] **Step 3: Add vendor chunks**

In `vite.config.ts`, inside `defineConfig`, add:

```ts
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          motion: ['framer-motion'],
        },
      },
    },
  },
```

`framer-motion` is imported by 27 of ~60 source files, so it cannot be lazy-loaded away — but it can at least be a separately cached vendor chunk.

- [ ] **Step 4: Measure**

Run: `npm run build`
Expected: the main chunk drops well below 500 kB raw, recharts/jspdf/xlsx/html2canvas move into separate lazy chunks, and Vite's "Some chunks are larger than 500 kB" warning disappears. Record the new numbers in the commit message.

- [ ] **Step 5: Verify nothing broke**

Run: `npx vite preview`. Click through every public route, then log in and click every dashboard route.
Expected: brief spinner on first visit to each lazy route, then normal rendering. No blank screens.

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx vite.config.ts
git commit -m "perf: code-split dashboard and secondary routes out of the initial bundle"
```

### Task 3.3: Compress images [DEVOPS — D4]

`src/assets` is 5.2 MB. `RCKV-logo.png` is 903 KB for a logo; `KCW-ANIMATE--02.jpeg` is 2.3 MB and is not referenced anywhere; `heroImage.jpeg` is 429 KB above the fold; `KCW-LOGO.png` (252 KB) exists as a byte-identical duplicate in both `src/assets` and `public`.

**Files:**
- Modify/delete: files under `src/assets/`, `public/`, `index.html:5`

- [ ] **Step 1: Delete what is unused**

Confirm with `grep -rn "KCW-ANIMATE" src/` that it has no references, then `git rm src/assets/KCW-ANIMATE--02.jpeg`. Do the same check for `certificate_KCW.pdf` (1.1 MB) — if the certificate is generated client-side by jspdf, the static PDF is dead weight.

- [ ] **Step 2: Compress the rest**

```bash
brew install webp   # if not present
cwebp -q 82 src/assets/heroImage.jpeg -o src/assets/heroImage.webp
cwebp -q 90 src/assets/RCKV-logo.png -o src/assets/RCKV-logo.webp
cwebp -q 90 src/assets/KCW-LOGO.png -o src/assets/KCW-LOGO.webp
```

Update the importing components to reference the `.webp` files. Target: `RCKV-logo` under 40 KB, hero under 100 KB.

- [ ] **Step 3: Fix the favicon**

`index.html:5` uses the 252 KB `KCW-LOGO.png` as a favicon while an unused 9.5 KB `public/favicon.svg` already exists. Change line 5 to:
```html
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
```

- [ ] **Step 4: Verify**

Run: `npm run build`
Expected: total `dist/assets` image weight under 400 KB (from ~1.6 MB). Run `npx vite preview` and confirm every logo and the hero still render.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "perf: compress images to webp and drop unused 3.4MB of assets"
```

### Task 3.4: Social sharing metadata [DEVOPS — D3]

`index.html` has no Open Graph or Twitter tags. Every WhatsApp and Facebook share of this event currently renders as a bare URL with no image, title, or description — and social sharing is the primary distribution channel for a community walk. This is the cheapest high-impact item in the plan.

**Files:**
- Create: `public/og-image.jpg`
- Modify: `index.html:3-13`

- [ ] **Step 1: Produce the share image**

Create a 1200×630 JPEG at `public/og-image.jpg` — event name, date, and logo on brand purple (`#5e0081`). Keep it under 300 KB.

- [ ] **Step 2: Add the tags**

Insert into `<head>` in `index.html`, replacing `https://YOUR-DOMAIN` with the real production domain:

```html
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://YOUR-DOMAIN/" />
    <meta property="og:title" content="Kigali Cancer Walk 2026 — Walking Together Against Cancer" />
    <meta property="og:description" content="Join us in Kigali to raise funds for Rwanda's first SPECT scanner. Buy a kit, donate, or volunteer." />
    <meta property="og:image" content="https://YOUR-DOMAIN/og-image.jpg" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:locale" content="en_RW" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="Kigali Cancer Walk 2026" />
    <meta name="twitter:description" content="Walking together against cancer. Kigali, Rwanda." />
    <meta name="twitter:image" content="https://YOUR-DOMAIN/og-image.jpg" />
```

`og:image` **must be an absolute URL** — relative paths silently fail on Facebook and WhatsApp.

- [ ] **Step 3: Verify after deploying**

Paste the deployed URL into Facebook's Sharing Debugger (developers.facebook.com/tools/debug/) and send it to yourself on WhatsApp.
Expected: a card with the image, title, and description.

- [ ] **Step 4: Commit**

```bash
git add index.html public/og-image.jpg
git commit -m "feat: add Open Graph and Twitter card metadata for social sharing"
```

### Task 3.5: Vercel headers and repo hygiene [DEVOPS — D5, D7]

**Files:**
- Modify: `vercel.json`, `README.md`
- Delete: `public/_redirects`

- [ ] **Step 1: Add caching and security headers**

Replace `vercel.json` with:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/" }],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    },
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Strict-Transport-Security", "value": "max-age=63072000; includeSubDomains" }
      ]
    }
  ]
}
```

Vite content-hashes `/assets/*` filenames, so immutable caching is safe.

- [ ] **Step 2: Delete the dead Netlify config**

`public/_redirects` is a Netlify file that Vercel ignores; it ships as a dead 19-byte file in `dist/`.
```bash
git rm public/_redirects
```

- [ ] **Step 3: Replace the template README**

`README.md` is still the unmodified Vite boilerplate — and its title reads "Kigali Can**cel** Walk", matching the directory typo. Replace it with: what the project is, `npm install / dev / build / lint / test`, the `VITE_API_BASE_URL` variable, the fact that the backend is a separate remote service, and a pointer to `docs/BACKEND-REQUIREMENTS.md`.

- [ ] **Step 4: Verify**

Run: `npm run build && npx vite preview`, then deep-link to `/donate` and refresh.
Expected: the page loads (the rewrite still works).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: add security headers and asset caching, document the project"
```

### Task 3.6: Content and copy fixes [FRONTEND — F16]

Every item here needs a real answer from the client. **Do not invent values.**

**Files:**
- Modify: `src/data/index.ts:46-61`, `src/components/CountdownTimer.tsx:8`, `src/pages/FAQPage.tsx:100`, `src/components/Footer.tsx:22,28,34,130,136`, `src/pages/ContactPage.tsx:164,170,176`, `src/pages/DonationPage.tsx:302`

- [ ] **Step 1: Fix the event date and its timezone**

`src/data/index.ts:56` says `date: "TBD"` while `CountdownTimer.tsx:8` counts down to `new Date("2026-08-09T07:00:00")`. The site simultaneously says the date is unknown and counts down to a specific one. Worse, that string has **no timezone**, so it parses in the viewer's local time — a supporter in London sees a countdown two hours off from Kigali.

Set the real date in `eventInfo.date`, and make the countdown explicit:
```ts
const EVENT_DATE = new Date("2026-08-09T07:00:00+02:00");
```

- [ ] **Step 2: Fix the homepage statistics**

`src/data/index.ts:46-51` claims `participants: "200k+"` — not credible for a Kigali walk and reads as unedited template data. Worse, `fundsRaised: "10+"` is rendered under a label reading **"Partners "** in `StatsSection.tsx:16` — a straight mismatch between the value's name and its label. Both labels also carry stray double/trailing spaces (`StatsSection.tsx:10,16`).

Get real figures from the client, or delete the section.

- [ ] **Step 3: Unify the support address**

`src/data/index.ts:59` uses `sales@rgtickets.com` (a ticketing vendor's *sales* inbox) while `FAQPage.tsx:100` hardcodes `info@kigalicancerwalk.rw`. Pick one — ideally the charity address — source it from `eventInfo.email` everywhere, and confirm someone monitors it on event day. Align it with the sender address from backend item B6.

- [ ] **Step 4: Fix the legal links**

`Footer.tsx:130,136` render Privacy Policy and Terms of Service as `<Link to="#">`, which in react-router v7 navigates to a non-matching path and renders a blank page. For a site collecting names, phone numbers, and payments, missing legal pages are also a compliance gap. Either create `/privacy` and `/terms` pages, or remove the links until the content exists.

- [ ] **Step 5: Fix or remove the placeholder social icons**

Six `href="#"` links: `Footer.tsx:22,28,34` and `ContactPage.tsx:164,170,176`. Point them at real profiles or remove them.

- [ ] **Step 6: Confirm the off-site donation link**

`DonationPage.tsx:302` sends donors to `https://fund-spect-scan-campaign.vercel.app/donate` — an unbranded `*.vercel.app` domain. Sending donors off a branded charity site to a raw preview-style URL reads as phishing. Confirm it is intentional; if it is, move it to a subdomain of the main site.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "content: correct event date, statistics, contact address, and placeholder links"
```

### Task 3.7: Error UX and dead code [FRONTEND — F17, F18]

- [ ] **Step 1: Replace blocking dialogs**

Replace `alert()` with inline UI at `BuyKitPage.tsx:48,55,61,67`, `CartPage.tsx:449,454,459,464`, `CheckoutPage.tsx:113,124,126`, `LoginPage.tsx:77,79`, `DashboardOrdersPage.tsx:108`, `RecentOrdersTable.tsx:210`. Note `BuyKitPage` uses `alert()` even for *success* ("Added to cart!").

- [ ] **Step 2: Stop discarding error details**

About twenty `catch {}` blocks discard the error entirely, so a 401 and a network timeout produce the same "check your connection" message. Capture the error and surface the server's message where there is one. Priority sites: `RegisterVolunteerPage.tsx:51`, `RegisterInfluencerPage.tsx:111`, `SponsorsPage.tsx:195`, `CheckoutPage.tsx:126`.

- [ ] **Step 3: Distinguish empty from failed**

`CartPage.tsx:23` (`.catch(() => setBuddyGroups([]))`) renders "No buddy groups available" identically to a genuine empty list, so a transient outage tells users to pick another method. Same at `DashboardOrdersPage.tsx:73`.

- [ ] **Step 4: Fix the sponsor confirmation**

`SponsorsPage.tsx:190-194` auto-dismisses the only acknowledgement of a multi-million-RWF sponsorship after 6 seconds, then wipes the form. Replace with a persistent confirmation carrying a reference number.

- [ ] **Step 5: Delete orphan components**

```bash
git rm src/components/dashboard/ParticipantsCheckIn.tsx src/components/dashboard/RevenueChart.tsx
```
Both are unreferenced (verified by import scan) and both import recharts.

- [ ] **Step 6: Fix the dead donation stepper**

`DonationPage.tsx:195-213` wraps both `−`/`+` in `if (isSelected)`, but `isSelected` is only true after the modal opens — and `openModal` then resets quantity to 1 at line 82, discarding it. Either make the card stepper work or remove it.

- [ ] **Step 7: Accessibility labels**

Add `aria-label` to icon-only buttons — starting with the password toggle at `LoginPage.tsx:154-164`, `Header.tsx:12,52`, `ExportMenu.tsx:100`, `RedeemKitPage.tsx:146,259`. (All `<img>` tags already have `alt` text — that part is clean.)

- [ ] **Step 8: Fix the dashboard mobile sidebar**

`DashboardPage.tsx:157` passes `onMenuClick={() => {}}` and the other dashboard pages render `<Header />` with no prop, while `Sidebar`'s `isMobileOpen` is never set true by anything. **The dashboard sidebar cannot be opened at all below the `lg` breakpoint.** Lift that state so the hamburger works.

- [ ] **Step 9: Verify and commit**

Run: `npm run lint` — error count should be materially below the 29 baseline.
Run: `npm run build && npm test` — both pass.

```bash
git add -A
git commit -m "fix: inline error UX, real error messages, and remove dead components"
```

---

# Implementation sequencing

**Start here, in this order.** The dependencies are real, not stylistic.

| Order | Work | Owner | Gate |
|---|---|---|---|
| 1 | Task 0.1 — send the backend spec | You → backend | Do this first; B1 and B2 are someone else's clock |
| 2 | Tasks 0.2, 0.3 — delete the two dangerous pages | Frontend | No dependencies, ~20 min, pure risk removal |
| 3 | Tasks 0.4, 0.5 — auth guard, 401 interceptor, logout | Frontend | Depends on `src/utils/auth.ts` from 0.4 |
| 4 | **Backend confirms B1 + B2** | Backend | **Hard gate — do not deploy anywhere until B2 lands, or previews 500** |
| 5 | Task 1.1 — Vitest + pricing helpers | Frontend | Tasks 1.5 and 1.6 import from it |
| 6 | Tasks 1.2, 1.3, 1.4 — cart and order-success money bugs | Frontend | 1.2 and 1.3 both touch OrderSuccessPage; do 1.2 first |
| 7 | Tasks 1.5, 1.6 — donation fee, free-kit messaging | Frontend | **Blocked on backend answers to B4 and B5** |
| 8 | Task 1.7 — phone validation | Frontend | Coordinate with backend B9 (number → string) |
| 9 | Tasks 2.1–2.6 — resilience, routing, types | Frontend | 2.1 before 2.2; rest independent |
| 10 | Tasks 3.1, 3.2 — env config, code splitting | DevOps | 3.1 before any deploy; 3.2 after routes are final |
| 11 | Tasks 3.3, 3.4, 3.5 — images, Open Graph, headers | DevOps | Independent, parallelizable |
| 12 | Tasks 3.6, 3.7 — content and polish | Frontend | 3.6 **blocked on client** for the real date and statistics |

**Parallelization.** Steps 2–3 (frontend security) and step 1 (backend) run concurrently — that is the whole point of splitting them. Within step 11, the three DevOps tasks touch disjoint files and can be done by separate people.

**Three hard gates:**
1. **Backend B2 before any deploy.** A Vercel preview gets a `*.vercel.app` origin, which the current CORS allowlist answers with a 500. Deploy before B2 and the preview is a dead site.
2. **Backend B4/B5 answers before Tasks 1.5 and 1.6.** If the backend already adds its own 7% fee, sending `total_amount` double-charges donors. If it does not issue free-kit tokens, the banner must be deleted, not corrected.
3. **Client answers before Task 3.6.** The event date and the participant statistics are facts we do not have. Shipping "200k+ participants" or a countdown to a date nobody confirmed is worse than shipping neither.

**Definition of done for launch.** All Phase 0 and Phase 1 tasks complete; backend B1–B4 verified with the curl acceptance tests in `docs/BACKEND-REQUIREMENTS.md`; `npm run build`, `npm run lint`, and `npm test` all green; and one full manual pass buying a kit and making a donation with real money on the production domain, from a phone on mobile data.

**Explicitly out of scope for launch:** building Payments, Reports, and Settings dashboard pages (their sidebar links are removed in Task 2.3 instead); migrating the auth token from `localStorage` to an httpOnly cookie (worth doing, but it is a backend-shaped change and B1 is the urgent part); and rewriting git history to purge the ~11 MB of committed images.
