# Design System Strategy: The Cinematic Interface

## 1. Overview & Creative North Star
**Creative North Star: The Midnight Gallery**

This design system is built to transform a SaaS tool into a cinematic experience. It rejects the "utility-first" aesthetic of cluttered dashboards in favor of a high-end, editorial feel where content is treated like art. We achieve this through **Atmospheric Depth**—using layered near-blacks and subtle tonal shifts to guide the eye, rather than rigid lines or heavy shadows.

To break the "template" look, we leverage intentional asymmetry and generous negative space. Information density is managed through progressive disclosure, ensuring that every frame feels intentional, high-speed, and premium.

---

## 2. Colors
Our palette is rooted in the absence of light, using a spectrum of sophisticated grays to build form.

### Core Tones
- **Background (`#131313`):** The absolute foundation. A deep, ink-black that provides the canvas for cinematic focus.
- **Primary (`#C3C0FF`):** A desaturated, premium indigo used for high-visibility accents and interactive states.
- **Primary Container (`#4F46E5`):** The heavy-hitting "Vibrant Indigo" for primary CTAs and critical focus points.

### The "No-Line" Rule
**Explicit Instruction:** Prohibit 1px solid borders for sectioning.
Structural boundaries must be defined solely through background color shifts. For example, a card (`surface-container-highest`) sits on a section (`surface-container-low`) which sits on the global background (`surface`). This creates a "molded" look rather than a "sketched" one.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers.
- **Surface (Lowest):** Main background.
- **Surface Container Low:** Broad section grouping.
- **Surface Container Highest:** Interactive cards and floating menus.
*Design Note: Use these tiers to create "nested" depth. An inner container should always be a slightly higher or lower tier than its parent to define importance without visual noise.*

### The "Glass & Gradient" Rule
To achieve the premium Vercel/Linear feel, floating elements (like modals or dropdowns) should use **Glassmorphism**. Combine `surface-variant` with a `20px` backdrop-blur.
**Signature Texture:** Primary CTAs should not be flat. Apply a subtle linear gradient from `primary-container` to `primary` (top-to-bottom) to give buttons a "lit from within" quality.

---

## 3. Typography
We use **Inter** as our typographic workhorse, relying on a drastic scale and varying weights to establish authority.

| Level | Size | Token | Usage |
| :--- | :--- | :--- | :--- |
| **Display LG** | 3.5rem | `display-lg` | Hero moments and cinematic titles. |
| **Headline MD**| 1.75rem| `headline-md`| Section headers. |
| **Title SM** | 1rem | `title-sm` | Content grouping labels. |
| **Body MD** | 0.875rem| `body-md` | General UI text and descriptions. |
| **Label SM** | 0.6875rem| `label-sm` | Metadata, micro-copy, and tags. |

**Editorial Contrast:** Pair high-weight `headline-lg` (Bold) with `body-md` (Regular) at lower opacity (`on-surface-variant`) to create a clear hierarchy that feels like a professional magazine.

---

## 4. Elevation & Depth
Depth in this system is a result of light and layering, not structural decoration.

- **The Layering Principle:** Stack `surface-container` tiers. A `surface-container-lowest` card placed on a `surface-container-low` background creates a natural "sunken" or "lifted" feel without a single shadow.
- **Ambient Shadows:** For floating elements, use a shadow with a 40px–60px blur at 6% opacity. The shadow color must be a tinted version of the surface color—never pure black—to mimic natural light.
- **The "Ghost Border" Fallback:** If a border is required for accessibility, use the `outline-variant` token at **15% opacity**. High-contrast, 100% opaque borders are strictly forbidden.
- **Interactive Glass:** Use semi-transparent `surface-bright` with `backdrop-filter: blur(12px)` for navigation bars to let background content bleed through, creating a sense of continuity.

---

## 5. Components

### Buttons
- **Primary:** `primary-container` background, `on-primary` text. Slight gradient (as mentioned in Colors). Corner radius: `md` (0.375rem).
- **Secondary:** Ghost style. Transparent background with a `Ghost Border` (15% opacity `outline-variant`).
- **States:** On hover, increase brightness by 10%. On active, scale down to 0.98 for tactile feedback.

### Cards & Lists
- **Rule:** Forbid divider lines.
- **Implementation:** Separate list items using `spacing-4` (1rem) of vertical white space. For tabular data, use alternating `surface-container-low` and `surface-container-lowest` backgrounds for rows.

### Input Fields
- **Styling:** Use `surface-container-highest` for the field background. No border.
- **Focus:** When active, the field should receive a 1px "Ghost Border" using the `primary` token at 40% opacity.

### Chips
- **Status Chips:** Use `on-surface-variant` for the background with `body-sm` text. Use the `secondary-fixed-dim` indigo exclusively for active selection states.

---

## 6. Do's and Don'ts

### Do
- **DO** use the Spacing Scale religiously. Consistent gaps of `spacing-8` or `spacing-12` between sections are what create the "premium" feel.
- **DO** use "tonal transitions" (background shifts) to separate the sidebar from the main content.
- **DO** use indigo accents sparingly. It is a "laser pointer," not a "paint bucket."

### Don't
- **DON'T** use 1px solid white or light-gray borders. It breaks the cinematic immersion.
- **DON'T** use standard drop shadows. If it looks like a "box shadow," it's too heavy.
- **DON'T** crowd the screen. If a view feels busy, increase the spacing tokens (e.g., move from `spacing-4` to `spacing-8`).
- **DON'T** use pure `#000000` for the background; use the `surface` token (`#131313`) to allow for "lower" layers (e.g., `surface-container-lowest`) to exist beneath it.