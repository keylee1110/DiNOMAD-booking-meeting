# DiNOMAD — Spec-Driven Development

## What This Folder Is

Every feature built in this repo starts as a spec file here.  
The spec is the **source of truth** — it drives implementation, not the other way around.

```
docs/specs/
├── README.md                          ← this file (process + conventions)
├── TEMPLATE.md                        ← copy this for every new feature
│
├── feat-partner-checkin.md            ✅ done
├── feat-partner-dashboard.md          ✅ done
├── feat-partner-inventory-toggle.md   ✅ done
├── feat-partner-earnings.md           ✅ done
└── feat-partner-room-venue-crud.md    ✅ done
```

---

## Workflow

```
1. Write spec  →  2. Review / approve  →  3. Implement  →  4. Tick off ACs  →  5. Archive
```

### Step 1 — Write
Copy `TEMPLATE.md`. Fill in every section before writing a single line of code.  
If a section is unknown, write `TBD` and resolve it before step 3.

### Step 2 — Review
Spec must be read and approved by at least one other team member before implementation starts.  
For solo work: a 10-minute self-review is enough — the act of writing it surfaces missing details.

### Step 3 — Implement
Follow the spec exactly. If you discover the spec is wrong mid-implementation, **update the spec first** then continue. Never silently deviate.

### Step 4 — Tick off
After implementation, check off every AC in the spec. If any AC is not met, file it as a follow-up spec (not a quick fix in the same PR).

### Step 5 — Archive
Move completed specs to `docs/specs/done/` when the feature has been in production for one sprint.

---

## Spec File Naming

```
feat-{scope}-{feature}.md
```

| Scope | Meaning |
|---|---|
| `partner` | Partner portal features |
| `guest` | Guest-facing booking flow |
| `admin` | Admin dashboard |
| `infra` | Backend infrastructure, auth, config |
| `data` | Database schema changes |

Examples: `feat-partner-room-crud.md`, `feat-guest-checkout.md`, `feat-infra-auth-guard.md`

---

## Status Labels

Use these in the spec header and AC checkboxes:

| Label | Meaning |
|---|---|
| `draft` | Being written, not ready for review |
| `review` | Ready for team review |
| `approved` | Approved, implementation can start |
| `in-progress` | Being implemented |
| `done` | All ACs checked off, merged |
| `deferred` | Decided not to build yet |

---

## Relationship to Other Docs

| Doc | Purpose |
|---|---|
| `docs/product-requirements.md` | Business-level ACs (the "what") |
| `docs/backend-api-spec.md` | Full API contract reference |
| `docs/database-schema.md` | DB schema reference |
| `docs/specs/*.md` | **Implementation specs** (the "how") — you are here |
| `docs/developer-guide.md` | Living technical guide, updated after each spec lands |
