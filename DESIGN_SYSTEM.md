# DiNOMAD Design System

This document outlines the standard UI/UX conventions, styling guidelines, and logic implemented in the DiNOMAD Platform. It serves as a unified reference for the "Modern Premium" aesthetic across the application.

---

## 1. Core Philosophy: "Modern Premium"

The DiNOMAD platform utilizes a **Modern Premium** design system. This philosophy departs from "neo-brutalism" and hard edges, favoring:
- **Softness & Depth**: Achieved via advanced glassmorphism (layered blurs) and subtle drop shadows.
- **Organic Geometry**: Using pronounced rounded corners (e.g., `rounded-2xl`, `rounded-3xl`) everywhere to make the interface feel approachable.
- **Fluid & Dynamic Interactivity**: Utilizing micro-animations (scale, translate) and polished hover/active states.

## 2. Color Palette & Theming

### 2.1 The Global Gradient (Dreamy Sky Pink)
To establish depth and brand identity, the root background of the entire app uses a radial gradient structure. This is implemented in `globals.css` on the `html` element:

```css
html {
  /* Soft Luxury Neutral Base */
  background-color: #fefcff;
  
  /* Dreamy Sky Pink Glow */
  background-image: 
    radial-gradient(circle at 30% 70%, rgba(173, 216, 230, 0.35), transparent 60%),
    radial-gradient(circle at 70% 30%, rgba(255, 182, 193, 0.4), transparent 60%);
  
  background-attachment: fixed;
}
```

### 2.2 Core Tokens (Tailwind)
- **Primary Brand**: Sky Blue (`primary`) -> `#6BBCFE`. Used for primary actions, active indicators, and branding elements.
- **Background**: `bg-background` -> Inherits `transparent` over the global HTML gradient when applicable layered structures are used.
- **Foreground**: `text-foreground` -> `hsl(0 0% 10%)` for strong contrast readability.
- **Muted Elements**: `bg-muted` (`hsl(210 40% 96%)`) and `text-muted-foreground` (`hsl(215 16% 47%)`) for secondary text and disabled/inactive states.

## 3. Glassmorphism & Depth (The DiNOMAD Recipe)

Almost all root structural containers (Dashboards, Booking Widgets, Page Cards, Sidebars, Headers) utilize a standardized glassmorphism formula.

**The Golden Recipe (Tailwind Classes):**
```html
<div className="bg-white/60 dark:bg-card/60 backdrop-blur-xl border border-white/50 shadow-xl rounded-3xl">
  <!-- Content -->
</div>
```

**Key Components of the Recipe:**
1. **Background Opacity**: `bg-white/60` (or `bg-white/40`) allows the global Dreamy Sky gradient to peek through softly.
2. **Backdrop Blur**: `backdrop-blur-xl` or `backdrop-blur-2xl` diffuses what happens behind the container, establishing physical depth.
3. **Inner Borders**: `border border-white/50` gives the container a "frosted edge" light reflection (the specular highlight).
4. **Soft Shadows**: `shadow-xl shadow-black/5` or custom shadows (`shadow-[0_8px_30px_rgb(0,0,0,0.04)]`) pull the element forward.

## 4. Geometry and Layout Standardization

Say goodbye to sharp 90-degree corners.

- **Main Wrappers/Modals/Widget Cards**: Use `rounded-3xl` or `rounded-2xl`.
- **Buttons, Inputs, Small Cards**: Use `rounded-xl` or `rounded-full` (pills).
- **Inner elements (Badges, Avatar bases)**: Use `rounded-lg` or `rounded-md` only when bounded rigidly by a smaller parent container.

## 5. UI Elements

### 5.1 Inputs & Search Bars
Inputs should be clean, taller, and clearly outlined without excessive visual weight.
- **Default State**: `border-border/50 bg-white/60`
- **Focus State**: `focus-visible:ring-primary/20 focus-visible:border-primary`

### 5.2 Interactive Buttons & Cards
Buttons and interactive cards must feel alive.
- Add `transition-all duration-300` standard.
- Use `hover:shadow-md hover:-translate-y-0.5` to create an uplifting effect when a user hovers.
- Use `active:scale-95` to provide tactical feedback upon clicking.

### 5.3 Badges and Pills
Used heavily for Statuses (Confirmed, Pending) or Amenities (WiFi, Projector).
Use contextual low-opacity backgrounds with high saturation text to stand out without competing with Primary actions:
- **Success/Verified**: `bg-emerald-100 text-emerald-700`
- **Warning/Pending**: `bg-amber-100 text-amber-700`

## 6. Functional Notes
- **Avatars**: The application uses `api.dicebear.com/9.x` with seeds mapped to user email for visually engaging, consistent, and dependency-free generic avatars.
- **Icons**: Relies on `lucide-react` for consistent 24x24 scalable vector icons.

---
*Created by: Antigravity AI - Team DiNOMAD. Last Updated: April 2026.*
