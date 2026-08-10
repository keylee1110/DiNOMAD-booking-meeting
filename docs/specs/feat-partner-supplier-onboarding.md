# Spec: Supplier Onboarding — "Become a Partner" Application Flow

**Status:** `done`
**PRD ref:** §Partner onboarding
**Branch:** `fix/booking-session-fixes`
**Author:** Claude (with Vi)
**Date:** 2026-07-18

---

## Overview

Venue owners currently "become suppliers" through an invisible auto-submission: signing up with the
supplier role creates a **placeholder** application (`"{Name} Space"`, note "Auto-submitted…", no tax
code) — and creates it **twice** (once via the `handle_new_auth_user` DB trigger, once via a client-side
RPC call), while the client RPC also prematurely sets `role='supplier'` before any admin approval.
Admins end up reviewing junk data and applicants have no page to check their status.

This spec replaces that with an explicit **"Become a Partner"** application page: real business info is
collected once through a form, the application is created exactly once through the backend, the user
stays `customer` until an admin approves (the existing `handle_supplier_status_change` trigger then
upgrades the role), and applicants can revisit the page to see pending / approved / rejected status.

---

## Acceptance Criteria

- [x] AC 1 — A logged-in customer can open `/{locale}/become-partner`, fill a business form (legal
  name*, brand name*, business phone*, business email, tax code, note) and submit; a `suppliers` row
  with real data + an owner `supplier_members` row are created, exactly once.
- [x] AC 2 — Submitting twice is impossible: the backend rejects a second application from a user who
  already has an active supplier membership (400), and the page shows status instead of the form.
- [x] AC 3 — The page shows the correct state for: guest (login prompt), no application (form),
  pending (under review), approved (link to partner portal), rejected (note + support hint).
- [x] AC 4 — Email signup with the Partner role no longer auto-creates any supplier row (neither via
  trigger nor client RPC); the user is routed to `/become-partner` after signup (or after email
  verification via the auth callback).
- [x] AC 5 — OAuth signup with the Partner role no longer auto-submits; the callback redirects to
  `/become-partner`.
- [x] AC 6 — `submit_supplier_application` RPC no longer sets `role='supplier'` directly; role changes
  only happen through the approval trigger.
- [x] AC 7 — The live-only `handle_supplier_status_change` trigger is captured in a migration file
  (ends schema drift).
- [x] AC 8 — All new UI strings exist in both `en.json` and `vi.json`.

**Out of scope for this spec:**
- Re-application after rejection (rejected applicants are told to contact support).
- Multi-member supplier team invites.
- Admin UI changes (approve/reject already works).

---

## Backend

### New endpoints

None — `POST /suppliers/applications` and `GET /suppliers/me` already exist (JWT-guarded).

### DTOs

`CreateSupplierApplicationDto` already exists (legalName, displayName, taxCode?, businessEmail?,
businessPhone?, onboardingNote?). No changes.

### DB changes

```sql
-- migration: 20260718000000_supplier_onboarding_cleanup.sql
-- 1. handle_new_auth_user: drop the auto-create-supplier block (profile insert only).
-- 2. submit_supplier_application: drop the premature `update profiles set role='supplier'`.
-- 3. Capture handle_supplier_status_change() + on_supplier_status_changed trigger
--    (currently live-DB-only) into version control, idempotently.
```

### Service logic

`SuppliersService.submitApplication` gains a duplicate guard:

```
1. findMine(userId) — if any active membership exists → BadRequestException
2. else call submit_supplier_application_for_user RPC as before
```

### Error cases

| Condition | HTTP | Error code |
|---|---|---|
| Already has an application/membership | 400 | `BAD_REQUEST` |
| Not authenticated | 401 | `UNAUTHORIZED` |
| Validation failure (missing legalName…) | 400 | `BAD_REQUEST` |

---

## Frontend

### New files

| File | Purpose |
|---|---|
| `app/[locale]/(main)/become-partner/page.tsx` | Application page: guest prompt / form / status states |
| `lib/api/suppliers.ts` | `getMySupplierMemberships()`, `submitSupplierApplication()` JWT fetch wrappers |

### Modified files

| File | Change |
|---|---|
| `app/[locale]/signup/page.tsx` | Remove client `submit_supplier_application` RPC; redirect supplier signups to `/become-partner` |
| `app/api/auth/callback/route.ts` | Replace auto-RPC with redirect to `/become-partner` for `mode=signup&role=supplier` |
| `lib/i18n/dictionaries/en.json`, `vi.json` | Add `partnerApply.*` keys |

### State shape

```typescript
type ApplyState =
  | { kind: "loading" }
  | { kind: "guest" }
  | { kind: "form" }               // logged in, no application
  | { kind: "status"; supplier: { status: "pending" | "approved" | "rejected" | "suspended"; displayName: string } }
```

### API calls made

```typescript
import { getMySupplierMemberships, submitSupplierApplication } from "@/lib/api/suppliers"
// getMySupplierMemberships: on mount (when logged in)
// submitSupplierApplication: on form submit
```

### i18n keys added

`partnerApply.title/subtitle/loginPrompt/loginCta/legalName/displayName/businessEmail/businessPhone/`
`taxCode/note/submit/submitting/successTitle/successBody/pendingTitle/pendingBody/approvedTitle/`
`approvedBody/approvedCta/rejectedTitle/rejectedBody/errors.*` (both locales).

---

## Test Plan

- [x] Manual: logged-out → `/vi/become-partner` shows login prompt (verified in browser)
- [x] Manual: `POST /api/suppliers/applications` without JWT → 401 (verified with curl)
- [x] Check: migration applied to live Supabase — `handle_new_auth_user` no longer inserts suppliers,
  `submit_supplier_application` no longer updates role, trigger present (verified via pg introspection)
- [x] Automated e2e (2026-07-19): disposable test user → sign in → apply → duplicate rejected (400) →
  role stays `customer` while pending → approve → trigger upgrades role to `supplier` →
  `GET /suppliers/me` reports approved. 13/13 checks passed; fixture fully cleaned up.
- [x] Check: signup/callback code paths no longer reference the client RPC (grep)
- [x] Entry points verified in browser: homepage "Become a partner" CTA and footer link both route
  to `/become-partner`

---

## Notes

- The e2e run caught that `submit_supplier_application_for_user` (the service-role variant the backend
  calls) **also** set `role='supplier'` prematurely — fixed in the same migration (section 2b) alongside
  the client-RPC variant. Verified: role stays `customer` until approval.
- Entry points: homepage partner CTA now routes to `/become-partner` (was `/signup?role=supplier`,
  which broke for already-logged-in customers) and the footer gained a "Become a Partner" link.
- The approval trigger (`handle_supplier_status_change`) already existed in the live DB but not in any
  migration — this spec brings it under version control rather than changing its behavior.
- Rejected applicants keep their membership row, so the duplicate guard also blocks re-application;
  intentional for now (out of scope), the rejected state explains to contact support.
- Login-page supplier checks (pending/rejected toasts) are untouched and continue to work, since
  status semantics are unchanged.
