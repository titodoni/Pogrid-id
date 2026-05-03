# Handover

## Session Log

### Session 1 — Neon setup
- Connected Neon CLI to the `Tito` organization.
- Selected existing Neon project `POGRID` (`red-pond-09736818`).
- Created local `.env` with pooled `DATABASE_URL` and direct `DIRECT_URL` for Prisma.
- Sanitized `.env.example` so it only contains placeholder database URLs.
- Ran `npm run db:generate` successfully.
- Applied initial Prisma migration `prisma/migrations/20260502142354_init` successfully.
- Ran `npm run seed` successfully.
- Seed created `SystemConfig`, `PoSequence`, default departments, and admin user `admin` with PIN `2468`.
- Ran `npm run lint` successfully.
- Ran `npm run typecheck` successfully.
- Ran `npm run build` successfully on retry with a longer timeout.

### Session 2 — PRD build planning
- Read `PRD.md` and summarized the full product build sequence.
- Identified the practical implementation order:
  - Foundation hardening.
  - Domain helpers.
  - Auth/session.
  - Admin core.
  - Operator flow.
  - QC/rework/return.
  - Finance.
  - Dashboard/PDF.
  - Board/search/notifications.
  - Demo.
  - Superadmin.
  - Final QA/release.
- Noted unresolved PRD conflicts/pendings:
  - PDF export permission conflict: section 16 says `ADMIN, MANAGER`; section 25.2 says all dashboard roles.
  - Admin override progress UI location is still pending.
  - Client settings UI detail is still TBD.

### Session 3 — Agent instructions
- Updated `AGENTS.md` with current Neon/migration/seed state.
- Added compact PRD build sequence for future OpenCode sessions.
- Preserved repo-specific constraints and commands.

### Session 4 — Phase 2 domain helpers
- Re-read locked PRD sections for roles, data model string unions, stage flow, production logic, flags, finance status computation, problem reporting, and notifications.
- Extended shared constants/types for static roles, notification types, stage timestamp fields, item/PO/invoice statuses, and flag priority.
- Added `lib/domain.ts` with role helpers, permission checks, stage transition helpers, work type parsing, production auto-advance checks, PO status computation, and Asia/Jakarta urgency flag computation.
- Added `lib/audit.ts` for typed AuditLog creation and value serialization.
- Added `lib/notifications.ts` for role/user-targeted in-app notification creation and PRD event recipient helpers.
- Ran `npm run typecheck` successfully.
- Ran `npm run lint` successfully after retrying with a longer timeout.

### Session 5 — Phase 3 auth/session
- Re-read locked PRD sections for access layers, authentication/session, routes, PIN management, and admin audit actions.
- Extended `lib/session.ts` with session set/clear helpers, protected route guards, and role-home redirects.
- Added `lib/pins.ts` for 4-digit staff PIN validation, easy PIN generation, bcrypt hashing/comparison, and 6-digit superadmin PIN comparison.
- Implemented `/login` with active-user selection, PIN server action, wrong-PIN feedback, Forgot PIN WhatsApp deep links, and role-home redirects.
- Added `/logout`, `/profile` self PIN change, `/settings/users` admin PIN reset, and hidden `/superadmin` platform entry shell.
- Added protected placeholder home routes for `/pos`, `/dashboard`, `/finance`, and `/tasks` so role redirects resolve.
- Ran `npm run lint`, `npm run typecheck`, and `npm run build` successfully.

### Session 6 — Phase 4 Admin core
- Re-read locked PRD sections for Admin UI/UX, PO creation flow, problem reporting, routes, and Admin audit actions.
- Added additive Prisma migration `20260503042553_add_po_date_urgent_vendor_item_spec_unit` for PRD §19 fields: `PO.po_date`, `PO.is_urgent`, `PO.is_vendor_job`, `Item.spec`, and `Item.unit`.
- Applied the migration to the configured Neon database and regenerated Prisma Client.
- Added `lib/po.ts` for PO number formatting, progress calculation, late-hour calculation, date formatting, and PO status helpers.
- Replaced `/pos` placeholder with Admin KPI cards, lateness stats, and urgency-sorted active PO cards.
- Added `/po` full PO list with horizontal filter tabs for Semua / Terlambat / Urgent.
- Added `/pos/new` PO creation with client selection/new client, PO date, due date, notes, urgent/vendor toggles, item spec/unit/qty, department multi-select, ItemProgress initialization, PO number sequence reservation, and new-PO notifications.
- Added `/pos/[id]` detail with header stats, item timeline/logs, edit PO form, and guarded delete flow.
- Added `/masalah` open-problem list with Admin resolve action and `PROBLEM_RESOLVED` AuditLog.
- Reworked `/settings` into a single-page Users / Klien / Flags hub with user create/reset/toggle, client creation, and read-only flag thresholds.
- Ran `npm run lint`, `npm run typecheck`, and `npm run build` successfully.

## Phase Status

### Phase 1 — Foundation Hardening
Status: passed.

Completed:
- Next.js 15 App Router scaffold exists.
- React 19, TypeScript strict mode, Tailwind CSS v4, Prisma, Neon, iron-session, Pusher, and PDF dependencies are installed.
- Tailwind v4 is configured through `app/globals.css` and `postcss.config.mjs`; there is no `tailwind.config.js`.
- `app/layout.tsx` is still a Server Component.
- Required filenames exist: `lib/db.ts`, `lib/session.ts`, `lib/pusher.ts`, `lib/constants.ts`, `lib/types.ts`, `lib/utils.ts`.
- Prisma schema uses string fields for roles/status/type values; no Prisma enums.
- Neon env vars are wired locally through `.env`.
- Initial migration and seed have been applied.
- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm run build` passed.

Note:
- `app/globals.css` contains the Tailwind v4 theme and required animation classes; compare against PRD Appendix B only if exact copy parity becomes important.

Conclusion: Phase 1 is complete.

### Phase 2 — Shared Domain Helpers
Status: passed.

Completed:
- Shared roles/status/type unions are available in `lib/types.ts`.
- Shared constants for roles, flags, statuses, and stage timestamps are available in `lib/constants.ts`.
- Domain helper functions exist for roles, permissions, stage transitions, work type parsing, production auto-advance, PO finance status, and urgency flags.
- AuditLog and Notification creation helpers exist.

Conclusion: Phase 2 is complete.

### Phase 3 — Auth & Session
Status: passed for foundational auth.

Completed:
- `/login` authenticates active users with bcrypt PIN checks and iron-session.
- Role-home redirects are wired for ADMIN, dashboard roles, FINANCE, DRAFTER, PURCHASING, QC, DELIVERY, and `OPERATOR_*`.
- Sessions are persistent and only cleared by `/logout`.
- `/profile` supports self PIN change without old PIN and logs `SELF_PIN_CHANGE`.
- `/settings/users` supports Admin PIN reset with easy PIN generation and logs `PIN_RESET`.
- `/superadmin` exists as hidden route with 6-digit PIN entry and a platform management shell.
- Protected placeholder routes exist for the next feature phases.

Notes:
- `/login` is server-rendered and functional; the PRD bottom-drawer/numpad interaction can be refined later when UI polish begins.
- `/superadmin` reads `SUPER_ADMIN_PIN`; if the value starts with bcrypt `$2`, it is compared as a hash, otherwise it is compared as the sample 6-digit env value.

Conclusion: Phase 3 foundational auth is complete.

### Phase 4 — Admin Core
Status: passed for foundational Admin core.

Completed:
- Admin home `/pos` shows PRD KPI cards, late stats, and active PO cards sorted by urgency.
- `/po` provides the full PO list with Semua / Terlambat / Urgent filters.
- `/pos/new` creates POs and items using all PRD §19 fields now present in schema.
- `/pos/[id]` shows PO detail, item timelines, activity logs, editable PO header, flag escalation guard, and delete guard.
- `/masalah` lists and resolves open problems.
- `/settings` is a one-page Admin settings hub for users, clients, and read-only flags.
- Migration `20260503042553_add_po_date_urgent_vendor_item_spec_unit` is applied.

Notes:
- Admin override progress UI remains pending because the PRD explicitly marks its location as pending.
- Client settings remain intentionally simple because the PRD marks detailed client UI as TBD.
- The delete flow uses the current Admin's 4-digit staff PIN, while the PRD line says 6 digits for Admin delete confirmation; this remains a PRD inconsistency with the locked factory staff PIN rule.

Conclusion: Phase 4 foundational Admin core is complete.

## Next Recommended Work
- Start Phase 5: Operator flow (`/tasks`, role-specific panels, problem reporting, progress commits with React 19 `useOptimistic` cancel window, and Pusher after commit only).
- Replace remaining placeholder pages as their modules are implemented.
- Re-read relevant locked PRD sections before implementing each feature.
