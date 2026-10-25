---
name: ElarioLabs
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#45464d'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#4b41e1'
  on-secondary: '#ffffff'
  secondary-container: '#645efb'
  on-secondary-container: '#fffbff'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#00201d'
  on-tertiary-container: '#0c9488'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#e2dfff'
  secondary-fixed-dim: '#c3c0ff'
  on-secondary-fixed: '#0f0069'
  on-secondary-fixed-variant: '#3323cc'
  tertiary-fixed: '#89f5e7'
  tertiary-fixed-dim: '#6bd8cb'
  on-tertiary-fixed: '#00201d'
  on-tertiary-fixed-variant: '#005049'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display:
    fontFamily: Plus Jakarta Sans
    fontSize: 3.75rem
    fontWeight: '700'
    lineHeight: 4.25rem
    letterSpacing: -0.03em
  display-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 2.25rem
    fontWeight: '700'
    lineHeight: 2.75rem
    letterSpacing: -0.025em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 2.5rem
    fontWeight: '600'
    lineHeight: 3rem
    letterSpacing: -0.025em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.75rem
    fontWeight: '600'
    lineHeight: 2.25rem
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.75rem
    fontWeight: '600'
    lineHeight: 2.25rem
    letterSpacing: -0.02em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.25rem
    fontWeight: '600'
    lineHeight: 1.75rem
    letterSpacing: -0.015em
  body-lg:
    fontFamily: Inter
    fontSize: 1.125rem
    fontWeight: '400'
    lineHeight: 1.75rem
    letterSpacing: -0.01em
  body-md:
    fontFamily: Inter
    fontSize: 0.9375rem
    fontWeight: '400'
    lineHeight: 1.5rem
    letterSpacing: -0.005em
  body-sm:
    fontFamily: Inter
    fontSize: 0.8125rem
    fontWeight: '400'
    lineHeight: 1.25rem
    letterSpacing: '0'
  label-md:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: '500'
    lineHeight: 1.25rem
    letterSpacing: -0.005em
  label-sm:
    fontFamily: Inter
    fontSize: 0.75rem
    fontWeight: '500'
    lineHeight: 1rem
    letterSpacing: 0.01em
  code-inline:
    fontFamily: JetBrains Mono
    fontSize: 0.8125rem
    fontWeight: '500'
    lineHeight: 1.125rem
    letterSpacing: -0.01em
  code-sm:
    fontFamily: JetBrains Mono
    fontSize: 0.6875rem
    fontWeight: '400'
    lineHeight: 0.875rem
    letterSpacing: 0.02em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  gutter-dense: 0.75rem
  margin: 3rem
  margin-mobile: 1.25rem
  margin-dense: 1.5rem
  space-xxs: 0.125rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
  space-2xl: 4rem
  space-3xl: 6rem
---

## Brand & Style

This design system embodies the ethos of a high-end independent engineering and design studio. It bridges two distinct operational modes: an editorial, expansive public showcase and a precise, information-dense workspace for internal administration.

The brand persona is quiet, precise, architectural, and confident. Rather than relying on overt decorative flourishes, authority is established through rigorous structural alignment, immaculate typographic hierarchy, and intentional whitespace. The interface feels lightweight yet tactile, evoking the physical sensation of precision-milled aluminum, architectural vellum, and micro-etched glass.

The aesthetic philosophy centers on **Refined Studio Minimalism**:
- **Public Surface:** Dramatic structural scale, generous breathing room, intentional negative space, and quiet typography that allows showcased work to dominate.
- **Admin Surface:** High-density spatial discipline, subdued low-contrast division, immediate feedback loops, and purposeful contrast ratios built for sustained operational focus.

## Colors

The palette is anchored in an authoritative deep slate charcoal (`#0F172A`), balanced against an electrifying indigo accent (`#4F46E5`) reserved strictly for points of focus, interactive states, and primary calls to action. A muted deep teal (`#0D9488`) provides tertiary balance for success metrics, deployed builds, and stable system health signals.

### Color Roles & Surface Strategy
- **Base Canvas:** Pure crystalline white (`#FFFFFF`) on default consumer-facing pages, shifting to an ultra-faint cool zinc (`#F8FAFC`) on data-dense management views to prevent eye strain.
- **Surface Elevation:** Layered tones (`#FFFFFF`, `#F1F5F9`, `#E2E8F0`) provide spatial separation without reliance on heavy shadows.
- **Borders & Dividers:** Crisp hairline dividers in low-contrast slate tints (`#E2E8F0` at 100% or `#0F172A` at 8% opacity) establish order while remaining structurally invisible until inspected.
- **Text & Foreground:** Deep Slate (`#0F172A`) for dominant headlines and interactive triggers; Muted Slate (`#475569` and `#64748B`) for body copy, auxiliary context, and secondary metadata.
- **State Anchors:** The vivid indigo `#4F46E5` is never applied decoratively over large fills; it is strictly an interactive catalyst used for active states, keypress selections, focus rings, and forward motion.

## Typography

Typographic structure relies on a deliberate tripartite hierarchy:
1. **Plus Jakarta Sans (Headlines & Display):** Selected for its crisp geometry, balanced proportions, and modern architectural finish. Tight letter-spacing ensures headers feel carved, unified, and contemporary.
2. **Inter (Body & Controls):** Provides neutral, highly legible rhythm across sustained long-form case studies and complex configuration forms alike.
3. **JetBrains Mono (Technical Details & Metadata):** Introduces engineering precision for timestamps, Git commits, release tags, API endpoints, and raw tabular counters.

### Hierarchy & Responsive Behavior
- Large headlines downscale decisively on viewports under 768px via dedicated mobile tokens to prevent unintended line wrapping.
- In dense administrative tables, use `body-sm` paired with `code-sm` to maintain vertical compactness without degrading readability.
- All numbers indicating metrics, currencies, or tabular data must render using tabular figures (`font-variant-numeric: tabular-nums`).

## Layout & Spacing

The layout operates across two modular execution modes: **Editorial Fluid** for portfolio and showcase views, and **Compact Grid** for application tools.

### Grid Models
- **Public & Showcase Views:** 12-column fluid grid, locked to a `max-width` of 1440px with `margin` (3rem) side padding. Gutters scale from `1rem` on mobile to `1.5rem` on desktop. Vertical cadences leverage `space-2xl` and `space-3xl` between thematic segments to celebrate negative space.
- **Admin Workspace:** Full-bleed layout with a fixed 240px collateral navigation sidebar and a fluid multi-panel data zone. Uses `gutter-dense` (0.75rem) and `margin-dense` (1.5rem) to surface dense metrics within the initial viewport.

### Breakpoints & Responsive Adaptation
- **Desktop (1024px+):** Full multi-column views, master-detail side-by-side panes, expanded table columns.
- **Tablet (768px - 1023px):** 8-column layout. Administrative panels fold into layered drawers; sidebar collapses to an icon rail (64px width).
- **Mobile (320px - 767px):** 4-column layout. All horizontally aligned control groups stack vertically. Showcase margins compress to `margin-mobile` (1.25rem).

## Elevation & Depth

This design system rejects heavy drop shadows and faux skeuomorphic extrusions. Depth is established through **architectural layering**, **subtle surface value differentiation**, and **micro-hairline containment**.

### Depth Layers
1. **Level 0 (Base Canvas):** Background canvas (`#FFFFFF` in showcase; `#F8FAFC` in workspace). Completely flat.
2. **Level 1 (Card & Section Surfaces):** Clean `#FFFFFF` elevated off canvas via a continuous 1px border (`#E2E8F0`). Where floating separation is strictly required, apply a gossamer ambient shadow: `0 1px 3px 0 rgba(15, 23, 42, 0.04), 0 1px 2px -1px rgba(15, 23, 42, 0.04)`.
3. **Level 2 (Popovers, Dropdowns & Menus):** Pure white surface framed with a 1px border (`#CBD5E1`) and a soft, low-contrast floor shadow: `0 10px 15px -3px rgba(15, 23, 42, 0.05), 0 4px 6px -4px rgba(15, 23, 42, 0.03)`.
4. **Level 3 (Modals & Command Palettes):** Suspended prominently over an ambient backdrop dim (`rgba(15, 23, 42, 0.35)` with an 8px backdrop blur). Elevated using `0 20px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04)`.

## Shapes

The design uses a **Soft** shape geometry (`roundedness: 1`). Elements favor disciplined structural corners over exaggerated organic curves, signaling precision toolmanship:
- **Base Components (Inputs, Buttons, Badges, Tabs):** 0.25rem (4px) corner radius.
- **Mid-Tier Elements (Cards, Dropdown Menus, Panels):** `rounded-lg` at 0.5rem (8px).
- **Major Structural Contexts (Dialogs, Canvas Enclosures):** `rounded-xl` at 0.75rem (12px).
- **Pills & Status Indicators:** Strict `9999px` full radius is reserved exclusively for numerical counts, live build chips, and technical tags to visually distinguish them from actionable square controls.

## Components

### Buttons
- **Primary:** Background `#0F172A`, text `#FFFFFF`, 4px radius, font `label-md`. In hover state: `#1E293B`. Active: `#334155`. Focus ring: 2px offset with `#4F46E5`.
- **Secondary / Action Accent:** Background `#4F46E5`, text `#FFFFFF`. Hover: `#4338CA`. Reserved for critical progression steps.
- **Outline / Ghost:** Transparent background with 1px border `#E2E8F0`, text `#0F172A`. Hover: background `#F8FAFC`, border `#CBD5E1`.
- **Admin Dense:** Height compressed to 32px, text `label-sm`, padding 0 12px.

### Form Inputs & Selectors
- **Text Inputs:** Height 38px (32px in dense admin), background `#FFFFFF`, border 1px solid `#CBD5E1`, text `body-md` in `#0F172A`. Placeholder text `#94A3B8`.
- **Focus State:** Border shifts cleanly to `#4F46E5` with a subtle outer ring (`box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.12)`). No transition delays.
- **Checkboxes & Radios:** 16x16px footprint. Checked state fills `#0F172A` with a crisp white tick. Focused state projects the 3px indigo glow ring.

### Chips & Badges
- **Status Badges:** Height 22px, padding `0 8px`, border-radius 9999px, font `code-sm`.
  - *Active/Production:* Background `#F0FDFA`, text `#0D9488`, border 1px solid `#CCFBF1`.
  - *Draft/Staging:* Background `#F1F5F9`, text `#475569`, border 1px solid `#E2E8F0`.
  - *Accent/Focus:* Background `#EEF2FF`, text `#4F46E5`, border 1px solid `#E0E7FF`.

### Lists & Data Grids
- **Tables:** Row height 44px in dense mode. Header styled with `label-sm` in `#64748B`, uppercase tracking at `0.05em`, border-bottom 1px solid `#E2E8F0`.
- **Row States:** Hover triggers instantaneous background shift to `#F8FAFC`. Selected rows render with background `#F1F5F9` and an absolute 2px primary `#4F46E5` left-edge indicator.

### Cards & Showcase Modules
- **Project Showcase Card:** Pure white backdrop, 1px perimeter border `#E2E8F0`, 8px corner radius. Image preview ratio pinned to 16:10. Subtle image zoom (1.02x scale, cubic-bezier(0.16, 1, 0.3, 1)) on card hover while the parent container remains structurally static.
- **Admin Metric Card:** Padding `space-lg`, border 1px solid `#E2E8F0`, displaying a micro `label-sm` category at the top, a bold tabular metric value (`headline-md`) in `#0F172A`, and an inline delta badge at the base.

### Command Palette (Specialty Component)
- Centered overlay modal (`max-width: 640px`), background `#FFFFFF`, border 1px solid `#CBD5E1`, elevated via Level 3 shadows. Contains a zero-border search input with `headline-sm` font, followed by categorized lists using `JetBrains Mono` shortcut tags aligned to the right edge.
