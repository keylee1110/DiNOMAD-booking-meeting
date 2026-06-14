# DiNOMAD Frontend — AI Agent Guide

> This file is read by Claude Code, Cursor, Copilot, and all AI coding assistants.
> Follow every rule here to keep the codebase consistent across team members.

---

## What This Project Is

DiNOMAD is a **meeting room and workspace booking marketplace** for Ho Chi Minh City.
- Guests search, book, and check in to verified workspaces
- Partners (venue owners) manage their listings and track earnings
- Admins oversee the platform

**Monorepo structure:** This is the root package (`.`) in the DiNOMAD monorepo.
- `.` (root)    — this Next.js frontend (you are here)
- `backend/`    — NestJS backend (`@dinomad/backend`)
- `database/`   — SQL schema and seed files (Supabase)

Run backend: `pnpm dev:backend` · Run frontend: `pnpm dev`

**Stack:** Next.js 16 App Router · TypeScript · Tailwind CSS v4 · Radix UI (shadcn/ui) · React Hook Form + Zod

---

## Absolute Rules (Never Break These)

```
❌ NEVER install a new UI component library — shadcn/ui is already set up in components/ui/
❌ NEVER hardcode color values (e.g. text-[#3B82F6]) — use CSS variables only
❌ NEVER hardcode text strings in JSX — always use the t() translation hook
❌ NEVER create a new booking state outside of lib/store/booking-store.tsx
❌ NEVER use localStorage directly — go through the booking store
❌ NEVER add "use client" to a page-level file unless absolutely required
❌ NEVER write inline styles — use Tailwind classes
❌ NEVER duplicate a type — all types live in lib/types/index.ts
```

---

## Monorepo Structure

```
dinomad/                        ← repo root
├── (Next.js frontend files)    ← YOU ARE HERE (root = web app)
├── backend/                    ← NestJS backend (@dinomad/backend)
│   └── src/
│       ├── modules/            ← auth, users, suppliers, health, ...
│       ├── common/             ← decorators, filters, interceptors, types
│       ├── config/
│       ├── database/
│       └── main.ts
├── database/                   ← schema.sql, seed.sql (Supabase)
├── docs/                       ← all project documentation
├── CLAUDE.md                   ← AI agent rules (you are reading this)
├── package.json                ← root workspace + frontend deps
└── pnpm-workspace.yaml         ← declares "." and "backend" as packages
```

Run commands:
```bash
pnpm dev             # start frontend (port 3000)
pnpm dev:backend     # start backend  (port 3001)
```

## This App's Frontend Structure

```
app/[locale]/
  (main)/          ← public pages (guests)
  admin/           ← admin dashboard
  partner/         ← venue partner portal

components/
  ui/              ← DO NOT EDIT — Radix/shadcn primitives
  layout/          ← Header, Footer, MobileNav
  *.tsx            ← shared feature components

lib/
  data/            ← MOCK DATA — will be replaced by API calls
  types/index.ts   ← frontend-specific types (shared types → packages/types)
  store/           ← React Context state
  i18n/            ← translations and locale hook
  format.ts        ← VND formatter, date helpers
  utils.ts         ← cn() helper
```

---

## Component Rules

### Always use existing UI primitives
```tsx
// ✅ Correct — use from components/ui/
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

// ❌ Wrong — never use raw HTML for these
<button className="...">Click</button>
<div className="card ...">...</div>
```

### Classnames — always use cn()
```tsx
import { cn } from "@/lib/utils"

// ✅ Correct
<div className={cn("base-class", isActive && "active-class", className)}>

// ❌ Wrong
<div className={`base-class ${isActive ? "active-class" : ""} ${className}`}>
```

### New shared components
- Place in `components/` (not inside a page's `_components/`)
- Accept a `className?: string` prop always
- Export as named export, not default

### Page-level components
- Place in `app/[locale]/.../page.tsx`
- Private sub-components go in `_components/` folder alongside the page

---

## Styling Rules

### Use CSS variables (design tokens) — never raw colors
```tsx
// ✅ Correct — uses design tokens
<div className="bg-background text-foreground border-border">
<span className="text-muted-foreground">
<div className="bg-primary text-primary-foreground">

// ❌ Wrong — hardcoded colors
<div className="bg-white text-gray-900">
<div className="bg-blue-600 text-white">
```

### Responsive design — always mobile-first
```tsx
// ✅ Correct
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">

// ❌ Wrong — desktop-first
<div className="grid grid-cols-3 sm:grid-cols-1">
```

### Dark mode — always pair classes
```tsx
// ✅ Correct
<div className="bg-white dark:bg-zinc-900 text-black dark:text-white">
```

### Standard patterns
```tsx
// Card
<div className="rounded-xl border bg-card p-4 shadow-sm">

// Section spacing
<section className="py-8 md:py-12">

// Container
<div className="container mx-auto px-4">

// Muted label
<span className="text-sm text-muted-foreground">
```

---

## i18n Rules

Every user-visible string must go through the translation hook — no exceptions.

```tsx
import { useTranslation } from "@/lib/i18n/context"

export function MyComponent() {
  const { t, locale } = useTranslation()
  
  // ✅ Correct
  return <h1>{t("home.hero.title")}</h1>
  
  // ❌ Wrong — hardcoded string
  return <h1>Find your perfect workspace</h1>
}
```

Add new keys to **both** `lib/i18n/dictionaries/en.json` and `vi.json` at the same time.

For localized room data:
```tsx
import { getLocalizedRoom } from "@/lib/data/rooms"
const room = getLocalizedRoom(rawRoom, locale)
// Now room.name, room.description, room.address are in the right language
```

---

## TypeScript Rules

### All types go in lib/types/index.ts
```ts
// ✅ Correct — import from central types file
import type { Room, Booking, TimeSlot } from "@/lib/types"

// ❌ Wrong — inline interface in a component file
interface MyRoom { id: string; name: string }
```

### Never use `any`
```ts
// ✅ Correct
const handleData = (room: Room) => { ... }

// ❌ Wrong
const handleData = (room: any) => { ... }
```

### Prefer type over interface for unions
```ts
type BookingStatus = "confirmed" | "pending" | "completed" | "cancelled" | "checked_in"
```

---

## State Management Rules

### Booking flow state → always use booking-store
```tsx
import { useBooking } from "@/lib/store/booking-store"

const { state, dispatch, myBookings } = useBooking()

// Set room
dispatch({ type: "SET_ROOM", payload: room })

// Set date
dispatch({ type: "SET_DATE", payload: "2025-06-15" })

// Set selected continuous time range
dispatch({ type: "SET_SLOTS", payload: selectedSlots })

// Confirm booking (saves to localStorage until backend is ready)
dispatch({ type: "CONFIRM_BOOKING" })
```

### Local UI state → useState
```tsx
// Fine for: modal open/close, active tab, hover state, form input
const [isOpen, setIsOpen] = useState(false)
```

---

## Time Slot Rules

Slots are always **30-minute increments** from **07:00 to 22:00**.

```ts
// Slot selection must be CONTINUOUS — no gap allowed between selected slots
// ✅ Valid:   09:00 → 09:30 → 10:00 → 10:30  (contiguous block)
// ❌ Invalid: 09:00 selected, then 11:00 selected (gap in between)
```

When implementing the slot picker:
- First click = start time
- Second click = end time (auto-fill everything in between)
- If a booked slot exists within the range → block selection, show error
- Always show live summary: "09:00 → 11:00 · 2 hours · 500,000₫"

---

## Pricing Rules

```ts
const PLATFORM_FEE_RATE = 0.10  // 10% — matches BR-02

const roomFee = pricePerHour * durationHours
const platformFee = Math.round(roomFee * PLATFORM_FEE_RATE)
const totalPrice = roomFee + platformFee
```

Always display the breakdown — never show only the total.

---

## Replacing Mock Data with Real API

When the backend is ready, replace these files **one at a time**. Do not refactor multiple files at once.

| Mock file | API endpoint to call |
|---|---|
| `lib/data/rooms.ts` → `searchRooms()` | `GET /api/rooms` |
| `lib/data/rooms.ts` → `getRoomById()` | `GET /api/rooms/:id` |
| `lib/data/time-slots.ts` → `generateTimeSlots()` | `GET /api/rooms/:id/slots?date=` |
| `lib/store/booking-store.tsx` → `CONFIRM_BOOKING` | `POST /api/bookings` |
| `lib/store/booking-store.tsx` → `myBookings` | `GET /api/bookings` (by phone token) |

Use the fetch wrapper at `lib/api.ts` (create this when backend is ready):
```ts
import { apiFetch } from "@/lib/api"
const rooms = await apiFetch("/rooms?district=Quận 1")
```

---

## Forms

Always use React Hook Form + Zod. Never use uncontrolled inputs.

```tsx
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Form, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

const schema = z.object({
  phone: z.string().min(10, "Số điện thoại không hợp lệ"),
  name: z.string().min(2, "Vui lòng nhập tên"),
})

const form = useForm({ resolver: zodResolver(schema) })
```

---

## Naming Conventions

| Thing | Convention | Example |
|---|---|---|
| Component file | kebab-case | `room-card.tsx` |
| Component export | PascalCase | `export function RoomCard()` |
| Page file | always `page.tsx` | `app/[locale]/search/page.tsx` |
| Hook | camelCase + `use` prefix | `useBooking`, `useTranslation` |
| Type/Interface | PascalCase | `Room`, `BookingState` |
| Constant | UPPER_SNAKE_CASE | `PLATFORM_FEE_RATE` |
| CSS variable | kebab-case | `--primary-foreground` |

---

## What Already Exists — Don't Recreate

Before building anything, check if it already exists:

- **Toast notifications** → `import { toast } from "sonner"` — already wired up
- **Loading spinner** → `components/ui/spinner.tsx`
- **Skeleton** → `components/ui/skeleton.tsx`
- **Price formatter** → `import { formatVND } from "@/lib/format"`
- **Date formatter** → `import { formatDate } from "@/lib/format"`
- **Booking ID generator** → `import { generateBookingId } from "@/lib/format"`
- **Modal/Dialog** → `components/ui/dialog.tsx`
- **Drawer (mobile)** → `components/ui/drawer.tsx`
- **Verified badge** → `components/verified-badge.tsx`
- **Amenity icon** → `components/amenity-icon.tsx`

---

## Do Not Touch

```
components/ui/         ← auto-generated shadcn/ui components
.next/                 ← build output
node_modules/
next.config.mjs        ← only touch if explicitly asked
tailwind.config.ts     ← only touch if adding new tokens
```

---

## Checkout Timer

The soft-lock countdown timer is **5 minutes** (300 seconds), not 10.

```tsx
// ✅ Correct
<CountdownTimer durationSeconds={5 * 60} />

// ❌ Wrong (old value)
<CountdownTimer durationSeconds={10 * 60} />
```

---

## Git Commit Convention

```
feat:     new feature
fix:      bug fix
ui:       visual/styling changes
refactor: code restructure, no behavior change
chore:    config, deps, tooling
docs:     documentation only

Examples:
feat: add continuous range selection to time slot picker
fix: correct platform fee calculation on checkout
ui: update room card to show access code on confirmation
```

---

## Spec-Driven Development — Auto-Implementation Rules

All features in this repo follow spec-driven development. Specs live in `docs/specs/`.

### When the user asks you to build a feature

1. **Always write the spec first** — copy `docs/specs/TEMPLATE.md`, fill every section, save as `docs/specs/feat-{scope}-{feature}.md` with `**Status:** \`approved\``
2. **Immediately implement after writing** — do not wait for a follow-up prompt. As soon as the spec file is saved with status `approved`, begin implementation automatically.
3. **Follow the spec exactly** — implement endpoints, DTOs, file paths, and state shapes as written. If reality forces a deviation, update the spec file first, then continue.
4. **Tick off ACs as you go** — update the `- [ ]` checkboxes to `- [x]` in the spec file as each acceptance criterion is completed.
5. **Set status to `done`** when all ACs are checked off.

### Order of implementation

Always implement in this order:
1. DB migration (if spec has DB changes)
2. Backend — DTOs → Service → Controller → Module registration
3. Frontend — API client functions → Page/components
4. Tick all ACs, set spec status to `done`

### When the user says "write a spec for X" or "build X"

- Treat both as the same instruction: write the spec AND implement it in one turn.
- Do not stop after writing the spec and ask "shall I implement now?" — just implement.

---

*Keep this file updated when new patterns are established.*
