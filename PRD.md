# POgrid.id — Product Requirements Document
> **Version:** 5.1 | **Date:** 2 May 2026 | **Status:** LOCKED
> **Authority:** This document supersedes PRD v5.0 and all previous versions.
> **Rule:** When a section says LOCKED, treat it as immutable unless the product owner explicitly says "update PRD".
> **Changelog v5.1:** Resolved two product decisions from consistency review. (1) Return trigger: both Delivery operator and Admin can trigger a client return — updated §4.3, §23.4, §23.7. (2) Month selector on /tasks: month selector appears on Arsip tab only; filter chips (Terlambat/Dekat/Berjalan) appear on Aktif tab only — updated §23.1. No stack or flow changes.
> **Changelog v5.0:** Upgraded stack to Next.js 15, React 19, Tailwind CSS v4. Removed tailwind.config.js — theme now lives in globals.css @theme block. Dynamic route params/searchParams are now async Promises — all dynamic pages updated. Removed export const dynamic = 'force-dynamic' requirement (Next.js 15 default behavior). Lifted useRouter ban — useRouter from next/navigation is now permitted. Replaced Zustand uiStore.pendingProgress with React 19 useOptimistic for cancel window mechanic. All product decisions, flows, data models, and permissions unchanged from v4.5.
> **Changelog v4.5:** Switched database from Turso (libSQL/SQLite edge) to Neon (Serverless Postgres). Removed @prisma/adapter-libsql and @libsql/client dependencies. Prisma version unpinned. Updated schema provider, env vars, and lib/db.ts pattern.
> **Changelog v4.4:** Added Section 25 — Dashboard UI/UX for Owner/Manager/Sales, PDF Export watermark spec, and read-only PO detail log access.
> **Changelog v4.3:** Added Section 24 — Finance UI/UX (landing layout, card anatomy, action buttons, return handling, AuditLog).
> **Changelog v4.2:** Completed Section 23 — Operator UI/UX all roles (Operator, Drafter, Purchasing, QC, Delivery). Added problem report form, search scope, return rule.
> **Changelog v4.1:** Added Section 23 — Operator UI/UX. Updated Section 20 progress mechanic (qty-based vs slider). Added last activity row spec.
> **Changelog v4.0:** Added Section 22 — Admin UI/UX Decisions (LOCKED). Updated Sections 18, 19, and AuditLog actions.

---

## TABLE OF CONTENTS

1. Product Overview
2. System Architecture
3. Access Layers
4. Roles & Permissions
5. Authentication & Session
6. Data Models
7. Stage Flow
8. Production Flow Logic
9. QC Gate Protocol
10. Rework & Return Protocols
11. Flag System
12. Finance Flow
13. Problem Reporting
14. Notifications
15. Analytics Dashboard
16. PDF Export
17. Public Demo
18. Pages & Routes
19. PO Creation Flow
20. Operator Progress Update
21. Permanently Out of Scope
22. Admin UI/UX Decisions ← NEW v4.0
23. Operator UI/UX Decisions ← NEW v4.1
24. Finance UI/UX Decisions ← NEW v4.3
25. Dashboard UI/UX Decisions ← NEW v4.4

---

## 1. PRODUCT OVERVIEW

**POgrid.id** is an internal SaaS web application for small-to-medium Indonesian fabrication factories (iron, aluminum, CNC machining, welding, fabrication, etc.).

### Core Value Proposition
A single visibility layer that answers any status question about any Production Order without asking another person.

### Questions POgrid Answers
- "Which stage is this PO at right now?"
- "When will these items be shipped?"
- "What problems occurred in production?"
- "Has PO #xxx been invoiced yet?"
- "Which production stage is causing the most delays?"

### What POgrid Is NOT
- Not an ERP system
- Not accounting software
- No monetary values or invoice amounts
- No invoice generator
- No file upload or attachment system
- No external client access
- No multi-language support (Indonesian only)

---

## 2. SYSTEM ARCHITECTURE — LOCKED

### 2.1 Deployment Model

| Property | Value |
|----------|-------|
| Model | **Single-tenant** |
| Codebase | Single codebase |
| Deployment | Single Vercel deployment per client |
| Database | One Neon DB per client instance |
| Isolation | Complete — no cross-client data possible |
| Pricing | Monthly flat subscription per workspace |

### 2.2 Tech Stack — LOCKED

| Layer | Technology | Version | Notes |
|-------|------------|---------|-------|
| Framework | Next.js | 15 (App Router) | |
| Language | TypeScript | Strict mode | |
| UI | React | 19 | |
| Styling | Tailwind CSS | v4 | No tailwind.config.js — theme in globals.css |
| ORM | Prisma | latest stable | No adapter needed |
| Database | Neon (Serverless Postgres) | — | One project per client |
| Real-time | Pusher Channels | ap1 cluster | Not SSE |
| Auth | iron-session | latest | Not NextAuth |
| PDF Export | `@react-pdf/renderer` | latest | Server-side only |
| Icons | lucide-react | latest | |
| Script runner | tsx | latest | Never ts-node |
| bcrypt | bcryptjs | 2.x | Stay on v2.x |

### 2.3 Critical Technical Rules — LOCKED

```
1.  No Prisma enums — all status/type/role fields are String with TypeScript union types
2.  No tenantId / companyId — single-tenant DB, never add these fields
3.  No top-14 — all sticky headers use sticky top-0
4.  No #92400E — dead color, never use
5.  export const dynamic = 'force-dynamic' is no longer required — Next.js 15 does not cache by default. Omit it unless a specific route needs to opt back into caching, in which case use fetch cache options explicitly.
6.  app/layout.tsx must never have 'use client'
7.  useRouter from next/navigation is permitted in Next.js 15. window.location.href inside useEffect is no longer required for navigation. Use useRouter for programmatic navigation.
8.  All animations via globals.css classes — never inline
9.  Zustand v5 double-invocation: create<T>()(immer(...))
10. useOptimistic (React 19 built-in) must be used for the 5-second cancel window mechanic in operator progress updates. Do not use Zustand uiStore.pendingProgress for this — useOptimistic handles optimistic UI + rollback natively.
11. All dynamic route page components must treat params and searchParams as async Promises. Always await them: const { id } = await params.
12. import 'dotenv/config' must be FIRST line in all scripts
13. All scripts use tsx — never ts-node
14. lib/db.ts — not lib/prisma.ts (non-negotiable file name)
15. lib/session.ts — not lib/auth.ts (non-negotiable file name)
```

### 2.4 File Naming Convention — LOCKED

| Purpose | Correct File | Forbidden Names |
|---------|-------------|-----------------|
| Prisma client (Neon) | `lib/db.ts` | `lib/prisma.ts`, `lib/database.ts` |
| Iron session helpers | `lib/session.ts` | `lib/auth.ts`, `lib/iron-session.ts` |
| Pusher server + client | `lib/pusher.ts` | `lib/pusher-server.ts` |
| Utilities | `lib/utils.ts` | `lib/helpers.ts` |
| Constants | `lib/constants.ts` | `lib/config.ts` |

### 2.5 Environment Variables

```env
# .env.local
NEXT_PUBLIC_CLIENT_NAME="PT. Maju Jaya"
NEXT_PUBLIC_BRAND_COLOR="#14b8a6"
NEXT_PUBLIC_BRAND_COLOR_DARK="#0d9488"

DATABASE_URL="postgresql://user:password@ep-xxx.ap-southeast-1.aws.neon.tech/pogrid?sslmode=require"
DIRECT_URL="postgresql://user:password@ep-xxx.ap-southeast-1.aws.neon.tech/pogrid?sslmode=require"

IRON_SESSION_PASSWORD="min-32-chars-random-string"

PUSHER_APP_ID="..."
PUSHER_KEY="..."
PUSHER_SECRET="..."
PUSHER_CLUSTER="ap1"
NEXT_PUBLIC_PUSHER_KEY="..."
NEXT_PUBLIC_PUSHER_CLUSTER="ap1"

SUPER_ADMIN_PIN="123456"

ADMIN_WA_NUMBER="628123456789"
COMPANY_NAME="PT. Maju Jaya"
```

---

## 3. ACCESS LAYERS — LOCKED

### Layer 1 — Superadmin (Platform Owner)

| Property | Value |
|----------|-------|
| Who | Developer / platform owner only |
| Route | `/superadmin` (hidden — no link from any frontend page) |
| PIN | 6-digit numeric, bcrypt hashed |
| Scope | Platform-level configuration |

**Superadmin Capabilities:**
- Workspace branding (company name, primary color, logo)
- Configure production departments (add, name, reorder, delete)
- Set PO number template for auto-generation
- Set urgency flag thresholds (override defaults)
- Set Admin WhatsApp number for Forgot PIN
- Database seed and reset (PIN re-confirmation required)
- Billing and subscription status

> **LOCKED:** Production department configuration is Superadmin-only. Admin cannot add or remove departments.

### Layer 2 — Factory Staff

| Property | Value |
|----------|-------|
| Who | Factory employees |
| Route | `/login` |
| PIN | 4-digit numeric, bcrypt hashed |
| Scope | Their workspace only |

---

## 4. ROLES & PERMISSIONS — LOCKED

### 4.1 Static Roles

| Role | Type | Primary Access |
|------|------|----------------|
| `ADMIN` | Static | Full CRUD on POs, items, users, clients |
| `OWNER` | Static | Full analytics dashboard — read-only |
| `MANAGER` | Static | Full analytics dashboard — read-only |
| `SALES` | Static | Analytics dashboard — read-only |
| `QC` | Static | QC queue — items in QC stage |
| `DELIVERY` | Static | Delivery queue — items in DELIVERY stage |
| `FINANCE` | Static | Finance dashboard — invoice management |
| `DRAFTER` | Static | DRAFTING stage items — optional role |
| `PURCHASING` | Static | PURCHASING stage items |

### 4.2 Dynamic Operator Roles

Each production department configured by Superadmin automatically generates a corresponding operator role.

**Pattern:** `OPERATOR_{DEPARTMENT_NAME_UPPERCASE}`

**Examples:**
- Superadmin adds "Machining" → `OPERATOR_MACHINING` role becomes available
- Superadmin adds "Welding" → `OPERATOR_WELDING` role becomes available
- Superadmin adds "Finishing" → `OPERATOR_FINISHING` role becomes available

Admin assigns these roles to users. Roles stay in sync with configured departments.

### 4.3 Permission Matrix

| Action | ADMIN | OWNER/MANAGER/SALES | Operators | QC | DELIVERY | FINANCE |
|--------|:-----:|:-------------------:|:---------:|:--:|:--------:|:-------:|
| Create/edit PO | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Update own dept progress | ✅ override | ❌ | ✅ | ✅ | ✅ | ❌ |
| QC Pass/Fail | ✅ override | ❌ | ❌ | ✅ | ❌ | ❌ |
| Mark Delivered | ✅ override | ❌ | ❌ | ❌ | ✅ | ❌ |
| Mark Invoiced/Paid | ✅ override | ❌ | ❌ | ❌ | ❌ | ✅ |
| View all items (Board) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Analytics dashboard | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage users | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Report problem | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ |
| Trigger client return | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Admin override any progress | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

> **LOCKED:** Admin override on any item is logged as `ADMIN_OVERRIDE` in AuditLog.

### 4.4 Item Assignment Rule — LOCKED

- Items are assigned to **departments**, never to individual users.
- QC and DELIVERY use a queue system — any user with that role can pick up any item in that stage.

---

## 5. AUTHENTICATION & SESSION — LOCKED

### 5.1 Login Flow

```
Step 1: User taps Department/Role icon on /login screen
        ↓
Step 2: Bottom drawer slides up
        → Shows all active users in that department
        ↓
Step 3: User taps their name
        ↓
Step 4: 4-digit PIN numpad appears
        → User enters PIN
        ↓
Step 5a: PIN correct → iron-session set → redirect to role home
Step 5b: PIN wrong   → animate-shake + "PIN salah" + cooldown
```

### 5.2 PIN Specification

| Property | Superadmin | Factory Staff |
|----------|-----------|---------------|
| Length | 6 digits | 4 digits |
| Type | Numeric only | Numeric only |
| Storage | bcrypt hash | bcrypt hash |
| Plain text stored | Never | Never |
| Default on create | N/A | Auto-generated easy number |

**Easy number:** Curated set of memorable 4-digit patterns (e.g., 2468, 1357, 3691). Not truly random. Generated on user creation and PIN reset.

### 5.3 Session Shape (iron-session)

```typescript
interface SessionData {
  userId:     string;
  name:       string;
  department: string;
  role:       string;
  isLoggedIn: boolean;
}

export const sessionOptions = {
  password:    process.env.IRON_SESSION_PASSWORD!,
  cookieName:  'pogrid-session',
  cookieOptions: {
    secure:   process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict' as const,
    // No maxAge — sessions never expire
  },
};
```

### 5.4 Session Rules — LOCKED

- Sessions **never expire** — user stays logged in indefinitely
- Logout only via manual logout button
- PIN reset is the sole recovery mechanism for lost/shared devices
- Remote session invalidation is NOT implemented

### 5.5 PIN Management

**Admin resets another user's PIN:**
```
Settings → Users → Select user → "Reset PIN"
→ System generates new easy number
→ Admin communicates PIN to user directly (out of band)
```

**User changes their own PIN:**
```
Profile → "Ganti PIN"
→ Enter new PIN (4 digits) + Confirm new PIN
→ Save → Toast: "PIN berhasil diubah ✓"
```
> No old PIN required for self-change.

**Forgot PIN:**
```
/login → "Lupa PIN?" button
→ Opens WhatsApp deep link to Admin's number
→ Pre-filled: "Halo Admin [Company Name], saya [User Name]
   butuh reset PIN untuk akses POgrid. Terima kasih."
```

### 5.6 Role → Home Route Map

| Role | Home Route |
|------|-----------|
| ADMIN | `/pos` |
| OWNER / MANAGER / SALES | `/dashboard` |
| FINANCE | `/finance` |
| DRAFTER | `/tasks` |
| PURCHASING | `/tasks` |
| OPERATOR_* | `/tasks` |
| QC | `/tasks` |
| DELIVERY | `/tasks` |

---

## 6. DATA MODELS — LOCKED

> **Rule:** No Prisma enums. All values are String fields. TypeScript union types enforce valid values at the application layer.

### 6.1 Prisma Schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")  // Required by Neon for migrations
}

model User {
  id        String   @id @default(cuid())
  username  String   @unique
  name      String
  pin       String   // bcrypt hash
  role      String   // "ADMIN" | "OWNER" | "MANAGER" | "SALES" | "QC" | "DELIVERY"
                     // "FINANCE" | "DRAFTER" | "PURCHASING" | "OPERATOR_{DEPT}"
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  auditLogs AuditLog[]
  problems  Problem[]
}

model Department {
  id        String   @id @default(cuid())
  name      String   @unique
  order     Int      // Display/flow order within PRODUCTION ZONE
  active    Boolean  @default(true)
  createdAt DateTime @default(now())
  itemProgresses ItemProgress[]
}

model Client {
  id        String   @id @default(cuid())
  name      String
  createdAt DateTime @default(now())
  pos       PO[]
}

model PO {
  id                 String   @id @default(cuid())
  po_internal_number String   @unique  // Auto-generated from template
  po_client_number   String            // Manual entry
  clientId           String
  due_date           DateTime
  urgency_flag       String   @default("NORMAL")
  // urgency_flag: "NORMAL" | "ORANGE" | "RED" | "BLOOD_RED"
  notes              String?
  status             String   @default("ACTIVE")
  // status: "ACTIVE" | "FINISHED" | "CLOSED"
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
  client             Client   @relation(fields: [clientId], references: [id])
  items              Item[]
}

model Item {
  id                  String    @id @default(cuid())
  poId                String
  name                String
  qty                 Int
  work_type           String    // JSON array of department IDs e.g. '["dept-1","dept-2"]'
  status              String    @default("DRAFTING")
  // status: "DRAFTING" | "PURCHASING" | "PRODUCTION" | "QC" | "DELIVERY" | "DONE"

  // DRAFTING tracking
  drawing_approved    Boolean   @default(false)
  drawing_revision    Int       @default(0)
  purchasing_progress Int       @default(0)   // 0-100 percentage

  // Rework / Return lineage
  is_rework           Boolean   @default(false)
  rework_type         String?   // "MINOR" | "MAJOR"
  rework_reason       String?
  source              String    @default("ORIGINAL") // "ORIGINAL" | "REWORK" | "RETURN"
  parentItemId        String?
  parent              Item?     @relation("ItemLineage", fields: [parentItemId], references: [id])
  children            Item[]    @relation("ItemLineage")

  // Finance
  invoice_status      String    @default("PENDING")
  // invoice_status: "PENDING" | "INVOICED" | "PAID"
  invoiced_at         DateTime?
  paid_at             DateTime?

  // Stage timestamps (dwell time analytics)
  drafting_started_at    DateTime?
  purchasing_started_at  DateTime?
  production_started_at  DateTime?
  qc_started_at          DateTime?
  delivery_started_at    DateTime?
  done_at                DateTime?

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  po          PO         @relation(fields: [poId], references: [id])
  progresses  ItemProgress[]
  problems    Problem[]
  auditLogs   AuditLog[]
}

model ItemProgress {
  id             String     @id @default(cuid())
  itemId         String
  departmentId   String
  progress       Int        @default(0)   // 0-100 percentage
  started_at     DateTime?
  completed_at   DateTime?
  updatedAt      DateTime   @updatedAt

  item           Item       @relation(fields: [itemId], references: [id])
  department     Department @relation(fields: [departmentId], references: [id])

  @@unique([itemId, departmentId])
}

model Problem {
  id              String    @id @default(cuid())
  itemId          String
  reportedBy      String    // User.id or "system"
  source          String    @default("OPERATOR")  // "OPERATOR" | "SYSTEM"
  note            String
  resolved        Boolean   @default(false)
  resolvedBy      String?
  resolvedAt      DateTime?
  resolution_note String?
  createdAt       DateTime  @default(now())
  item            Item      @relation(fields: [itemId], references: [id])
}

model AuditLog {
  id         String   @id @default(cuid())
  itemId     String?  // nullable — some actions are PO-level
  poId       String?  // for PO-level audit entries
  userId     String   // User.id or "system"
  action     String
  // Existing actions:
  // "PROGRESS_UPDATE" | "STAGE_ADVANCE" | "QC_PASS" | "QC_MINOR_FAIL"
  // "QC_MAJOR_FAIL" | "DELIVERY_CONFIRM" | "REWORK_SPAWNED" | "RETURN_SPAWNED"
  // "DRAWING_APPROVED" | "DRAWING_REDRAW" | "ADMIN_OVERRIDE" | "INVOICE_UPDATE"
  // New actions (v4.0):
  // "EDIT_PO_FIELD" | "FLAG_ESCALATE" | "DELETE_PO" | "PROBLEM_RESOLVED"
  // "PIN_RESET" | "SELF_PIN_CHANGE" | "USER_CREATED" | "USER_TOGGLED"
  fromValue  String?
  toValue    String?
  metadata   String?  // JSON string for extra context
  createdAt  DateTime @default(now())
  item       Item?    @relation(fields: [itemId], references: [id])
}

model Notification {
  id        String   @id @default(cuid())
  userId    String
  type      String
  message   String
  itemId    String?
  poId      String?
  read      Boolean  @default(false)
  createdAt DateTime @default(now())
}

model PoSequence {
  id       String @id @default("singleton")
  year     Int
  sequence Int    @default(0)
}

model SystemConfig {
  id             String   @id @default("singleton")
  clientName     String   @default("POgrid Client")
  brandColor     String   @default("#14b8a6")
  brandColorDark String   @default("#0d9488")
  logoUrl        String?  // base64 data URI, max 100KB
  poPrefix       String   @default("PO-[YYYY]-[SEQ]")
  adminWaNumber  String?
  flagThreshold1 Int      @default(7)
  flagThreshold2 Int      @default(3)
  updatedAt      DateTime @updatedAt
}
```

---

## 7. STAGE FLOW — LOCKED

```
DRAFTING → PURCHASING → [PRODUCTION ZONE] → QC → DELIVERY → DONE
```

### Stage Definitions

| Stage | Owner | Mechanic | Advance Condition |
|-------|-------|----------|-------------------|
| `DRAFTING` | DRAFTER | Single gate: Approve or Redraw | Drafter approves drawing |
| `PURCHASING` | PURCHASING | 0–100% slider | Manual save (non-blocking) |
| `PRODUCTION` | OPERATOR_* | `ItemProgress` per dept, 0–100% each | All dept counters reach 100% |
| `QC` | QC | Three-path gate (Pass / Minor fail / Major fail) | Explicit QC gate action |
| `DELIVERY` | DELIVERY | 0–100% stepper | Explicit Delivery confirmation at 100% |
| `DONE` | — | Terminal — irreversible | Finance invoicing unlocked |

### PRODUCTION ZONE

- Defined by Superadmin-configured departments
- Each department has its own `ItemProgress` row per item
- All counters must individually reach 100% before auto-advance to QC
- Parallel — departments work independently and simultaneously
- Default departments: Machining, Fabrikasi, Finishing

### Stage Transition Timestamps

Every stage entry sets a `{stage}_started_at` timestamp on the Item. Used for dwell time analytics.

---

## 8. PRODUCTION FLOW LOGIC — LOCKED

### 8.1 Auto-Advance Logic

```typescript
function checkAndAdvanceToQC(item: Item, progresses: ItemProgress[]): boolean {
  if (item.status !== 'PRODUCTION') return false;
  const allDone = progresses
    .filter(p => item.work_type includes p.departmentId)
    .every(p => p.progress >= 100);
  return allDone;
}
```

### 8.2 DRAFTING Gate Logic

```
Drafter taps "Setujui Gambar" → item.drawing_approved = true → advance to PURCHASING
Drafter taps "Perlu Redraw"  → item.drawing_revision++ → reason logged in AuditLog
                              → item stays in DRAFTING at progress 0
                              → Problem record created (source: 'SYSTEM')
                              → Admin + Manager notified
```

> If no DRAFTER users exist in the workspace, DRAFTING auto-advances to PURCHASING immediately on PO creation.

### 8.3 PURCHASING Anomaly Detection

```typescript
if (item.purchasing_progress < 100 && progressUpdate.stage === 'PRODUCTION') {
  await createSystemProblem(item.id, 'Production started before purchasing complete');
  // Auto-resolves when item.purchasing_progress reaches 100
}
```

### 8.4 Progress Update Rules — LOCKED

| Rule | Behavior |
|------|----------|
| Only Up | `min_slider_value = current_server_value` — cannot decrease |
| Fresh Fetch | Always fetch current value from server when operator opens item |
| Last Write Wins | Concurrent updates — last request to reach server wins |
| Auto Advance | All dept counters at 100% → item auto-advances to QC |
| Audit Trail | Every update logged: userId, fromValue, toValue, timestamp |

### 8.5 5-Second Cancel Window — LOCKED

```
Operator saves progress
        ↓
Toast: "Progress disimpan ✓ — Batalkan?" (5-second countdown)
        ↓
If 5s passes with no cancel → commit to server → Pusher fires item-updated
If "Batalkan" tapped < 5s   → rollback UI → no server write → Pusher does NOT fire
```

> **LOCKED:** Pusher `item-updated` fires ONLY after the 5-second window closes without cancel.

---

## 9. QC GATE PROTOCOL — LOCKED

### Trigger
QC operator marks item at 100% → card fade-out animation (250ms) → QC Gate bottom-sheet opens.

### Path A — All Pass
- Item `status → DELIVERY`, `progress → 0`
- `qc_passed_at` timestamp set
- AuditLog: `action: 'QC_PASS'`
- Pusher: `item-updated`

### Path B — Minor Defect (Same Item)
- Same item stays, `status` remains `QC`, `progress → 0`
- `is_rework = true`, `rework_type = 'MINOR'`
- REWORK badge applied permanently
- AuditLog: `action: 'QC_MINOR_FAIL'`
- Admin + Manager notified

### Path C — Major Defect (Spawn Child)
**Partial fail (NG qty < item qty):**
- Card A: `qty` updates to passing units → advances to `DELIVERY`
- Card B: new Item spawned, `qty = NG qty`, `status = PRODUCTION`, `parentItemId = Card A.id`
- Card B: all `ItemProgress` rows created fresh at 0
- Card B: `is_rework = true`, `rework_type = 'MAJOR'`, `source = 'REWORK'`

**Total fail (NG qty = item qty):**
- Card A: stays as record, `status` does NOT advance
- Card B: spawned with full original qty

- AuditLog: `action: 'QC_MAJOR_FAIL'` / `action: 'REWORK_SPAWNED'`
- Admin + Manager notified

### Rework Reason Options
```
"Dimensi tidak sesuai"
"Surface / finishing NG"
"Retak / crack"
"Salah material"
"Lainnya" → [text field — only keyboard exception for operators]
```

---

## 10. REWORK & RETURN PROTOCOLS — LOCKED

### 10.1 Rework Breadcrumb Pill
- Rework: orange pill `↩ RW dari [parent.name]`
- Return: red pill `↩ RETURN dari [parent.name]`
- Always references immediate parent

### 10.2 Client Return Protocol
```
Delivery operator taps "Return" on DELIVERY-stage item → selects return qty + reason
System:
  1. Original item stays DONE (terminal — not touched)
  2. New child Item spawned: source = 'RETURN', status = 'PRODUCTION'
  3. AuditLog on child: action = 'RETURN_SPAWNED'
  4. Finance notified: original item shown as PENDING RETURN
```

> **LOCKED:** DONE is terminal. Returns spawn a new child, never regress the original.

### 10.3 REWORK Badge Rule — LOCKED
- **Permanent.** Never cleared regardless of subsequent QC passes.
- Visible at all stages to all roles.

---

## 11. FLAG SYSTEM — LOCKED

### 11.1 Four Flag Levels

| Level | Name | Hex | Trigger |
|-------|------|-----|---------|
| 1 | NORMAL | `#16A34A` | Default on PO creation |
| 2 | ORANGE | `#F97316` | Auto: days remaining ≤ Threshold 1 (default 7) |
| 3 | RED | `#EF4444` | Auto: days remaining ≤ Threshold 2 (default 3) |
| 4 | BLOOD_RED | `#7F1D1D` | Auto: past due date |

### 11.2 Escalation Formula

```typescript
const daysRemaining = differenceInDays(po.due_date, today); // Asia/Jakarta timezone

if (daysRemaining > threshold1)   return 'NORMAL';
if (daysRemaining <= threshold1)  return 'ORANGE';
if (daysRemaining <= threshold2)  return 'RED';
if (daysRemaining < 0)            return 'BLOOD_RED';
```

### 11.3 Override Rules — LOCKED
- Admin can **manually escalate** flag level
- Admin **cannot manually de-escalate** — only the system can lower the flag
- System lowers flag automatically if `due_date` is extended

### 11.4 Thresholds
- Default: Threshold 1 = 7 days, Threshold 2 = 3 days
- Overridable per workspace by Superadmin only

### 11.5 Visual Representation
Flag displayed as **left border color** on all PO and item cards:
```
border-l-4 border-l-[flag-color]
```

### 11.6 Sorting Priority
1. BLOOD_RED (top) → 2. RED → 3. ORANGE → 4. NORMAL (bottom)

---

## 12. FINANCE FLOW — LOCKED

### 12.1 Three-State Invoice Flow
```
PENDING → INVOICED → PAID
```

| State | Trigger | Who |
|-------|---------|-----|
| `PENDING` | Item reaches DONE | System |
| `INVOICED` | Finance marks invoice sent | Any FINANCE user |
| `PAID` | Finance marks payment confirmed | Any FINANCE user |

### 12.2 Rules
- Finance can invoice per **individual item** with status `DONE`
- No monetary values stored anywhere in the system
- All state changes logged in AuditLog

### 12.3 PO Status Auto-Computation

```typescript
const allPaid  = allItems.every(i => i.invoice_status === 'PAID');
const allDone  = allItems.every(i => i.status === 'DONE');

let newStatus = 'ACTIVE';
if (allPaid)       newStatus = 'CLOSED';
else if (allDone)  newStatus = 'FINISHED';
```

### 12.4 Return Items in Finance
- Child items from returns: shown with red `↩ RETURN` pill
- Not invoiceable until they complete PRODUCTION → QC → DELIVERY again

---

## 13. PROBLEM REPORTING — LOCKED

### Rules
- Any operator can report a problem on any item — non-blocking
- Problems never lock or stop production
- One-tap resolution + optional resolution note

### Resolution Permissions
- The person who filed it: always can resolve
- Same-stage operators: can resolve problems on items in their stage
- Admin and Manager: can resolve any problem at any time
- System problems: auto-resolve when triggering condition clears

---

## 14. NOTIFICATIONS — LOCKED

### Delivery
**In-app only.** No WhatsApp, email, Telegram, or push notifications.

### Role-Targeted Events

| Event | Recipients |
|-------|-----------|
| New PO created | All operators in all relevant departments |
| Item advances to new stage | Operators of the next stage |
| Problem reported on item | OWNER, MANAGER, ADMIN |
| Drawing redraw flagged | ADMIN, MANAGER |
| Urgency flag escalates | OWNER, MANAGER, ADMIN |
| Item marked Rework (QC fail) | OWNER, MANAGER, ADMIN |
| Item DONE (Delivered) | FINANCE, OWNER, MANAGER |
| Finance marks PAID | OWNER, MANAGER |

### UI Components
- `NotificationBell`: top bar icon + unread count badge
- `NotificationDropdown`: list of recent notifications
- `NotificationItem`: icon + message + timestamp + link to item/PO

---

## 15. ANALYTICS DASHBOARD — LOCKED

### Access
ADMIN, OWNER, MANAGER, SALES. Finance cannot access analytics.

### Timezone
All calculations use **`Asia/Jakarta`** timezone. Hardcoded.

### Period Filter
`1M | 3M | 6M | 12M` (default: `3M`).

### KPI Cards

| Metric | Calculation |
|--------|-------------|
| Total POs | Count POs in period |
| On-Time % | (On-time deliveries / Total deliveries) × 100 |
| Avg Lead Time | Mean of `(done_at - createdAt)` in days |
| Total Overdue Items | Count items with BLOOD_RED flag |
| Total RW Items | Count items where `is_rework = true` |
| Stalled Items | Count items with no `ItemProgress` update in 24h |

### Charts

| Chart | Type | Notes |
|-------|------|-------|
| On-Time vs Late | Grouped bar (month × count) | Teal + Red |
| Bottleneck by Dept | Horizontal bar (dept × avg dwell days) | Highest bar highlighted red |
| Rework Reasons | Donut | One slice per reason value |

### Stalled Items — LOCKED
- Threshold: 24h no `ItemProgress` update — **never stored in DB**
- `24j+` badge visible to MANAGER and ADMIN only

---

## 16. PDF EXPORT — LOCKED

| Property | Value |
|----------|-------|
| Library | `@react-pdf/renderer` |
| Generation | Server-side only |
| API route | `GET /api/export/pdf?period=3M` |
| Access | ADMIN, MANAGER only |
| Output | PDF file download |

---

## 17. PUBLIC DEMO — LOCKED

| Property | Value |
|----------|-------|
| Route | `/demo` |
| Access | Public — no login required |
| Data | Hardcoded mock — no database connection |
| Mode | Read-only |
| Reset cycle | 24 hours (clock-based, no cron needed) |

Demo state is a pure function of `(now % 24hours)`. Client-side Pusher simulation creates live feel.

---

## 18. PAGES & ROUTES — LOCKED

| Route | Access | Description |
|-------|--------|-------------|
| `/login` | Public | Dept icon → name → PIN numpad |
| `/dashboard` | OWNER, MANAGER, SALES | Analytics & KPI |
| `/pos` | ADMIN | Beranda — KPI cards + PO list |
| `/po` | ADMIN | Full PO list with tabs filter |
| `/pos/new` | ADMIN | Create new PO |
| `/pos/[id]` | All roles | PO detail + all items |
| `/masalah` | ADMIN | All open problems across all POs |
| `/tasks` | All operators | Task list — role-filtered items |
| `/board` | All roles | Global floor view — all items all stages |
| `/finance` | FINANCE | Invoice management |
| `/settings` | ADMIN | Workspace settings hub (tabs) |
| `/settings/users` | ADMIN | Manage users & roles |
| `/settings/clients` | ADMIN | Client database |
| `/settings/flags` | ADMIN | View flag thresholds (read-only) |
| `/superadmin` | SUPERADMIN only | Platform management |
| `/demo` | Public | Demo — no login |

### Admin Bottom Nav

| Tab | Icon | Route |
|-----|------|-------|
| Beranda | grid | `/pos` |
| PO | clipboard | `/po` |
| Cari | search | `/search` |
| Buat | plus | `/pos/new` |
| Masalah | alert | `/masalah` |
| Kelola | settings | `/settings` |
| Profil | user | `/profile` |

### Owner / Manager / Sales Bottom Nav

| Tab | Icon | Route |
|---|---|---|
| Beranda | grid | `/pos` |
| PO | clipboard | `/po` |
| Cari | search | `/search` |
| Masalah | alert | `/masalah` |
| Dashboard | chart | `/dashboard` |
| Profil | user | `/profile` |

### Next.js 15 Dynamic Route Rule

All page components receiving `params` or `searchParams` must be async and await them.

**Pattern:**
```typescript
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  // ...
}
```

**Affected routes:** `/pos/[id]`, `/items/[id]`, and any future dynamic segments.

This is a breaking change from Next.js 14. Every dynamic route file must follow this pattern without exception.

---

## 19. PO CREATION FLOW — LOCKED

### Route
`/pos/new` — accessible via Tab "Buat" (+ icon in bottom nav). Tap `+` goes directly to form — no action sheet.

### Form Fields — Header PO

| Field | Tipe | Validasi | Keterangan |
|-------|------|----------|------------|
| Nomor PO | Text | Wajib | Auto-generate dari template (editable) |
| Client PO | Text | Opsional | Manual entry |
| Customer | Dropdown | Wajib | Searchable dari DB klien |
| Customer Baru | Button | — | → bottom sheet form tambah klien |
| Tanggal PO | Date | Wajib | Auto-fill hari ini |
| Deadline Delivery | Date | Opsional | Manual picker |
| Catatan | Textarea | Opsional | — |
| URGENT | Toggle | — | — |
| VENDOR JOB | Toggle | — | — |

### Form Fields — Per Item (inline, repeatable)

| Field | Tipe | Validasi | Keterangan |
|-------|------|----------|------------|
| Nama Item | Text | Wajib | — |
| Spesifikasi | Text | Opsional | Spesifikasi teknis |
| Jumlah | Number stepper | Wajib | Default 1 |
| Unit | Text | — | Default "pcs" |
| Jenis Produksi | Checkbox multi-select | Min 1 wajib | Dari configured departments |

- Tombol `+ Tambah Item` untuk add item berikutnya

### Customer Baru Flow
- Tap `Customer Baru` → **bottom sheet** form tambah klien
- Fields: Nama Perusahaan (wajib) + Kontak (opsional)
- Submit → klien langsung terpilih di dropdown

### Validasi Submit
- Field wajib kosong → **border merah per field**
- Tidak auto-scroll ke field pertama yang error

### Submit Sukses
```
→ Toast: "PO berhasil dibuat ✓"
→ window.location.href = `/pos/${newPoId}`
→ Urgency flag computed from due_date
→ All relevant operators receive in-app notification:
  "PO baru [PO Number] dari [Client] telah dibuat"
→ Items immediately visible on Board to all roles
```

---

## 20. OPERATOR PROGRESS UPDATE — LOCKED

```
Operator opens /tasks
        ↓
Taps item card → expands inline update panel (inline, not bottom sheet)
        ↓
Panel header: "UPDATE · [DEPT_NAME]"
Panel shows:
  - Item name, total qty, current progress (fetched fresh from server)
  - Progress mechanic (see below)
  - Both dept counters visible: own (interactive) + others (read-only, e.g. "MACH 8/20")
        ↓
Operator adjusts value → taps "Simpan"
        ↓
5-second cancel window:
  Toast: "Progress disimpan ✓ — Batalkan?" [countdown]
        ↓
No cancel after 5s → commit to server → Pusher fires item-updated
Cancel tapped      → rollback UI → no server write
```

### 20.1 Progress Mechanic — LOCKED

| Item Qty | Mechanic | Notes |
|----------|----------|-------|
| `qty = 1` | **Slider 0–100%** | Single unit — percentage is natural |
| `qty > 1` | **Qty stepper** `[−][n][+]` | "Sudah selesai: n / total pcs" |

**Qty stepper quick-add shortcuts** (when `qty > 1`):
- `+5` · `+10` · `+20` · `Semua (n)` — where n = remaining qty
- Label: *"Tersisa [n] pcs yang bisa ditambahkan"*
- Cannot exceed total qty

**Progress % calculation** (for display on card):
```typescript
const progressPct = Math.round((doneQty / item.qty) * 100);
```

### 20.2 Item Card Last Activity Row — LOCKED

Bottom of each item card shows last AuditLog entry for that item:
```
[username] · [HH:MM]          [dept] → [progress%]
```
- Fetched from most recent `AuditLog` entry where `action = 'PROGRESS_UPDATE'`
- Shows `"Unknown"` if `userId = 'system'` or user not found

### 20.3 5-Second Cancel Window — State Mechanic

**State mechanic: React 19 useOptimistic. Never Zustand, never useState for this mechanic.**

The 5-second cancel window uses `useOptimistic` to apply the optimistic progress value immediately on Simpan tap. If the user cancels within 5 seconds, the optimistic value is discarded and the UI reverts to the last server value automatically — no manual rollback code needed. The actual DB write and Pusher event fire only after the 5-second window closes without cancel.

**State behavior:**

```
State 1 — Unsaved local change
  → Batalkan button ACTIVE
  → Tap: discard optimistic value, revert to last server value
  → No API call fired

State 2 — At saved position (no change)
  → Batalkan VISIBLE but DISABLED
  → opacity-40, pointer-events-none

State 3 — Post-save 5-second window
  → Replace button with toast:
    "Progress disimpan ✓ — Batalkan?"
    bg: #dcfce7, text: #16A34A
  → Tap within 5s: useOptimistic reverts → no DB write, no Pusher event
  → After 5s: toast disappears, DB write commits, Pusher item-updated fires
```

> Pusher `item-updated` fires ONLY after the 5-second window closes without cancel.

---

## 21. PERMANENTLY OUT OF SCOPE

These will NEVER be added:
- Monetary values or amounts on POs
- Invoice generator (PDF invoices with prices)
- File upload or attachment to any entity
- External client access / client-facing portal
- WhatsApp, email, Telegram, or push notifications
- Integration with accounting software
- Multi-currency support
- Multi-language support (Indonesian only)
- Assignment of items to individual users
- ERP features of any kind
- Gantt charts or per-stage deadlines
- Bill of Materials (BOM)
- Material Resource Planning (MRP)
- Barcode or IoT integration
- AI forecasting or demand planning

---

## 22. ADMIN UI/UX DECISIONS — LOCKED
> **Added:** v4.0 (28 April 2026)
> These decisions are the result of explicit product owner Q&A and are binding.

### 22.1 `/pos` — Beranda (Admin Home)

- **KPI Cards (4):** Terlambat · Deadline Dekat · Masalah Terbuka · Selesai
- **Stats bawah:** Rata-rata Keterlambatan (hari) + PO Terburuk (jam terlambat)
- **Below stats:** List PO card aktif — sorted by urgency desc

**PO Card anatomy:**
```
border-l-4 (flag color)
├── Nama klien                    [URGENT badge]
├── No. PO internal · No. PO klien
├── ████████░░ 75%   (progress bar)
├── Due 12 Mar · ⏰ 46h terlambat
└── ⚠ Material terlambat datang   (active problem snippet)
```

### 22.2 `/po` — PO List

- **Filter:** Tabs horizontal — **Semua / Terlambat / Urgent**
- Sorted: terlambat first, then by `due_date` ascending per tab

### 22.3 `/pos/[id]` — PO Detail

**Header stats (3 kolom):**
| Kolom | Label |
|-------|-------|
| Progress % | PROGRESS |
| Jam terlambat | TERLAMBAT |
| Jumlah masalah | MASALAH |

**Item timeline per item:**
- Dot per departemen: `DRFT · PURCH · MACH · FABR · QC · DELIV`
- Dot states: `●` selesai · `◐` in progress · `○` belum · `⚠` ada masalah
- Badge `TERLAMBAT` per item jika applicable
- Tombol `> log aktivitas` per item

**Log aktivitas:**
- Tap `> log aktivitas` → **bottom sheet** chronological per item
- Menampilkan: PROGRESS_UPDATE, STAGE_ADVANCE, ADMIN_OVERRIDE, dll

**Edit PO:**
- Trigger: tap area header atau tombol edit
- UI: **bottom sheet**
- Fields: Klien · No. PO Klien · Due Date · Urgency · Notes
- Danger Zone di bawah tombol simpan → `Hapus PO`

**Delete PO — Guard System:**
1. **Blocked** jika ada item `status = DONE` atau `invoice_status = PAID`
   - Pesan: *"PO tidak bisa dihapus karena ada item yang sudah selesai atau diinvoice."*
2. **Step 1** (jika eligible): tampilkan konsekuensi → jumlah item affected
3. **Step 2**: Input PIN Admin (6 digit)
   - PIN salah → `animate-shake` + tidak terhapus
   - PIN benar → hapus + `window.location.href = '/pos'`
4. **AuditLog:** `action: 'DELETE_PO'`, `poId`, `metadata: { totalItems, poNumber }`

> AuditLog Delete PO dicatat di **level PO** (poId field), bukan itemId.

**Admin override progress:** ⏳ PENDING — lokasi belum ditentukan.

### 22.4 `/masalah` — Tab Masalah

- **Landing:** list semua masalah terbuka across semua PO
- **Default sort:** severity desc + jam terlambat desc (paling urgent di atas)
- **Filter:** by PO / dept / urgency level
- **Resolve:** tap `[Resolve →]` → bottom sheet konfirmasi + input catatan resolusi
- **AuditLog:** `action: 'PROBLEM_RESOLVED'` di level PO

### 22.5 `/settings` — Tab Kelola

- **Layout:** **Tabs dalam satu halaman** — Users / Klien / Flags (tidak ada sub-route redirect)

**Tab Users:**
- List semua user dengan nama + role + status aktif
- Tap user → **inline expand**: Reset PIN + Toggle aktif/nonaktif
- Reset PIN → generate easy number → tampil di inline expand
- `+ Tambah User` → **form inline muncul di atas list**:
  - Fields: Nama, Username, Role
  - Submit → PIN auto-generate → **tampil di form sebelum form di-close**
  - Setelah tutup → user muncul di list

**Tab Klien:**
- Client database (detail UI: TBD)

**Tab Flags:**
- View flag thresholds — **read-only**
- Teks: *"Threshold diatur oleh Superadmin. Hubungi platform owner untuk mengubah."*

### 22.6 Tab Profil

- Info user login: Nama + Role
- Tombol **Ganti PIN**:
  - Input PIN baru (4 digit) + konfirmasi
  - Tidak perlu PIN lama
  - Toast: *"PIN berhasil diubah ✓"*
- Tombol **Logout**

### 22.7 AuditLog Actions — Admin-Specific (v4.0)

| Action | Trigger | Level |
|--------|---------|-------|
| `EDIT_PO_FIELD` | Edit field PO — `{field, from, to}` | PO |
| `FLAG_ESCALATE` | Urgency diubah manual oleh Admin | PO |
| `DELETE_PO` | Hapus PO — `{totalItems, poNumber}` | PO |
| `PROBLEM_RESOLVED` | Masalah diselesaikan + catatan | PO |
| `PIN_RESET` | Admin reset PIN user lain | User |
| `SELF_PIN_CHANGE` | User ganti PIN sendiri | User |
| `USER_CREATED` | Tambah user baru | User |
| `USER_TOGGLED` | Aktif/nonaktif user | User |

### 22.8 Pending Decisions

| # | Topic | Status |
|---|-------|--------|
| Override | Lokasi override progress item oleh Admin | ⏳ Pending |
| Clients UI | Detail UI `/settings/clients` | ⏳ TBD |

---

## 23. OPERATOR UI/UX DECISIONS — LOCKED
> **Added:** v4.1 (28 April 2026)

### 23.1 `/tasks` — Task List

- **Header:** "Tugas Saya" + NotificationBell + Logout icon
- **Search bar:** "Cari item, customer, PO..." — global scope (semua item semua dept)
  - Items milik dept operator = interaktif (ada update panel)
  - Items di luar dept operator = **read-only card** (tidak ada tombol apapun)
- **Tabs:** `Aktif (n)` / `Arsip (n)`
  - **Aktif** = items in DRAFTING / PURCHASING / PRODUCTION / QC / DELIVERY
  - **Arsip** = items with status DONE milik dept operator ini — read-only
- **Filter chips** (inside Aktif tab only): `Terlambat` · `Dekat` · `Berjalan` — hidden when Arsip is active
- **Month selector** `< Jan 2026 (12) >` (inside Arsip tab only): filters Arsip items by month — hidden when Aktif is active

**Filter chip definitions:**

| Chip | Logic |
|------|-------|
| Terlambat | `due_date < today` |
| Dekat | `daysRemaining <= flagThreshold1` (default ≤ 7 hari) |
| Berjalan | Ada `ItemProgress` update dalam 24 jam terakhir |

**Sort order (default, Aktif tab):**
1. Delayed (paling lama terlambat)
2. Deadline terdekat
3. Urgent flag (RED/ORANGE)
4. Rework item

**Group header:** Items dikelompokkan dengan header `TERLAMBAT X hari` jika melewati due date.

### 23.2 Item Card Anatomy (Aktif)

```
border-l-4 (flag color)
├── [TERLAMBAT X hari] badge
├── ● Nama Item    [Ada Masalah (n)]           [XX%] [URGENT]
├── Nama Klien · qty pcs · [X Hari terlambat]
├── [Dept chip: Machining]
├── Draft X% · Purch X% · MACH x/y · Fabr x/y · QC x/y · Deliv x/y
├── ████████████░░░░ (progress bar)
└── [username] · [HH:MM]                  [dept] → [progress%]
```

### 23.3 Item Card Anatomy (Arsip)

- Nama item · Qty · Klien · Tanggal selesai · Badge REWORK (jika ada)
- Read-only — tidak ada expand panel, tidak ada tombol

### 23.4 Update Panel per Role

**OPERATOR_* (Machining, Fabrikasi, dll):**
```
UPDATE · [DEPT_NAME]
─────────────────────────────────
Sudah selesai:              0 / 20 pcs

Tambah [Dept] Hari Ini:
       [−]   [  0  ]   [+]
  Tersisa 20 pcs yang bisa ditambahkan
  [+5]  [+10]  [+20]  [Semua (20)]

⚠ Laporkan Masalah

                    [Batal]  [Simpan]
```
- `qty = 1` → slider 0–100%
- `qty > 1` → qty stepper + quick-add shortcuts

**DRAFTER:**
```
UPDATE · DRAFTING
─────────────────────────────────
[Nama Item] · Rev. [n]

  [✅ Setujui Gambar]

  [↩ Perlu Redraw]
  → toast langsung: "Gambar dikembalikan untuk direvisi"
  → System auto-create Problem + notif Admin/Manager
```

**PURCHASING:**
```
UPDATE · PURCHASING
─────────────────────────────────
[Nama Item]

  ○ Order dibuat          (33%)
  ○ Konfirmasi vendor     (66%)
  ○ Material tiba ✅      (100%)

→ Tap step = set progress ke nilai tersebut
→ Tidak bisa mundur ke step sebelumnya

⚠ Laporkan Masalah

                    [Batal]
```

**QC:**
```
UPDATE · QC
─────────────────────────────────
[Nama Item] · Total: 5 pcs

  ✅ Lolos      Qty: [−][3][+]
  ⚠ Minor       Qty: [−][1][+]
  ❌ Mayor       Qty: [−][1][+]

  Total harus = 5 pcs (validasi sebelum submit)

⚠ Laporkan Masalah

                    [Batal]  [Konfirmasi]
```
- Lolos → langsung ke Delivery
- Minor → item sama, progress reset ke 0, badge REWORK permanent
- Mayor → spawn child item baru ke PRODUCTION
- Partial qty supported (misal: 3 lolos + 2 mayor)

**DELIVERY:**
```
UPDATE · DELIVERY
─────────────────────────────────
Qty dikirim:  [−][ 5 ][+]
              [Semua (5)]

⚠ Laporkan Masalah

              [Batal]  [✅ Konfirmasi Terkirim]
```
- Konfirmasi → item `status = DONE` → Finance notified
- Return dapat di-trigger oleh **Delivery operator** atau **Admin** — keduanya bisa akses ReturnSheet pada item DELIVERY

### 23.5 Form Laporkan Masalah (Bottom Sheet)

```
── Laporkan Masalah ─────────── ✕
[Nama Item]

Kategori *
[ Pilih kategori ▾ ]

Pilihan:
  - Material belum datang
  - Material tidak sesuai
  - Mesin/alat bermasalah
  - Operator tidak tersedia
  - Gambar/spesifikasi tidak jelas
  - Lainnya → catatan WAJIB diisi

Catatan tambahan (opsional)
[                            ]
← Wajib jika kategori = Lainnya

              [Batal]  [Kirim Laporan]
```
- Submit → Problem record created (`source: 'OPERATOR'`)
- Notif dikirim ke OWNER, MANAGER, ADMIN
- Toast: *"Masalah berhasil dilaporkan"*

### 23.6 Notifikasi Operator

- Tap notif → `/tasks` biasa (tidak ada highlight/auto-expand)
- Operator cari item via search bar atau filter chips

### 23.7 Rules Tambahan

| Rule | Nilai |
|------|-------|
| Return item | Delivery operator dan Admin — keduanya bisa trigger |
| Purchasing tidak bisa mundur milestone | Locked |
| QC total qty harus match sebelum submit | Validasi client-side |
| Search scope | Global semua item — luar dept = read-only |

---

## 24. FINANCE UI/UX DECISIONS — LOCKED
> **Added:** v4.3 (28 April 2026)

### 24.1 `/finance` — Landing View

Layout:
```
── Summary Header ───────────────────────────────
┌──────────┐  ┌──────────┐  ┌──────────┐
│    12    │  │    5     │  │    8     │
│ PENDING  │  │ INVOICED │  │  PAID    │
└──────────┘  └──────────┘  └──────────┘

── Filter ───────────────────────────────────────
🔍 Cari item, klien, PO...        [Semua Klien ▾]

── Tabs ─────────────────────────────────────────
[PENDING]  [INVOICED]  [PAID]

── List item cards ──────────────────────────────
```

### 24.2 Item Card Anatomy

```
border-l-4 (flag color)
├── Nama Item                          [↩ RETURN badge jika ada]
├── Nama Klien · No. PO · No. PO Klien
├── qty pcs · Selesai: [tanggal DONE]
├── Invoiced: [tanggal] / Paid: [tanggal]  ← jika applicable
└── [Tombol action — lihat 24.3]
```

### 24.3 Tombol Action per Tab

| Tab | Tombol |
|-----|--------|
| PENDING | `[✅ Tandai Diinvoice]` |
| INVOICED | `[💰 Tandai Lunas]` |
| PAID | `[↩ Batalkan Lunas]` ← untuk koreksi |

**Semua tombol wajib konfirmasi bottom sheet sebelum execute:**
```
── Konfirmasi ───────────────── ✕
"[Nama action] [Nama Item]?"

[Batal]        [✅ Ya, Konfirmasi]
```
- Setelah konfirmasi → execute → toast sukses
- AuditLog ditulis (lihat 24.5)

### 24.4 Return Items

- Item return **disembunyikan** dari semua tab Finance selama masih dalam proses re-produksi
- Setelah item return selesai re-delivered (`status = DONE`) → muncul di tab PENDING
- Muncul dengan badge merah `↩ RETURN`
- Diperlakukan sama seperti item biasa untuk proses invoice

### 24.5 AuditLog Finance Actions

| Action | fromValue | toValue | Trigger |
|--------|-----------|---------|---------|
| `INVOICE_UPDATE` | `PENDING` | `INVOICED` | Tandai Diinvoice |
| `INVOICE_UPDATE` | `INVOICED` | `PAID` | Tandai Lunas |
| `INVOICE_UPDATE` | `PAID` | `INVOICED` | Batalkan Lunas |

### 24.6 Filter & Search

| Komponen | Spec |
|----------|------|
| Search bar | Global, persistent di semua tab — scope: nama item · nama klien · no. PO |
| Filter klien | Dropdown searchable — filter list sesuai klien terpilih |
| Kombinasi | Search + filter klien bisa dipakai bersamaan |

---

## 25. OWNER / MANAGER / SALES DASHBOARD UI/UX — LOCKED
> **Added:** v4.4 (28 April 2026)

### 25.1 Dashboard Analytics (`/dashboard`)

**Layout & Logic:**
- **Period filter:** Top, persistent.
- **KPI Cards:** Scroll horizontal (mobile).
- **Sticky Summary Bar:** Appears **conditionally** when KPI cards scroll out of viewport.
  - Sticky Bar Content: `● [n] PO Aktif · [n]% On-Time · ⚠ Bottleneck: [DEPT]`
  - Height: 48px.
- **Charts:** 3 charts (On-Time vs Late, Bottleneck, Rework Reasons).
- **Alert Sections:** Stalled items (24h+), Selesai Sangat Cepat.
- **Access:** ADMIN, OWNER, MANAGER, SALES (all same view).

### 25.2 PDF Export

- **Permission:** All dashboard roles (ADMIN, MANAGER, OWNER, SALES).
- **Feature:** Watermark included on every page: `Diekspor oleh [Nama User] · [Tanggal & Jam]`.

### 25.3 PO Detail Read-Only Access (`/pos/[id]`)

- **Permissions:** OWNER, MANAGER, SALES can view all PO details.
- **Restriction:** Read-only (no Edit PO, no Delete PO, no Admin Override buttons).
- **Log Aktivitas:** Full access to tap `> log aktivitas` per item.

---

## APPENDIX A — Tailwind v4 Theme Configuration
> **Replaces:** tailwind.config.js (deleted in v5.0)

Tailwind v4 has no `tailwind.config.js`. All theme configuration lives in `globals.css` using `@theme`. Content detection is automatic — no content array needed. Install: `@tailwindcss/vite` (or `@tailwindcss/postcss` depending on build setup).

The following replaces the old `tailwind.config.js` entirely. Add to `globals.css`:

```css
@import "tailwindcss";

@theme {
  --color-brand:        #14b8a6;
  --color-brand-dark:   #0d9488;
  --color-brand-light:  #ccfbf1;
  --color-warning:      #F97316;
  --color-danger:       #EF4444;
  --color-blood:        #7F1D1D;
  --color-success:      #16A34A;
  --color-navy:         #1D3B4D;

  --font-family-sans:   'Inter', sans-serif;

  --animate-slide-up:     slide-up 300ms ease-out forwards;
  --animate-fade-out:     fade-out 250ms ease-out forwards;
  --animate-fade-in:      fade-in 250ms ease-in forwards;
  --animate-shake:        shake 400ms ease-in-out;
  --animate-pulse-rework: pulse-rework 2s ease-in-out infinite;

  --keyframes-slide-up-from:      { transform: translateY(100%); }
  --keyframes-slide-up-to:        { transform: translateY(0); }
  --keyframes-fade-out-from:      { opacity: 1; transform: translateY(0); }
  --keyframes-fade-out-to:        { opacity: 0; transform: translateY(-8px); }
  --keyframes-fade-in-from:       { opacity: 0; transform: translateY(-8px); }
  --keyframes-fade-in-to:         { opacity: 1; transform: translateY(0); }
  --keyframes-shake-0-100:        { transform: translateX(0); }
  --keyframes-shake-20-60:        { transform: translateX(-8px); }
  --keyframes-shake-40-80:        { transform: translateX(8px); }
  --keyframes-pulse-rework-0-100: { opacity: 1; }
  --keyframes-pulse-rework-50:    { opacity: 0.7; }
}
```

Class names in JSX remain identical: `animate-slide-up`, `bg-brand`, `text-danger`, etc. Arbitrary values like `bg-[#1D3B4D]` remain valid in v4.

---

## APPENDIX B — globals.css

```css
@import "tailwindcss";

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

@theme {
  --color-brand:        #14b8a6;
  --color-brand-dark:   #0d9488;
  --color-brand-light:  #ccfbf1;
  --color-warning:      #F97316;
  --color-danger:       #EF4444;
  --color-blood:        #7F1D1D;
  --color-success:      #16A34A;
  --color-navy:         #1D3B4D;

  --font-family-sans:   'Inter', sans-serif;

  --animate-slide-up:     slide-up 300ms ease-out forwards;
  --animate-fade-out:     fade-out 250ms ease-out forwards;
  --animate-fade-in:      fade-in 250ms ease-in forwards;
  --animate-shake:        shake 400ms ease-in-out;
  --animate-pulse-rework: pulse-rework 2s ease-in-out infinite;

  --keyframes-slide-up-from:      { transform: translateY(100%); }
  --keyframes-slide-up-to:        { transform: translateY(0); }
  --keyframes-fade-out-from:      { opacity: 1; transform: translateY(0); }
  --keyframes-fade-out-to:        { opacity: 0; transform: translateY(-8px); }
  --keyframes-fade-in-from:       { opacity: 0; transform: translateY(-8px); }
  --keyframes-fade-in-to:         { opacity: 1; transform: translateY(0); }
  --keyframes-shake-0-100:        { transform: translateX(0); }
  --keyframes-shake-20-60:        { transform: translateX(-8px); }
  --keyframes-shake-40-80:        { transform: translateX(8px); }
  --keyframes-pulse-rework-0-100: { opacity: 1; }
  --keyframes-pulse-rework-50:    { opacity: 0.7; }
}

:root {
  --color-brand:        #14b8a6;
  --color-brand-dark:   #0d9488;
  --color-brand-light:  #ccfbf1;
  --color-warning:      #F97316;
  --color-danger:       #EF4444;
  --color-blood:        #7F1D1D;
  --color-success:      #16A34A;
  --color-navy:         #1D3B4D;
  --color-bg:           #F8F9FA;
  --color-surface:      #FFFFFF;
  --color-text:         #1A1A2E;
  --color-muted:        #6B7280;
  --color-border:       #E5E7EB;
}

* {
  box-sizing: border-box;
  -webkit-tap-highlight-color: transparent;
}

body {
  font-family: 'Inter', sans-serif;
  background-color: var(--color-bg);
  color: var(--color-text);
  -webkit-font-smoothing: antialiased;
}

/* Safe area for iOS */
.pb-safe {
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

/* Hide scrollbars (filter chips, KPI row) */
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

/* Animations — kept as fallback; @theme block above is the v4 source of truth */
@keyframes slide-up {
  from { transform: translateY(100%); }
  to   { transform: translateY(0); }
}
.animate-slide-up { animation: slide-up 300ms ease-out forwards; }

@keyframes fade-out {
  from { opacity: 1; transform: translateY(0); }
  to   { opacity: 0; transform: translateY(-8px); }
}
.animate-fade-out { animation: fade-out 250ms ease-out forwards; }

@keyframes fade-in {
  from { opacity: 0; transform: translateY(-8px); }
  to   { opacity: 1; transform: translateY(0); }
}
.animate-fade-in { animation: fade-in 250ms ease-in forwards; }

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-8px); }
  40%, 80% { transform: translateX(8px); }
}
.animate-shake { animation: shake 400ms ease-in-out; }

@keyframes pulse-rework {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.7; }
}
.animate-pulse-rework { animation: pulse-rework 2s ease-in-out infinite; }
```

---

*End of PRD v5.0 — 1 May 2026*
*This document supersedes PRD v4.5 and all previous versions.*
*Authority: Product owner — Tito Doni*
