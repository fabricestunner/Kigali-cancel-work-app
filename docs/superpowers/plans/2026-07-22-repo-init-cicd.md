# Repository Initialization and CI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Initialize two clean repositories — the frontend at `fabricestunner/Kigali-cancel-work-app` and a restored backend at `fabricestunner/kcw-backend` — each with green CI, without touching production.

**Architecture:** The backend source is recovered from `backend/.git-bak` and moved *out* of the frontend tree before any frontend commit, eliminating a nested-repo hazard that would otherwise publish private backend code into a public repo. The frontend then gets hygiene files, a corrected `CLAUDE.md`, and an initial commit. CI is added build-first; the 29 pre-existing lint errors are cleared in themed batches, and only then is the lint gate switched on, so CI is never red.

**Tech Stack:** React 19, TypeScript ~6.0, Vite 8 (rolldown), Tailwind v4, ESLint 10 — frontend. Express 5, Prisma 5, PostgreSQL — backend. GitHub Actions for CI. Node 26 local / Node 22 LTS in CI.

## Global Constraints

- **Production is untouched.** No deployment, no Vercel changes, no DNS changes, no database access, no migrations.
- **No pushes** to `aimableshyaka/Kigali-cancel-walk`. It serves the live site.
- **Do not delete** the parent directory `/Kigali-cancel-walk` or its `.git`.
- **No `git push --force`** in any repository.
- **Commit author must be `fabricestunner <fabrice.stunner@gmail.com>`.** Never add a `Co-Authored-By: Claude` trailer to any commit.
- **Never commit secrets.** Only `.env.example` (variable names, no values) is tracked.
- The frontend repo is **public**; the backend repo is **private**.
- Verification commands must actually be run and their output read. Never claim a step passed without seeing it pass.

## File Structure

**Frontend** (`/Kigali-cancel-walk/Kigali-cancel-work-app`):
- `.gitignore` — already created and committed
- `.env.example` — create: documents `VITE_API_BASE_URL`
- `README.md` — replace: currently the stock Vite template text
- `CLAUDE.md` — rewrite: currently describes a monorepo that does not exist
- `.github/workflows/ci.yml` — create: lint + build jobs
- `src/**` — 15 files edited for lint compliance (Tasks 4–7)

**Backend** (`/Kigali-cancel-walk/kcw-backend`, created in Task 1):
- Restored working tree, 44 files at `6bb2318`
- `.gitignore` — fix: currently ignores itself
- `.env.example` — create: 15 variable names
- `.github/workflows/ci.yml` — create: prisma generate + build

---

### Task 1: Restore the backend out of the frontend tree

Must run first. Until `backend/` is gone, any `git add -A` in the frontend stages `backend/.git-bak` — the private backend's complete git object database — into a public repo.

**Files:**
- Create: `/Kigali-cancel-walk/kcw-backend/` (44 files + `.git`)
- Delete: `/Kigali-cancel-walk/Kigali-cancel-work-app/backend/`

**Interfaces:**
- Produces: a working backend repo at `../kcw-backend` with `HEAD` = `6bb2318`, consumed by Tasks 8–9.

- [ ] **Step 1: Verify the source objects are intact before touching anything**

```bash
cd /Users/ganziteka/Documents/Projects/2026/RG/Kigali-cancel-walk/Kigali-cancel-work-app
git --git-dir=backend/.git-bak cat-file -t 6bb2318
git --git-dir=backend/.git-bak ls-tree -r --name-only HEAD | wc -l
```

Expected: `commit`, then `44`. If either differs, STOP — the backup is damaged and the source is unrecoverable.

- [ ] **Step 2: Create the sibling directory and move the git database into place**

```bash
cd /Users/ganziteka/Documents/Projects/2026/RG/Kigali-cancel-walk
mkdir -p kcw-backend
cp -R Kigali-cancel-work-app/backend/.git-bak kcw-backend/.git
```

`cp`, not `mv` — the original stays until the restore is confirmed.

- [ ] **Step 3: Check out the working tree**

```bash
cd /Users/ganziteka/Documents/Projects/2026/RG/Kigali-cancel-walk/kcw-backend
git checkout -f main 2>/dev/null || git checkout -f 6bb2318 -- .
git status --short | head
ls
```

Expected: `package.json`, `prisma/`, `src/`, `tsconfig.json` present.

- [ ] **Step 4: Verify the restore is complete and faithful**

```bash
cd /Users/ganziteka/Documents/Projects/2026/RG/Kigali-cancel-walk/kcw-backend
test "$(git ls-files | wc -l | tr -d ' ')" = "44" && echo "FILE COUNT OK" || echo "MISMATCH"
git status --porcelain
```

Expected: `FILE COUNT OK` and empty `git status` output (clean tree, nothing modified or missing).

- [ ] **Step 5: Set the author identity for this repo**

```bash
cd /Users/ganziteka/Documents/Projects/2026/RG/Kigali-cancel-walk/kcw-backend
git config user.name "fabricestunner"
git config user.email "fabrice.stunner@gmail.com"
```

The global config is `Stunner`; without this the backend commits get the wrong author.

- [ ] **Step 6: Remove the stale origin**

```bash
git remote remove origin
git remote -v
```

Expected: no output. `graceniyigena34/kcw-backend` does not resolve for this account; leaving it risks a push attempt at the wrong repo.

- [ ] **Step 7: Delete the old backend directory from the frontend tree**

Only now that the restore is verified:

```bash
cd /Users/ganziteka/Documents/Projects/2026/RG/Kigali-cancel-walk/Kigali-cancel-work-app
rm -rf backend
test ! -e backend && echo "REMOVED"
```

Expected: `REMOVED`.

- [ ] **Step 8: Confirm the frontend no longer stages backend files**

```bash
cd /Users/ganziteka/Documents/Projects/2026/RG/Kigali-cancel-walk/Kigali-cancel-work-app
git add -A --dry-run 2>/dev/null | grep -c 'backend/' || echo "0 backend files — SAFE"
```

Expected: `0 backend files — SAFE`.

No commit in this task — nothing was committed to the frontend, and the backend's first commit comes in Task 8.

---

### Task 2: Frontend hygiene files and initial commit

**Files:**
- Create: `.env.example`
- Modify: `README.md` (full replacement)
- Modify: `CLAUDE.md` (full replacement)

**Interfaces:**
- Consumes: a `backend/`-free tree from Task 1.
- Produces: the frontend's initial commit, consumed by Task 3.

- [ ] **Step 1: Create `.env.example`**

```bash
VITE_API_BASE_URL=https://kcw.enjoyrwanda.rw/api
```

Add this comment above it in the file:

```bash
# Base URL for the backend API. Falls back to the production URL in
# src/services/api.ts when unset.
#
# WARNING: every VITE_* value is inlined into the public JavaScript bundle.
# Never put a secret, key, or token in a VITE_* variable.
VITE_API_BASE_URL=https://kcw.enjoyrwanda.rw/api
```

- [ ] **Step 2: Create the untracked local env file**

```bash
cp ../.env.development .env.local
grep -c VITE_API_BASE_URL .env.local
git check-ignore .env.local && echo "IGNORED - correct"
```

Expected: `1`, then `IGNORED - correct`. If `.env.local` is not ignored, STOP and fix `.gitignore` before committing.

- [ ] **Step 3: Replace `README.md`**

The current file is the unmodified Vite starter template ("This template provides a minimal setup…"). Replace with a real README covering: what the project is (Kigali Cancer Walk 2026 — public site + admin dashboard), prerequisites (Node 22+), setup (`npm install`, copy `.env.example` to `.env.local`), the four scripts that actually exist (`dev`, `build`, `lint`, `preview`), a note that the backend is a separate repo (`fabricestunner/kcw-backend`), and a **Deployment** section stating plainly that this repo is not yet wired to a deployment and that production currently builds from a different repository.

- [ ] **Step 4: Rewrite `CLAUDE.md` to match reality**

The existing file documents things that do not exist in this repo. Every one of these claims must be removed or corrected:

| Claim in current `CLAUDE.md` | Reality |
|---|---|
| `npm run dev:backend`, `build:backend`, `start:backend`, `db:*`, `build:all` | None exist. `package.json` has exactly four scripts: `dev`, `build`, `lint`, `preview`. |
| "backend lives in `backend/` as an npm workspace" | No workspaces. Backend is a separate repo. |
| "`npm install` installs both frontend and backend workspace dependencies" | Single package. |
| `npm test` / `npm run test:watch` / Vitest suite / `vitest.config.ts` | No test suite, no Vitest dependency, no config file. |
| `src/utils/pricing.test.ts` | Does not exist. |
| `OrderSuccessPage` has a `verifyStatus` state machine and a ref guard | It has neither — see `src/pages/OrderSuccessPage.tsx:44-56`, a plain effect keyed on `[transactionToken]`. |

Keep and preserve the sections that *are* accurate: the two-apps-in-one-router split, the Tailwind semantic-token rule, the data layer / `src/services/api.ts` description, the cart, static content, exports, component conventions, and the DPO redirect flow. Add a note that lint currently gates CI (true after Task 8).

- [ ] **Step 5: Delete the stray `.DS_Store`**

```bash
rm -f .DS_Store
git check-ignore .DS_Store 2>/dev/null || echo "not present - fine"
```

- [ ] **Step 6: Review the full staged file list before committing**

```bash
git add -A
git diff --cached --name-only | wc -l
git diff --cached --name-only | grep -cE '^(node_modules|dist|backend)/' || echo "0 excluded-path files — SAFE"
git diff --cached --name-only | grep -iE '\.env$|\.env\.local|secret|\.pem|\.key' || echo "no secrets — SAFE"
```

Expected: a count around 135, then `0 excluded-path files — SAFE`, then `no secrets — SAFE`. **Read this output.** If anything under `node_modules/`, `dist/`, or `backend/` appears, STOP and fix `.gitignore`.

- [ ] **Step 7: Commit**

```bash
git commit -m "chore: initialize repository

Adds environment example, a real README, and corrects CLAUDE.md, which
documented npm workspaces, backend scripts and a Vitest suite that do
not exist in this package.

The backend has been moved to its own repository."
```

- [ ] **Step 8: Verify author and absence of the Claude trailer**

```bash
git log -1 --format='%an <%ae>'
git log --format='%B' | grep -i claude || echo "no Claude references — correct"
```

Expected: `fabricestunner <fabrice.stunner@gmail.com>` and `no Claude references — correct`.

---

### Task 3: Push the frontend and add build-only CI

Lint is deliberately **not** a gate yet — 29 pre-existing errors would make CI red on the first push. It is switched on in Task 8 once they are cleared.

**Files:**
- Create: `.github/workflows/ci.yml`

**Interfaces:**
- Produces: a `build` job named `build`, extended with a `lint` job in Task 8.

- [ ] **Step 1: Create `.github/workflows/ci.yml`**

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    name: Build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: npm

      - run: npm ci

      # `npm run build` is `tsc -b && vite build`, so this is the typecheck gate too.
      - run: npm run build
```

- [ ] **Step 2: Verify the build command actually passes locally first**

```bash
npm run build 2>&1 | tail -5
```

Expected: `✓ built in …`. Do not push CI that has not been proven locally.

- [ ] **Step 3: Commit the workflow**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add build workflow

Gates on npm run build, which runs tsc -b and therefore covers
typechecking. The lint gate is added separately once the pre-existing
lint errors are cleared."
```

- [ ] **Step 4: Push to the new remote**

```bash
git remote -v
git push -u origin main
```

Expected: remote is `https://github.com/fabricestunner/Kigali-cancel-work-app.git`. The repo is empty, so this is a normal fast-forward push — no force needed. If a force push is ever suggested here, STOP.

- [ ] **Step 5: Confirm CI passed**

```bash
sleep 45
gh run list --limit 3
```

Expected: the latest run shows `completed  success`. If it failed, read the log with `gh run view --log-failed` and fix before continuing.

---

### Task 4: Clear trivial lint errors (unused variables)

3 errors. No behavioural change.

**Files:**
- Modify: `src/pages/InventoryPage.tsx:97`
- Modify: `src/pages/RegisterInfluencerPage.tsx:60,70`

- [ ] **Step 1: Confirm the starting error count**

```bash
npm run lint 2>&1 | tail -3
```

Expected: `✖ 29 problems (29 errors, 0 warnings)`.

- [ ] **Step 2: Fix `InventoryPage.tsx:97`**

`'e' is defined but never used` — an unused catch binding. ES2019 allows omitting it entirely:

```ts
// before:  } catch (e) {
// after:
} catch {
```

- [ ] **Step 3: Fix `RegisterInfluencerPage.tsx:60` and `:70`**

`'_removed' is assigned a value but never used` — destructuring to discard a property. Read both lines first; they are of the form:

```ts
const { someField: _removed, ...rest } = obj;
```

The `no-unused-vars` config does not exempt the `_` prefix. Prefer restructuring so the discard is unnecessary — if `rest` is all that is used, build it explicitly. If discarding is genuinely the clearest expression, add the underscore exemption to `eslint.config.js` instead of disabling the rule inline:

```js
'@typescript-eslint/no-unused-vars': [
  'error',
  { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
],
```

Choose one approach and apply it consistently.

- [ ] **Step 4: Verify the count dropped by exactly 3**

```bash
npm run lint 2>&1 | tail -3
```

Expected: `✖ 26 problems (26 errors, 0 warnings)`.

- [ ] **Step 5: Verify the build still passes**

```bash
npm run build 2>&1 | tail -3
```

Expected: `✓ built in …`.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "style: remove unused variable bindings

Clears 3 no-unused-vars errors. No behavioural change."
```

---

### Task 5: Clear `@typescript-eslint/no-explicit-any` errors

9 errors across 5 files. This is real typing work — do not swap `any` for `unknown` and cast at the use site, which only relocates the problem.

**Files:**
- Modify: `src/pages/DonationPage.tsx:124`
- Modify: `src/pages/DonationSuccessPage.tsx:246`
- Modify: `src/pages/InventoryPage.tsx:285,450`
- Modify: `src/pages/PaymentPage.tsx:282,394,395,520`
- Modify: `src/pages/TestEmailPage.tsx:31`

- [ ] **Step 1: Inspect every site before editing**

```bash
sed -n '124p' src/pages/DonationPage.tsx
sed -n '246p' src/pages/DonationSuccessPage.tsx
sed -n '285p;450p' src/pages/InventoryPage.tsx
sed -n '282p;394,395p;520p' src/pages/PaymentPage.tsx
sed -n '31p' src/pages/TestEmailPage.tsx
```

- [ ] **Step 2: Type the axios error sites**

Most of these are `catch (err: any)` followed by `err.response.data`. The correct type comes from axios, which is already a dependency:

```ts
import { AxiosError } from "axios";

// ...
} catch (err) {
  const error = err as AxiosError<{ message?: string }>;
  const message = error.response?.data?.message ?? error.message;
}
```

Where the same shape recurs, define it once in `src/types/` and import it rather than repeating the annotation — several of these files already import from there.

- [ ] **Step 3: Type the remaining non-error sites**

For any site that is not an error handler, derive the type from what the value actually is. The service layer in `src/services/*.service.ts` already exports typed request/response interfaces — import the existing interface rather than writing a new inline type.

- [ ] **Step 4: Verify the count dropped by exactly 9**

```bash
npm run lint 2>&1 | tail -3
```

Expected: `✖ 17 problems (17 errors, 0 warnings)`.

- [ ] **Step 5: Verify the build still passes**

```bash
npm run build 2>&1 | tail -3
```

Expected: `✓ built in …`. `tsc -b` runs here, so this confirms the new types actually check.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor: replace explicit any with real types

Types axios error handlers via AxiosError and reuses the existing
service-layer interfaces. Clears 9 no-explicit-any errors."
```

---

### Task 6: Clear `react-refresh/only-export-components` errors

4 errors. These files export both a component and non-component values, which breaks Fast Refresh. The fix is to move the non-component exports into their own module.

**Files:**
- Modify: `src/components/dashboard/RecentOrdersTable.tsx:12,20,26`
- Modify: `src/context/CartContext.tsx:109`

- [ ] **Step 1: Inspect the offending exports**

```bash
sed -n '10,30p' src/components/dashboard/RecentOrdersTable.tsx
sed -n '105,115p' src/context/CartContext.tsx
```

- [ ] **Step 2: Extract the helpers from `RecentOrdersTable.tsx`**

The three exports at lines 12, 20 and 26 are helper functions or constants, not components. Move them to a new file `src/components/dashboard/recentOrders.helpers.ts`, then import them back into `RecentOrdersTable.tsx`. Update any other importers — find them first:

```bash
grep -rn "from ['\"].*RecentOrdersTable" src/
```

Note `src/components/dashboard/*` is **not** barrelled (see `CLAUDE.md`), so import the new file by direct path.

- [ ] **Step 3: Extract `useCart` from `CartContext.tsx`**

Line 109 is the `useCart` hook exported alongside the `CartProvider` component. Move the hook to `src/context/useCart.ts`, importing the context object from `CartContext.tsx`. This requires exporting the context itself:

```ts
// CartContext.tsx — add
export const CartContext = createContext<CartContextType | undefined>(undefined);

// useCart.ts — new file
import { useContext } from "react";
import { CartContext } from "./CartContext";

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
```

- [ ] **Step 4: Update every `useCart` importer**

```bash
grep -rln "useCart" src/ | grep -v 'useCart.ts'
```

Update each to `import { useCart } from "@/context/useCart";` — match the import style already used in the file (relative vs alias); check an existing import before choosing.

- [ ] **Step 5: Verify the count dropped by exactly 4**

```bash
npm run lint 2>&1 | tail -3
```

Expected: `✖ 13 problems (13 errors, 0 warnings)`.

- [ ] **Step 6: Verify the build passes**

```bash
npm run build 2>&1 | tail -3
```

Expected: `✓ built in …`. A missed importer surfaces here as a module-resolution error.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "refactor: separate non-component exports for Fast Refresh

Extracts table helpers and the useCart hook into their own modules so
component files export only components. Clears 4 only-export-components
errors."
```

---

### Task 7: Clear the React Hooks errors

13 errors — 12 `set-state-in-effect` plus 1 `purity`. **This task touches the payment and cart flows. It carries the most behavioural risk in the plan.** Work in two sub-groups, because the two groups need genuinely different fixes.

**Files — group A (localStorage hydration):**
- `src/context/CartContext.tsx:23`
- `src/pages/CartPage.tsx:20`
- `src/pages/OrderSuccessPage.tsx:34`
- `src/pages/DonationSuccessPage.tsx:225,257`

**Files — group B (fetch on mount):**
- `src/hooks/useDashboardData.ts:146`
- `src/pages/DashboardBuddyGroupsPage.tsx:271`
- `src/pages/DashboardDonationsPage.tsx:381`
- `src/pages/DashboardInfluencersPage.tsx:387`
- `src/pages/DashboardOrdersPage.tsx:85`
- `src/pages/DashboardSponsorsPage.tsx:298`
- `src/pages/DashboardVolunteersPage.tsx:392`

**Files — group C (purity):**
- `src/pages/PaymentPage.tsx:522`

- [ ] **Step 1: Group A — convert hydration effects to lazy initializers**

These read `localStorage` in a mount effect and immediately `setState`, causing the cascading render the rule flags. A lazy `useState` initializer is a genuine improvement: one render instead of two, and no flash of empty state.

`CartContext.tsx` — replace lines 17–25:

```tsx
// before
const [cartItems, setCartItems] = useState<CartItem[]>([]);

useEffect(() => {
  const savedCart = localStorage.getItem("cart");
  if (savedCart) {
    setCartItems(JSON.parse(savedCart));
  }
}, []);

// after — delete the effect entirely
const [cartItems, setCartItems] = useState<CartItem[]>(() => {
  try {
    const saved = localStorage.getItem("cart");
    return saved ? (JSON.parse(saved) as CartItem[]) : [];
  } catch {
    return [];
  }
});
```

Note the added `try/catch`: the original would throw on corrupted localStorage. Keep the save-effect at lines 28–30 exactly as it is.

`OrderSuccessPage.tsx` — replace lines 25 and 30–39 the same way:

```tsx
const [order, setOrder] = useState<Order | null>(() => {
  const saved = localStorage.getItem("lastOrder");
  if (!saved) return null;
  try {
    return JSON.parse(saved) as Order;
  } catch {
    return null;
  }
});
```

Then delete the mount effect at lines 30–39. **Do not touch the payment-callback effect at lines 44–56.** It is keyed on `[transactionToken]` and must stay that way — re-firing it re-POSTs `/payment/callback`.

Apply the same pattern to `CartPage.tsx:20` and both sites in `DonationSuccessPage.tsx`.

- [ ] **Step 2: Verify group A, then commit separately**

```bash
npm run lint 2>&1 | tail -3
npm run build 2>&1 | tail -3
```

Expected: 8 problems remaining, build passes.

```bash
git add -A
git commit -m "refactor: hydrate state via lazy initializers

Replaces mount effects that read localStorage and setState with lazy
useState initializers, removing a cascading render and adding
try/catch around JSON.parse. The payment-callback effect in
OrderSuccessPage is deliberately unchanged."
```

Committing group A on its own keeps the payment-flow change isolated and easy to revert.

- [ ] **Step 3: Group B — assess before editing**

These are all the same shape: a `useCallback` that calls `setLoading(true)` then fetches, invoked by `useEffect(() => { load(); }, [load])`. The rule fires on the synchronous `setLoading(true)`.

Fetch-on-mount is a legitimate pattern, so first try the structural fix — move the synchronous state write out of the effect's sync path:

```tsx
useEffect(() => {
  let cancelled = false;
  void (async () => {
    await load(cancelled);
  })();
  return () => { cancelled = true; };
}, [load]);
```

Re-run lint after fixing **one** file:

```bash
npm run lint 2>&1 | grep -c 'set-state-in-effect'
```

- [ ] **Step 4: Group B — if the structural fix does not satisfy the rule, suppress with justification**

If Step 3 does not clear the error, the rule is flagging a correct pattern and the honest fix is a narrow, documented suppression — not a contorted rewrite of seven working dashboard pages:

```tsx
// Fetch-on-mount: setLoading runs synchronously here by design. Restructuring
// to satisfy react-hooks/set-state-in-effect would not change behaviour.
// eslint-disable-next-line react-hooks/set-state-in-effect
load();
```

Use one suppression per site with this comment. Do **not** disable the rule globally in `eslint.config.js` — that would hide future genuine violations.

- [ ] **Step 5: Group C — fix `PaymentPage.tsx:522`**

`Cannot call impure function during render` — `Date.now()` and `new Date()` are called in the component body:

```tsx
// before (lines 522-523)
const transactionId = `TXN-${Date.now()}`;
const date = new Date().toLocaleString();
```

These feed a downloadable receipt. Move them into the `handleDownloadReceipt` callback at line 525, where they are actually used — the values should reflect download time, not render time, so this is a correctness fix as well:

```tsx
const handleDownloadReceipt = () => {
  const transactionId = `TXN-${Date.now()}`;
  const date = new Date().toLocaleString();
  // ... existing body
};
```

Check whether `transactionId` or `date` is referenced anywhere else in the component before moving:

```bash
grep -n 'transactionId\|[^a-zA-Z]date[^a-zA-Z]' src/pages/PaymentPage.tsx
```

If either is used in the rendered JSX, use `useMemo` instead of moving it.

- [ ] **Step 6: Verify zero lint errors remain**

```bash
npm run lint 2>&1 | tail -3
```

Expected: no output from eslint, or an explicit success. There must be **0 errors**.

- [ ] **Step 7: Verify the build passes**

```bash
npm run build 2>&1 | tail -3
```

Expected: `✓ built in …`.

- [ ] **Step 8: Manually verify the cart still works**

Lint cannot catch a broken cart. This is the one place in the plan where automated checks are insufficient — Task 7 rewrote the cart's state initialization.

```bash
npm run dev
```

In the browser: add an item to the cart, reload the page, and confirm the item is still there. Then clear the cart and reload, confirming it stays empty. If either fails, the lazy initializer in `CartContext.tsx` is wrong — revert to the group A commit and retry.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "refactor: resolve remaining React Hooks lint errors

Moves impure Date calls in PaymentPage into the download handler so the
receipt reflects download time, and addresses fetch-on-mount effects in
the dashboard pages."
```

---

### Task 8: Enable the lint gate

Only now that lint is clean.

**Files:**
- Modify: `.github/workflows/ci.yml`

- [ ] **Step 1: Confirm lint is genuinely clean**

```bash
npm run lint; echo "exit code: $?"
```

Expected: `exit code: 0`. If it is anything else, return to Task 7 — do not enable the gate over a failing command.

- [ ] **Step 2: Add the lint job**

Insert before the `build` job in `.github/workflows/ci.yml`:

```yaml
  lint:
    name: Lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: npm

      - run: npm ci

      - run: npm run lint
```

The two jobs run in parallel; neither needs the other.

- [ ] **Step 3: Commit and push**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: gate on lint

The 29 pre-existing lint errors are cleared, so lint can now block."
git push
```

- [ ] **Step 4: Confirm both jobs pass on GitHub**

```bash
sleep 60
gh run list --limit 3
gh run view --json jobs --jq '.jobs[] | "\(.name): \(.conclusion)"'
```

Expected: `Lint: success` and `Build: success`. Read the actual output — do not assume.

---

### Task 9: Create and push the backend repository

**Files:**
- Modify: `../kcw-backend/.gitignore`
- Create: `../kcw-backend/.env.example`
- Create: `../kcw-backend/.github/workflows/ci.yml`

- [ ] **Step 1: Fix `.gitignore`**

It currently lists `.gitignore` itself, which makes git ignore the file defining the rules. Replace with:

```
node_modules
dist/
/src/generated/prisma

# Environment — never commit real values. .env.example is tracked.
.env
.env.*
!.env.example

.DS_Store
```

- [ ] **Step 2: Create `.env.example` — names only, never values**

These are exactly the variables the source reads, extracted from the code:

```bash
# Server
PORT=3000
NODE_ENV=development

# Database (PostgreSQL)
DATABASE_URL=

# Auth
JWT_SECRET=

# CORS / links in outbound email
FRONTEND_URL=

# DPO payment gateway
DPO_BASE_URL=
DPO_COMPANY_TOKEN=
DPO_SERVICE_TYPE=

# Cloudinary media uploads
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# SMTP transactional email
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
```

- [ ] **Step 3: Confirm no real secrets are about to be committed**

```bash
cd /Users/ganziteka/Documents/Projects/2026/RG/Kigali-cancel-walk/kcw-backend
ls -a | grep '^\.env' || echo "no .env files present"
git status --porcelain
```

Expected: no `.env` file other than `.env.example`. If a real `.env` exists, confirm `git check-ignore .env` reports it as ignored before proceeding.

- [ ] **Step 4: Create `.github/workflows/ci.yml`**

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    name: Build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: npm

      # `postinstall` runs `prisma generate`, so the client is available
      # without a database connection. No DATABASE_URL is needed to build.
      - run: npm ci

      - run: npx tsc --noEmit
```

`npx tsc --noEmit` rather than `npm run build`: the build script is `prisma generate && tsc`, and `prisma generate` already ran via `postinstall`. There is no test job — the `test` script is `echo "Error: no test specified" && exit 1`.

- [ ] **Step 5: Verify the build passes locally before pushing CI**

```bash
npm install
npx tsc --noEmit; echo "exit code: $?"
```

Expected: `exit code: 0`. If it fails, fix it before adding CI — do not push a workflow known to be red. If the failure is pre-existing and substantial, stop and report rather than silently expanding scope.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: add environment example and CI

Documents the 15 environment variables the server reads, without
values. Fixes a .gitignore that ignored itself. Adds a typecheck
workflow."
```

- [ ] **Step 7: Create the private GitHub repo and push**

```bash
gh repo create fabricestunner/kcw-backend --private --source=. --remote=origin --push
```

`--private` is required. This repo handles DPO payment tokens, SMTP credentials and a production donor database.

- [ ] **Step 8: Verify visibility and CI**

```bash
gh repo view fabricestunner/kcw-backend --json isPrivate,name
sleep 45
gh run list --limit 3
```

Expected: `"isPrivate": true` and a successful run. **If `isPrivate` is false, make it private immediately** — the repo would be exposing server-side payment and auth logic.

---

## Verification

Run at the end. Every item must be confirmed by reading actual command output.

- [ ] Frontend: `npm run lint` exits 0
- [ ] Frontend: `npm run build` succeeds
- [ ] Frontend: `git log --format='%an'` shows only `fabricestunner`
- [ ] Frontend: no commit message contains "Claude"
- [ ] Frontend: `git ls-files | grep -cE '^(node_modules|dist|backend)/'` returns 0
- [ ] Frontend: CI green on GitHub for both jobs
- [ ] Backend: 44 source files restored, `npx tsc --noEmit` exits 0
- [ ] Backend: repo is **private**, CI green
- [ ] Backend: no `.env` tracked; `.env.example` has names but no values
- [ ] Manual: cart persists across a page reload
- [ ] Production untouched: no Vercel project created or modified, no DNS changed, no database contacted
- [ ] `/Kigali-cancel-walk/.git` still intact and unmodified

## Known Follow-ups (not in this plan)

1. **Deployment migration.** Blocked on: who owns the Vercel project serving the live frontend, and who controls the production domain's DNS. Until resolved, commits to the new repo do not reach production.
2. **No test suite** in either repo. CI gates on typecheck and lint only.
3. **Backend history is a single commit** — the original remote is inaccessible and the clone was shallow.
