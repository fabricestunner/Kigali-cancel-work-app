# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Frontend

- `npm run dev` — start Vite dev server with HMR
- `npm run build` — type-check (`tsc -b`) then production build via Vite
- `npm run lint` — run ESLint over the project
- `npm run preview` — serve the production build locally

These are the only four scripts defined in `package.json`. There is no test
suite, no Vitest dependency, and no backend workspace in this repository.
Lint currently gates CI — a failing `npm run lint` blocks merges.

The backend is a separate repository
(`fabricestunner/kcw-backend`), not an npm workspace inside this one.
`npm install` at the repository root installs only this package's
dependencies.

## Architecture

This is a single-page React 19 + TypeScript + Vite app for the Kigali Cancer Walk 2026 event: a public marketing/e-commerce site plus an admin dashboard, both served from one `App.tsx` router. Styling is Tailwind CSS v4 with a custom Material-Design-style token palette defined in `tailwind.config.js` (colors like `on-surface`, `surface-container`, `primary-container`, etc. — always prefer these semantic tokens over raw Tailwind colors when styling).

### Two apps in one router

`src/App.tsx` branches on `location.pathname.startsWith("/dashboard")`:
- **Public site** (default branch): wrapped in `Navbar` + `Footer`. There is
  currently no `path="*"` catch-all route for the public site — an unmatched
  public path renders an empty `<main>` rather than a not-found page.
- **Dashboard** (admin): rendered without the public `Navbar`/`Footer`, using its own `Sidebar` + `Header` layout (see `src/components/dashboard/`). The `/dashboard/*` wildcard route renders `DashboardPage` directly (the same component as `/dashboard`), so an unmatched dashboard path silently shows the overview rather than redirecting to it.
- **There is currently no route-level access control.** No `ProtectedRoute`
  component and no `src/utils/auth.ts` exist in this codebase — dashboard
  routes render unconditionally regardless of whether an `authToken` is
  present in `localStorage`. Real access control depends entirely on the API
  rejecting unauthenticated requests. See `docs/BACKEND-REQUIREMENTS.md`.
- Not every `Sidebar` entry has a matching route today (e.g. `/dashboard/payments`, `/dashboard/inventory`, `/dashboard/influencers`, `/dashboard/reports`, and `/dashboard/settings` are linked from `Sidebar` but unrouted in `App.tsx`, so they fall through to the `/dashboard/*` wildcard). New Sidebar entries should get a matching route.

### Payment flow (important)

Payment is redirect-based via DPO: the app POSTs to `/payment/create`, gets a `paymentUrl`, and leaves the site with `window.location.href`. DPO redirects back to `/order-success?TransactionToken=…`, where the client POSTs `/payment/callback`.

`OrderSuccessPage` does **not** currently have a `verifyStatus` state machine
or a ref guard (unlike `DonationSuccessPage`, which should be checked before
assuming the two pages behave alike). Its callback effect is a plain
`useEffect` keyed on `[transactionToken]` (see
`src/pages/OrderSuccessPage.tsx:44-56`): it POSTs to `/payment/callback` once
per token change and only logs the response to the console — it does not
gate the success UI on a confirmed callback. Treat this as a known gap, not
a pattern to copy elsewhere.

### Data layer

All backend communication goes through a single shared `axios` instance in `src/services/api.ts`, which:
- Reads `baseURL` from `import.meta.env.VITE_API_BASE_URL`, falling back to `https://kcw.enjoyrwanda.rw/api`. Set it in `.env.local` for local work and in the Vercel dashboard for deploys. `VITE_*` values are inlined into the public bundle — never put a secret in one.
- Injects `Authorization: Bearer <token>` from `localStorage.getItem("authToken")` on every request. There is currently no response interceptor — a `401` is not specially handled (no automatic session clear or redirect to `/login`).

The backend lives in its own repository
(`fabricestunner/kcw-backend`), not in this one. The deployed API is still the authoritative source of truth for behaviour such as auth enforcement, price recomputation, free-kit token issuance, DPO verification, and transactional email. Treat the server code as the contract and keep the frontend service layer aligned with it. Probe the live API with **read-only GETs only** — it is production with real donor and buyer records. Open questions are tracked in `docs/BACKEND-REQUIREMENTS.md`.

Domain-specific API calls live in `src/services/*.service.ts` (one per resource: `donation`, `influencer`, `product`, `sponsor`, `stock`, `volunteer`, plus `buddygroup` and `freekit`), each exporting typed request/response interfaces plus plain async functions (`getAll*`, `submit*`, `update*Status`, `delete*`) — there is no query-caching layer (no React Query/SWR); pages call these directly in `useEffect`/hooks.

The dashboard's data needs are aggregated by `src/hooks/useDashboardData.ts`, which fires all resource fetches in parallel via `Promise.all` and exposes a single `{ ...data, loading, error, refresh }` shape consumed by `DashboardPage.tsx`. Note this hook defines its own local `Order`/`Donation`/`Sponsor`/`Volunteer`/`Influencer` interfaces rather than importing from the `*.service.ts` files, so the two can drift — check both when changing a shape.

### Cart

Client-side cart state lives in `src/context/CartContext.tsx` (`CartProvider`/`useCart`), persisted to `localStorage` under the `cart` key. Cart items reference a `Product` plus a chosen `size`, `quantity`, and `stockId` (tying a cart line to a specific stock/inventory record used for kit fulfillment).

### Static content

Non-fetched content (FAQs, hero stats, event info like phone/email/tagline) is hardcoded in `src/data/index.ts` rather than coming from the API — update this file for copy changes to those sections.

### Exports/reporting

`src/utils/exportData.ts` handles dashboard data export using `jspdf` + `jspdf-autotable` (PDF) and `xlsx` (spreadsheet), invoked from `src/components/dashboard/ExportMenu.tsx`.

### Component conventions

- `src/components/index.ts` and `src/components/ui/index.ts` are barrel files — new shared/public-site components and base UI primitives (`Button`, `Input`) should be re-exported there.
- `src/components/dashboard/*` are dashboard-only and not barreled; import them directly by path.
- Component/page filenames and their exports are consistently PascalCase-matching (e.g. `HomePage.tsx` exports `HomePage`), all named exports (no default exports for components except `App`).

### Deployment

Deployed on Vercel (`vercel.json` rewrites all paths to `/` for client-side routing). A committed `dist/` directory exists alongside `public/` — treat `dist/` as a build artifact, not a source of truth.
