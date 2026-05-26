# Prompt: Refactor UI Dinomad to Look Clean, Premium, and Professional (Keeping Original Ocean Blue)

You are a senior product designer and lead frontend engineer.

I have a web application named **Dinomad** (a Booking Meeting Room & Workspace Platform) built using **Next.js 16 (App Router), Tailwind CSS v4, next-intl (i18n), and shadcn/ui**. 

Currently, the UI is styled in a **Neo-brutalist** design: it has sharp corners (`rounded-none`, `--radius: 0rem`), thick solid borders (`border-4 border-foreground`), flat harsh shadows (`shadow-[8px_8px_0px_0px_#64B5F6]`), and loud primary blue/yellow/foreground colors. It looks too raw, heavy, and generated.

Please refactor the UI/UX of this project to transition it into a **calm, clean, premium, and professional workspace portal** while **keeping our original brand colors: Ocean Blue (`#64B5F6`)**. It should feel like a highly polished, modern production-grade operations and booking tool used daily by partners and customers.

---

## 🎨 Restrained Color System & Theme (Tailwind CSS v4)

Please update the CSS variables in `app/globals.css`. Ensure we keep our core brand color `#64B5F6` as primary, but polish the surrounding surfaces, borders, and shadows to look highly premium and clean:

```css
:root {
  /* Premium Slate & Ocean Blue Theme Colors */
  --background: oklch(0.98 0.005 240);       /* Soft cool-off-white background */
  --foreground: oklch(0.20 0.02 240);       /* Dark slate/navy text primary */
  --card: oklch(1 0 0);                     /* Clean white cards surface */
  --card-foreground: oklch(0.20 0.02 240);
  
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.20 0.02 240);
  
  --primary: #64B5F6;                        /* KEPT: Original Ocean Blue as primary */
  --primary-foreground: oklch(0.98 0.005 240);/* Soft off-white text for primary buttons */
  
  --secondary: oklch(0.95 0.01 240);         /* Elegant light blue-gray for muted backgrounds */
  --secondary-foreground: oklch(0.40 0.02 240);/* Muted slate text secondary */
  
  --muted: oklch(0.96 0.008 240);
  --muted-foreground: oklch(0.45 0.02 240);
  
  --accent: oklch(0.50 0.15 260);            /* Calm royal blue/indigo accent */
  --accent-foreground: oklch(0.98 0.005 240);
  
  --border: oklch(0.92 0.01 240);            /* Soft, modern slate border */
  --input: oklch(0.92 0.01 240);
  --ring: #64B5F6;
  
  --radius: 1rem;                            /* Refined rounded corners (16px) */

  /* Status Colors */
  --success: oklch(0.60 0.15 145);           /* Modern emerald green */
  --success-foreground: oklch(0.99 0 0);
  --warning: oklch(0.80 0.12 75);            /* Modern warm amber */
  --warning-foreground: oklch(0.25 0.04 60);
  --destructive: oklch(0.55 0.20 27);        /* Soft brick red danger */
  --destructive-foreground: oklch(0.99 0 0);
}
```

---

## 🛠️ Global Class Replacement Guidelines

Completely refactor all CSS/Tailwind utility classes across all components using this mapping:

1. **Borders & Corners**:
   - Replace `rounded-none` or `radius-0` with **`rounded-2xl`** (for main cards/containers) and **`rounded-xl` / `rounded-lg`** (for buttons, input fields, badges).
   - Replace thick border classes (`border-4`, `border-2 border-foreground`, `border-primary`) with **`border border-border/80`** or **`border border-border/50`** for a soft, precise boundary.
2. **Shadows**:
   - **REMOVE all brutalist flat shadows** (e.g. `shadow-[8px_8px_0px_0px_#64B5F6]`, `shadow-[5px_5px_...]`).
   - Replace with either no shadow, or a **highly subtle, diffused shadow** (e.g. `shadow-[0_4px_20px_-4px_rgba(41,35,30,0.06)]` or Tailwind's standard `shadow-sm`).
3. **Typography**:
   - Restrain massive black uppercase headings: replace `font-black uppercase tracking-tighter` with elegant, readable typography: **`font-semibold tracking-tight`** or **`font-bold`** using Outfit or Inter.
   - Use proper size hierarchies (`text-base` for body, `text-sm` for secondary metadata). Ensure good line heights.
4. **Interaction States & Motion**:
   - Replace harsh hover transformations (`hover:-translate-y-1 hover:shadow-...`) with soft, smooth transitions: **`transition-all duration-300 hover:border-primary/50 hover:bg-card/80`**.

---

## 📱 Detailed Refactoring Instructions per Core Screen

### 1. Landing Page (`app/[locale]/(main)/page.tsx`)
- **Hero Section**:
  - Remove the background block `bg-primary/10` and skew effect. Replace it with a clean, centered or elegant two-column layout with calm whitespace.
  - Heading: Tame the header text size and case, changing from a massive flat block to an elegant headline.
- **Search Box Widget**:
  - Soften the search box wrapper. Replace the hard blue shadow with a soft warm border.
  - Inputs & Dropdowns (`SelectTrigger`): Apply `rounded-xl`, soft warm borders, and clear micro-interactions.
- **Featured Rooms Grid & How It Works**:
  - Refactor category buttons (Team Hubs vs Solo Nooks) to feel integrated with our premium ocean blue theme.
  - How It Works cards: Remove the `-top-5 -right-5` brutalist numbers. Make them modern step-by-step indicator cards with subtle icons and refined text hierarchy.

### 2. Room Details & Calendar Booking (`app/[locale]/(main)/rooms/[id]/page.tsx`)
- **Booking Widget & Time Slot Picker**:
  - Ensure the calendar dates and time slots picker (`time-slot-picker.tsx`) use soft slate borders and active ocean blue selections, rather than solid flat boxes.
  - Improve readability of room pricing and amenities.

### 3. Partner Dashboard (`app/[locale]/partner/page.tsx`)
- **Metrics Grid**:
  - Replace the thick, solid black borders and harsh colored shadows on metrics cards.
  - Use off-white background cards (`bg-card`), rounded corners (`rounded-2xl`), precise borders, and elegant small metadata headers.
- **Urgent Action / Requires Action Cards**:
  - Tame the high-urgency blinking/solid red alerts. Refactor the action buttons to have ocean blue or soft slate colors with soft borders, rather than thick brutalist black frames.
- **Revenue Bar Chart**:
  - Replace the flat-topped solid brutalist CSS bar chart. Use smooth, rounded bars with precise heights and soft transition overlays. Ensure the grid lines and hover states feel professional.
- **Live Feed / Logs**:
  - Design the activity stream like a clean timeline with thin vertical connectors and clear typography.

### 4. Admin Dashboard (`app/[locale]/admin/...`)
- **Data Tables & Lists**:
  - Refactor all table lists (`table.tsx`), dialog panels, and user filters to look exceptionally clean, utilizing thin warm borders and generous breathing space.

---

## 🎯 Final Aesthetics Goal
The final user interface must not look like a generic Neo-brutalist framework or a loud SaaS dashboard template. It must feel like **a calm, premium, modern operations dashboard for a boutique study cafe and meeting space**, emphasizing **confident typography, soft borders, clean cool-gray surfaces, our signature Ocean Blue (`#64B5F6`) accent, and beautiful breathing whitespace**.
