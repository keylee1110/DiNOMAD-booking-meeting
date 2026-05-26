# Dinomad Codebase Context & Architecture Map

Welcome to **Dinomad**, a premium Booking Meeting Room & Workspace Platform. This document serves as the master context map for AI models and developers to understand the project structure, architectural decisions, and visual identity.

---

## 🚀 Technical Stack & Architecture

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) (using CSS-first configuration in `app/globals.css` with `@theme inline`)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/) (Radix primitives, Lucide icons, Sonner toast, Recharts)
- **Localization (i18n)**: Multi-language routing using `next-intl` mapped via `app/[locale]/` path parameters.
- **Package Manager**: `pnpm`

---

## 📁 Directory Structure & Route Maps

The codebase is organized logically into three primary user-facing modules and reusable shared components:

```
Dinomad/
├── app/
│   ├── [locale]/
│   │   ├── (main)/          # 1. CUSTOMER PORTAL
│   │   │   ├── checkout/     # Room booking checkout flow
│   │   │   ├── my-bookings/  # Customer's active/past booking history
│   │   │   ├── rooms/        # Room detail page ([id]/page.tsx) and selection
│   │   │   ├── search/       # Workspace filter, map search, & discovery
│   │   │   └── page.tsx      # Main landing & hero search page
│   │   ├── admin/           # 2. PLATFORM OPERATOR PORTAL
│   │   │   ├── analytics/    # Platform-wide revenue & usage charts
│   │   │   ├── bookings/     # All platform bookings management
│   │   │   ├── rooms/        # Platform room listings inventory
│   │   │   ├── settings/     # Admin configurations
│   │   │   ├── suppliers/    # Venue partner managers
│   │   │   └── users/        # Registered user records
│   │   ├── partner/         # 3. VENUE OWNER PORTAL
│   │   │   ├── inventory/    # Venue rooms & workspaces management
│   │   │   ├── scanner/      # QR Booking Check-in Camera
│   │   │   ├── schedule/     # Daily calendar bookings schedule
│   │   │   └── page.tsx      # Partner analytics & action items dashboard
│   │   └── login/           # Shared secure login flow
│   ├── globals.css          # Master stylesheet (Tailwind v4 tokens & standard layers)
│   └── layout.tsx           # Main root HTML wrapper
├── components/              # Shared presentation & logic components
│   ├── ui/                  # RADIX / shadcn components (Buttons, Cards, Inputs, Tables)
│   ├── room-card.tsx        # Card display for featured rooms
│   ├── countdown-timer.tsx  # Countdown timer for active study sessions
│   ├── time-slot-picker.tsx # Calendar slot booking grid
│   └── qr-code.tsx          # Ticket & QR scanner helper
├── hooks/                   # Custom React state & utility hooks
└── lib/                     # Data stores, internationalization & shared mock datasets
```

---

## 🎨 Visual Identity & Theme Strategy

The project is undergoing a refactor from its original raw, blocky Neo-brutalist theme to a **Calm, Premium, and Modern Workspace theme** while retaining its core brand identity.

### Brand Palette (Tailwind CSS v4 variables in `app/globals.css`)
- **Primary Color**: `#64B5F6` (Ocean Blue) — represents trust, clarity, and digital productivity.
- **Surfaces**: Warm cool-off-white background (`#F8F9FA` or `oklch(0.98 0.005 240)`) and clean white cards (`#FFFFFF`).
- **Typography**: Confident, readable typeface hierarchies (Outfit/Inter) replacing heavy uppercase fonts.
- **Containers**: Refined `1rem` (16px) or `1.5rem` (24px) rounded corners.
- **Borders & Shadows**: Ultra-thin borders (`border border-border/80`) with soft, ambient ambient shadows instead of harsh black borders and flat shadows.

---

## 🔒 Coding Rules & Principles

1. **Keep Documentation Safe**: Never remove or alter unrelated comments, JSDoc definitions, or custom i18n configurations unless explicitly instructed.
2. **i18n First**: All user-facing strings must use internationalization hooks (`useTranslation()` or `next-intl` equivalents). Never hardcode plain text labels on key screens.
3. **Clean Code (P0)**: Maintain focused, reusable, and small components. AAA patterns in tests.
4. **Tailwind v4 Standards**: Customize styling via `app/globals.css` in `--color-*` variables rather than injecting arbitrary custom styles in Tailwind utility lines.

---

## 📝 Major Edits & Project Updates Log

This table lists the history of significant architectural changes, new feature additions, or UI refactoring tasks done on this project:

| Date & Time | Commits/Task Branch | Major Changes Done | Target Files |
| :--- | :--- | :--- | :--- |
| **2026-05-26** | `feat/ui-refactor` | Created `ui-refactor-prompt.md` and created master `CODEBASE.md` blueprint to establish context for the UI/UX visual transition. | `/ui-refactor-prompt.md`, `/CODEBASE.md` |
| **2026-05-26** | `feat/ui-refactor` | Resolved `pnpm run lint` circular structure and React 19/Compiler errors, bringing errors down to 0. | `/eslint.config.mjs`, `/app/[locale]/(main)/search/page.tsx`, `/app/[locale]/(main)/checkout/page.tsx`, `/app/[locale]/partner/page.tsx`, `/components/partner/inventory-toggle.tsx`, `/components/ui/sidebar.tsx`, `/lib/store/booking-store.tsx` |
| | | | |
