# Repository Initialization and CI/CD — Design

**Date:** 2026-07-22
**Status:** Approved

## Problem

The Kigali Cancer Walk 2026 project is live, but its source control is in a broken
state that blocks safe iteration:

1. **Two identical frontend copies nested inside each other.**
   `/Kigali-cancel-walk` holds the historical repo (remote
   `aimableshyaka/Kigali-cancel-walk`, HEAD `a23e797`). Inside it,
   `/Kigali-cancel-walk/Kigali-cancel-work-app` is a byte-identical copy
   (`diff -rq src ../src` reports no differences) with zero commits, pointed at
   an empty remote the user owns.

2. **The backend source is absent from disk.** `backend/` contains only
   `.DS_Store` and `.git-bak`, a renamed `.git` directory. Its objects are
   intact — 44 files at commit `6bb2318` — so the source is fully recoverable,
   but the working tree is gone. Its origin, `graceniyigena34/kcw-backend`, does
   not resolve for the current GitHub user.

3. **No `.gitignore` in the new copy.** A commit as-is would ingest 365 MB of
   `node_modules` and a 4.6 MB stale `dist/`.

4. **`CLAUDE.md` documents a project that does not exist.** It describes npm
   workspaces, a `backend/` workspace, eight backend scripts, and a Vitest suite.
   The actual `package.json` has none of these.

## Decisions

| Question | Decision |
|---|---|
| Canonical frontend repo | `fabricestunner/Kigali-cancel-work-app` (public, empty, user is ADMIN). Fresh history. |
| Old `aimableshyaka` repo | Not used, not pushed to, left on disk as a rollback safety net. |
| Backend organization | Own repo, restored from `.git-bak`. |
| Backend repo | New: `fabricestunner/kcw-backend`, **private**. |
| Backend location | Sibling directory `/Kigali-cancel-walk/kcw-backend`, not nested. |
| `dist/` in version control | Dropped. |
| `CLAUDE.md` | Rewritten to match reality. |
| `KCW_WE2.jpg` | Kept. |
| Backend deploy target | cPanel / shared hosting. |

## Target Layout

```
/Kigali-cancel-walk/                    old repo, untouched, rollback safety net
├── Kigali-cancel-work-app/             REPO A → fabricestunner/Kigali-cancel-work-app (public)
└── kcw-backend/                        REPO B → fabricestunner/kcw-backend (private)
```

## Repo A — Frontend

React 19 + TypeScript + Vite 8, Tailwind v4, deployed on Vercel.

### Pre-commit hygiene

- **`.gitignore`**: `node_modules`, `dist`, `.env*` (with `!.env.example`),
  `.vercel`, `.DS_Store`, logs, editor directories.
- **`dist/` untracked.** Vercel builds from source; a committed build output only
  goes stale and generates merge conflicts.
- **`.env.example`** documenting `VITE_API_BASE_URL`. The real value is copied
  from the old repo's `.env.development` into an untracked `.env.local`. This
  variable holds a public API URL, not a secret — but `VITE_*` values are inlined
  into the public bundle, so the rule that no secret may ever be added to one is
  recorded in the example file.
- **`CLAUDE.md` rewritten** to describe the actual single-package frontend, with
  the backend documented as a separate repository.

One initial commit, then push `main`.

### CI

`.github/workflows/ci.yml`, triggered on pull requests and pushes to `main`.
Node 22, `npm ci`, two parallel jobs:

- `lint` → `npm run lint`
- `build` → `npm run build` (`tsc -b && vite build`, so this is also the
  typecheck gate)

**No test job.** There is no test suite. A green check over `exit 0` is worse
than no check at all, because it manufactures confidence that nothing verified.

### CD

Vercel's native Git integration, pointed at the new repo. Deliberately *not* a
GitHub Action: an Actions-based Vercel deploy duplicates what the integration
already performs and consumes build minutes twice.

Repointing Vercel is a dashboard operation that cannot be scripted here. The
live-site cutover is documented in `docs/DEPLOYMENT.md` as an ordered checklist:

1. Add the new repo as a **second** Vercel project.
2. Verify its preview URL end to end — in particular the DPO payment redirect,
   which is domain-sensitive and cannot be validated by CI.
3. Only then move the production domain to the new project.
4. Delete the old project once the new one has served production traffic.

## Repo B — Backend

Express 5 + Prisma 5 + PostgreSQL. No tests, no Dockerfile, no prior CI config.

### Restoration

Restore all 44 files from `backend/.git-bak` at `6bb2318` into
`/Kigali-cancel-walk/kcw-backend` and reinstate `.git`. The clone is **shallow —
one commit of history**, and the original remote does not resolve, so that single
commit is the entire recoverable history. The restored tree is pushed to the new
private repo as its initial state.

### Additions

- **`.env.example`** listing exactly the variables the code reads, extracted from
  source: `DATABASE_URL` (from `prisma/schema.prisma`), plus `PORT`, `NODE_ENV`,
  `JWT_SECRET`, `FRONTEND_URL`, `DPO_BASE_URL`, `DPO_COMPANY_TOKEN`,
  `DPO_SERVICE_TYPE`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`,
  `CLOUDINARY_API_SECRET`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`.
  **Names only — no values.**
- **`.gitignore` corrected.** It currently lists `.gitignore` itself, which
  causes git to ignore the very file defining the ignore rules.

### CI

`.github/workflows/ci.yml` on pull requests and pushes to `main`: `npm ci` →
`prisma generate` → `tsc` build. No test job, for the same reason as Repo A.

### CD

cPanel offers no reliable GitHub Actions deployment path, so deployment stays
manual and is made repeatable instead of automated:

- **`.github/workflows/release.yml`**: on a pushed git tag, build and upload a
  deployable `.zip` artifact containing the compiled `dist/`, `package.json`,
  `package-lock.json`, and `prisma/`.
- **`docs/DEPLOYMENT.md`**: the manual cPanel upload procedure, including
  `npx prisma migrate deploy`.

> **This is a live production database holding real donor and buyer records.**
> Migrations run with `migrate deploy`, never `migrate dev` and never
> `db push`, both of which can drop data. Take a database backup before any
> migration.

## Out of Scope

Explicitly not done in this work:

- No pushes to `aimableshyaka/Kigali-cancel-walk`.
- No writes to the production API or database; read-only `GET` probes only.
- No Vercel dashboard changes — documented for the user to perform.
- No `git push --force` in any repository.
- No deletion of the old repository copy on disk until the new frontend has been
  confirmed serving production.

## Risks

| Risk | Mitigation |
|---|---|
| Live-site downtime while repointing Vercel | Parallel project, verify preview, then swap the domain. Old project stays until the new one is proven. |
| Backend history is one shallow commit | Unavoidable — the original remote is inaccessible. Recorded here so the truncation is not later mistaken for data loss. |
| Frontend repo is **public** | `.gitignore` excludes all `.env*`; only `.env.example` is tracked. Backend is private. |
| Secrets leaking into the initial commit | Staged file list is reviewed before the initial commit; no `.env` file currently exists in this directory. |
| Prisma migration against production data | Backup first; `migrate deploy` only. Documented in `docs/DEPLOYMENT.md`. |

## Success Criteria

1. `fabricestunner/Kigali-cancel-work-app` has a `main` branch with the full
   frontend source, no `node_modules`, no `dist`, no secrets.
2. `fabricestunner/kcw-backend` exists, is private, and holds the 44 restored
   backend files.
3. CI passes green on both repositories.
4. `docs/DEPLOYMENT.md` exists in both, covering the Vercel cutover and the
   cPanel release procedure.
5. `CLAUDE.md` accurately describes the repository it lives in.
