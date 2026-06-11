# Spec: [Feature Name]

**Status:** `draft` | `review` | `approved` | `in-progress` | `done`  
**PRD ref:** §X.X  
**Branch:** `feat/...`  
**Author:** —  
**Date:** YYYY-MM-DD

---

## Overview

> 2–3 sentences. What problem does this solve? Who is it for? What is the outcome?

---

## Acceptance Criteria

> Copy from `docs/product-requirements.md`. Check off as implementation completes.

- [ ] AC 1
- [ ] AC 2
- [ ] AC 3

**Out of scope for this spec:**
- Item deferred to a later spec

---

## Backend

### New endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/path` | `supplier` | … |

### DTOs

```typescript
// Request
class CreateXDto {
  field: type   // @Decorator
}

// Response shape
{
  id: string
  field: type
}
```

### DB changes

> List any new tables, columns, indexes, or migrations needed.
> If none: "No DB changes."

```sql
-- migration: YYYYMMDD_description.sql
ALTER TABLE ...
```

### Service logic

> Pseudocode or bullet points for non-obvious business logic only.

```
1. Look up supplier_id from supplier_members
2. Validate ownership
3. Insert + return
```

### Error cases

| Condition | HTTP | Error code |
|---|---|---|
| Not found | 404 | `NOT_FOUND` |
| Not owner | 403 | `FORBIDDEN` |

---

## Frontend

### New files

| File | Purpose |
|---|---|
| `app/[locale]/path/page.tsx` | … |
| `lib/api/feature.ts` | … |

### Modified files

| File | Change |
|---|---|
| `components/x.tsx` | Add prop Y |

### State shape

```typescript
// Local state in the component
const [state, setState] = useState<Type>(initial)
```

### API calls made

```typescript
import { fnName } from "@/lib/api/feature"
// called on: mount | button click | form submit
```

### i18n keys added

```json
"scope": {
  "key": "English value"
}
```

---

## Test Plan

- [ ] Manual: describe the click path to verify the happy path
- [ ] Manual: error case 1
- [ ] Manual: error case 2
- [ ] Check: localStorage key `dinomad_x` updated correctly (if applicable)
- [ ] Check: Supabase table row created/updated

---

## Notes

> Architecture decisions, trade-offs, follow-up items.
