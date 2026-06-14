# Spec: Admin Supplier Approval Flow

**Status:** `approved`
**PRD ref:** —  
**Branch:** —  
**Author:** AI agent  
**Date:** 2026-06-14

---

## Overview

Currently, users can register as a "Partner" (supplier) via the signup page, and a supplier row is created with `pending` status. However, the admin interface for reviewing and approving/rejecting these pending suppliers uses hardcoded mock data with no real API integration. This spec implements the full admin approval flow: supplier registers with `pending` status → admin reviews and approves/rejects → only approved suppliers can use the partner portal.

---

## Acceptance Criteria

- [x] AC 1: Signup page shows a "pending approval" message when a user registers as partner
- [x] AC 2: Admin can view a real list of all suppliers (pending + approved + rejected) fetched from the backend API
- [x] AC 3: Admin can approve a pending supplier with a single click (via confirmation)
- [x] AC 4: Admin can reject a pending supplier with a single click (via confirmation)
- [x] AC 5: Admin dashboard widget shows pending suppliers count and quick-approve
- [x] AC 6: All supplier-related UI strings are translated in both en.json and vi.json
- [x] AC 7: Supplier type is defined in lib/types/index.ts

**Out of scope for this spec:**
- Email notification to supplier on approval/rejection
- Partner portal status guard (pending user redirected to waiting page) — deferred

---

## Backend

### Existing endpoints (no changes needed)

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/suppliers` | `admin` | List all suppliers |
| `GET` | `/suppliers/:id` | `admin` / `supplier` | Get supplier by ID |
| `PATCH` | `/suppliers/:id` | `admin` | Update supplier (approve/reject) |

### DTOs

No new DTOs needed. `UpdateSupplierDto` already supports `status` field with values `pending | approved | rejected | suspended`.

### DB changes

No DB changes. The `suppliers` table already has `status` (default `pending`), `approved_at`, `approved_by` columns.

### Service logic

No service changes. `SuppliersService.update()` already handles setting `approved_by` and `approved_at` when status is `approved`.

---

## Frontend

### New files

| File | Purpose |
|---|---|
| `lib/api/admin.ts` | Admin API client: supplier list, approve, reject |

### Modified files

| File | Change |
|---|---|
| `lib/types/index.ts` | Add `Supplier` type |
| `lib/api/partner.ts` | No changes |
| `lib/i18n/dictionaries/en.json` | Add `admin.suppliers.*` keys |
| `lib/i18n/dictionaries/vi.json` | Add `admin.suppliers.*` keys |
| `app/[locale]/admin/suppliers/page.tsx` | Rewrite with real API, approve/reject dialogs, toasts |
| `app/[locale]/admin/_components/pending-suppliers.tsx` | Rewrite with real API data |
| `app/[locale]/signup/page.tsx` | Show pending-approval message for partner registrations |

### State shape

```typescript
// Local state in admin/suppliers/page.tsx
const [suppliers, setSuppliers] = useState<Supplier[]>([])
const [loading, setLoading] = useState(true)
const [approveTarget, setApproveTarget] = useState<Supplier | null>(null)
const [rejectTarget, setRejectTarget] = useState<Supplier | null>(null)
```

### API calls made

```typescript
import { getSuppliers, approveSupplier, rejectSupplier } from "@/lib/api/admin"
// getSuppliers() called on mount
// approveSupplier(id) called on approve button click
// rejectSupplier(id) called on reject button click
```

### i18n keys added

```json
"admin": {
  "suppliers": {
    "title": "Suppliers",
    "total": "{count} total suppliers",
    "approved": "Approved",
    "pending": "Pending Review",
    "rejected": "Rejected",
    "search": "Search suppliers...",
    "columns": {
      "supplier": "Supplier",
      "contact": "Contact",
      "district": "District",
      "rooms": "Rooms",
      "status": "Status",
      "actions": "Actions"
    },
    "statusLabels": {
      "approved": "Approved",
      "pending": "Pending",
      "rejected": "Rejected",
      "suspended": "Suspended"
    },
    "actions": {
      "approve": "Approve",
      "reject": "Reject",
      "view": "View",
      "approveConfirm": "Approve {name}?",
      "approveConfirmDesc": "This will grant full partner access to their account.",
      "rejectConfirm": "Reject {name}?",
      "rejectConfirmDesc": "This will deny their application to become a partner.",
      "approveSuccess": "{name} has been approved as a supplier!",
      "rejectSuccess": "{name} has been rejected.",
      "error": "Failed to update supplier status. Please try again."
    },
    "widget": {
      "title": "Pending Suppliers",
      "count": "{count} awaiting"
    },
    "empty": "No suppliers found.",
    "noPending": "No pending applications."
  }
}
```

---

## Test Plan

- [ ] Manual: Register a new account with Partner role → see "pending approval" message
- [ ] Manual: Go to Admin → Suppliers → see the new supplier listed as "Pending"
- [ ] Manual: Click "Approve" → confirm dialog → supplier changes to "Approved"
- [ ] Manual: Click "Reject" on another → confirm dialog → supplier changes to "Rejected"
- [ ] Manual: Verify the admin dashboard widget updates correctly
- [ ] Manual: Verify i18n switching between EN and VN shows correct labels

---

## Notes

- Backend already has full CRUD for suppliers including approve/reject logic.
- The `pending-suppliers.tsx` widget is embedded in the admin dashboard (`/admin/page.tsx`). That page uses `PendingSuppliers` without props, so the widget fetches its own data.
- Approval confirmation uses shadcn/ui `Dialog` component.
- All API calls use the same `apiFetch` pattern from `lib/api/partner.ts` extracted to `lib/api/admin.ts`.
