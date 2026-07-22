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
| Backend deploy target | cPanel / shared hosting — confirmed **Hostinger** (`kcw.enjoyrwanda.rw` → `84.32.84.250`, NS `solar/lunar.dns-parking.com`). |
| Scope of this task | **Repositories and CI only.** No deployment work in either repo. |

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

### CD — deferred, out of scope

**No deployment work is performed in this task.** Investigation established why:

- The live frontend is served from the **old** repo, via a Vercel project that is
  **not in the user's Vercel account**. All 14 projects under
  `team_pJNWa3BpUEZmxbKKfknWsPPu` ("STUNNER's projects") were enumerated and none
  correspond to this application.
- Therefore "point Vercel at the new repo" is not an action available to the
  user. The project belongs to another party, most plausibly the old repo's owner.
- The frontend's production domain is not referenced anywhere in the source, so
  it could not be determined from the codebase, and DNS control is unconfirmed.

Deployment is consequently a **separate task**, to be scoped once ownership of
the Vercel project and the production domain is established. When that happens,
the intended approach is Vercel's native Git integration rather than a GitHub
Action, since an Actions-based deploy duplicates the integration and bills build
minutes twice.

Until then the new repo builds in CI but ships nowhere, and **production is
untouched** — it continues to serve from the old repo exactly as it does today.

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

### CD — deferred, out of scope

The backend runs on Hostinger shared hosting, which offers no reliable GitHub
Actions deployment path. Per the agreed scope, **no backend deployment work is
performed in this task** — no release workflow, no deployment documentation, no
migration runs. The live API continues to be deployed exactly as it is today.

When deployment is scoped as a separate task, the intended approach is a
tag-triggered workflow producing a deployable `.zip` (compiled `dist/`,
`package.json`, `package-lock.json`, `prisma/`) plus a written manual upload
procedure — automating the build while leaving the upload manual.

> **The backend talks to a live production database holding real donor and
> buyer records.** When migrations are eventually run, they must use
> `prisma migrate deploy` — never `migrate dev` and never `db push`, both of
> which can drop data — and must be preceded by a database backup. Recorded
> here so the constraint is not lost between tasks.

## Out of Scope

Explicitly not done in this work:

- **No deployment work of any kind, for either repo.** Production is untouched.
- No pushes to `aimableshyaka/Kigali-cancel-walk`.
- No writes to the production API or database; read-only `GET` probes only.
- No Vercel changes — no new projects, no domain changes, no DNS changes.
- No `git push --force` in any repository.
- No deletion of the old repository copy on disk. It remains the source of the
  live site and must not be disturbed.

## Risks

| Risk | Mitigation |
|---|---|
| Live-site disruption | Eliminated by scope: no deployment or DNS work occurs. The old repo and its Vercel project keep serving production, untouched. |
| The new repo diverges from what is actually live | Accepted and explicit. Until deployment is migrated, `fabricestunner/Kigali-cancel-work-app` is a *source-of-truth candidate*, not the deployed artifact. Any change committed there does **not** reach production. This must be resolved before real feature work continues. |
| Backend history is one shallow commit | Unavoidable — the original remote is inaccessible. Recorded here so the truncation is not later mistaken for data loss. |
| Frontend repo is **public** | `.gitignore` excludes all `.env*`; only `.env.example` is tracked. Backend is private. |
| Secrets leaking into the initial commit | Staged file list is reviewed before the initial commit; no `.env` file currently exists in this directory. |
| Prisma migration against production data | Not applicable to this task — no migrations are run. The constraint is recorded under "Repo B — CD" for the future deployment task. |

## Success Criteria

1. `fabricestunner/Kigali-cancel-work-app` has a `main` branch with the full
   frontend source, no `node_modules`, no `dist`, no secrets.
2. `fabricestunner/kcw-backend` exists, is private, and holds the 44 restored
   backend files.
3. CI passes green on both repositories.
4. `CLAUDE.md` accurately describes the repository it lives in.
5. Production is verifiably unchanged: the live site and API still serve from
   their existing sources, and no Vercel, DNS, or database state was modified.

## Follow-up Task (not this one)

Migrating deployment. Blocked on two unknowns that must be answered first:

1. Who owns the Vercel project currently serving the live frontend?
2. What is the production domain, and who controls its DNS?

Until both are answered, the new repository cannot become the deployed source.
