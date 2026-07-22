# Kigali Cancer Walk 2026 — Frontend

A single-page React 19 + TypeScript + Vite application for the Kigali Cancer
Walk 2026 event. It serves two things from one router:

- A public marketing/e-commerce site — event info, kit sales, donations,
  volunteer/influencer registration.
- An admin dashboard (under `/dashboard`) for managing orders, donations,
  sponsors, volunteers, and inventory.

## Prerequisites

- Node.js 22+

## Setup

```bash
npm install
cp .env.example .env.local
```

Edit `.env.local` if you need to point at a different API (e.g. a local
backend instance). See `.env.example` for the available variable and a
warning about what's safe to put in it.

## Scripts

- `npm run dev` — start the Vite dev server with HMR
- `npm run build` — type-check (`tsc -b`) then produce a production build
- `npm run lint` — run ESLint over the project
- `npm run preview` — serve the production build locally

## Backend

The backend API is a separate repository
([`fabricestunner/kcw-backend`](https://github.com/fabricestunner/kcw-backend))
and is not part of this codebase. This frontend talks to it exclusively
through `VITE_API_BASE_URL` (see `src/services/api.ts`).

## Deployment

This repository is **not yet wired to a deployment**. Production currently
builds from a different repository. `vercel.json` is present for when this
repo is connected to Vercel, but no deployment is configured against it yet.

## Further reading

- `CLAUDE.md` — architecture notes for anyone (human or AI) working in this
  codebase.
- `docs/BACKEND-REQUIREMENTS.md` — open questions about the backend contract.
