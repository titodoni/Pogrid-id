# AGENTS.md

## Scope and current state
- Next.js 15 App Router scaffold exists with TypeScript, Tailwind CSS v4, Prisma, iron-session, and Pusher dependencies.
- Neon is configured for local development via `.env`; do not commit real connection strings.
- Initial Prisma migration exists under `prisma/migrations/20260502142354_init`.
- `npm run seed` creates `SystemConfig`, `PoSequence`, default departments, and admin user `admin` with PIN `2468`.
- `PRD.md` is still the product/technical source of truth; implementation is early-stage.
- No test runner exists yet; do not invent `npm test` until one is added.

## Commands
- Install deps: `npm install`
- Dev server: `npm run dev`
- Build: `npm run build`
- Lint: `npm run lint`
- Typecheck: `npm run typecheck`
- Prisma generate: `npm run db:generate`
- Prisma migrate: `npm run db:migrate` (requires real Neon `DATABASE_URL` and `DIRECT_URL`)
- Seed: `npm run seed` (requires DB env vars; scripts must keep `import 'dotenv/config'` first)

## Source of truth
- Treat `PRD.md` as the single authoritative source for product and technical decisions.
- `PRD.md` is marked **LOCKED** in many sections; do not change locked behavior unless the user explicitly says "update PRD".
- If implementation work conflicts with assumptions, prefer verified repo files over guesses and then update this file.

## Build sequence from PRD
- Build shared domain helpers first: roles, flags, PO/item statuses, stage transitions, audit logs, notifications.
- Implement auth/session before protected pages: `/login`, role redirects, logout, PIN change/reset, `/superadmin`.
- Build Admin core next: `/pos`, `/po`, `/pos/new`, `/pos/[id]`, `/masalah`, `/settings`.
- Build operator flow after Admin PO creation exists: `/tasks`, role-specific update panels, problem reporting, QC, delivery, return.
- Use React 19 `useOptimistic` for the 5-second operator cancel window; Pusher fires only after commit.
- Build Finance after DONE item flow exists: `/finance`, invoice transitions, PO status recomputation.
- Build Dashboard/PDF after enough production and finance data paths exist: `/dashboard`, `/api/export/pdf`.
- Build `/board`, `/search`, notifications, then `/demo` and final Superadmin tooling.

## Non-obvious constraints from PRD that are easy to miss
- Stack target is fixed: Next.js 15 App Router, React 19, Tailwind CSS v4, Prisma + Neon, iron-session, Pusher.
- Prisma packages are pinned to v6.18.0 because Prisma 7 rejects the locked PRD schema shape (`url`/`directUrl` in `schema.prisma`).
- `bcryptjs` must stay on 2.x per PRD; do not upgrade to 3.x casually.
- Dynamic route props in Next.js 15 must be awaited (`params`/`searchParams` are async Promises).
- File naming is non-negotiable when code is created:
  - `lib/db.ts` (not `lib/prisma.ts`)
  - `lib/session.ts` (not `lib/auth.ts`)
- Prisma rule: no enums for role/status/type fields; use `String` columns + TypeScript unions.
- Multi-tenant fields (`tenantId`/`companyId`) are explicitly forbidden.
- `app/layout.tsx` must remain a Server Component (never add `'use client'`).
- Do not use color `#92400E`.
- `AuditLog.userId` and `Problem.reportedBy` are plain strings rather than DB foreign keys so the PRD-required value `"system"` remains valid.

## Workflow for future agents
- Before coding, re-read relevant locked PRD sections for the feature being touched.
- Keep this file compact and evidence-based: only retain guidance verified from repo files.

## Known Build Blockers
- The `nextjs-export` directory contains non-functional, legacy reference code. It MUST be deleted to allow production builds to succeed, as Next.js/TypeScript attempts to validate it during build time. Failure to delete it results in build-time type errors.
