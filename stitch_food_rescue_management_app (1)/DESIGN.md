---
name: Food Rescue RTL
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#3d4a42'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#6d7a72'
  outline-variant: '#bccac0'
  surface-tint: '#006c4a'
  primary: '#006948'
  on-primary: '#ffffff'
  primary-container: '#00855d'
  on-primary-container: '#f5fff7'
  inverse-primary: '#68dba9'
  secondary: '#855300'
  on-secondary: '#ffffff'
  secondary-container: '#fea619'
  on-secondary-container: '#684000'
  tertiary: '#006947'
  on-tertiary: '#ffffff'
  tertiary-container: '#00855b'
  on-tertiary-container: '#f5fff6'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#85f8c4'
  primary-fixed-dim: '#68dba9'
  on-primary-fixed: '#002114'
  on-primary-fixed-variant: '#005137'
  secondary-fixed: '#ffddb8'
  secondary-fixed-dim: '#ffb95f'
  on-secondary-fixed: '#2a1700'
  on-secondary-fixed-variant: '#653e00'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  display-lg:
    fontFamily: IBM Plex Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 44px
  display-lg-mobile:
    fontFamily: IBM Plex Sans
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 36px
  headline-lg:
    fontFamily: IBM Plex Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 34px
  headline-md:
    fontFamily: IBM Plex Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 30px
  headline-sm:
    fontFamily: IBM Plex Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
  body-lg:
    fontFamily: IBM Plex Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
  body-md:
    fontFamily: IBM Plex Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
  body-sm:
    fontFamily: IBM Plex Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  label-lg:
    fontFamily: IBM Plex Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  label-md:
    fontFamily: IBM Plex Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  label-sm:
    fontFamily: IBM Plex Sans
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-mobile: 0.75rem
  margin: 1.25rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system serves a mission-driven, community-centered food and resource rescue ecosystem. It blends modern civic utility with environmental stewardship and social warmth. The visual language conveys immediate trustworthiness, organizational efficiency, and vibrant empathy for community welfare and sustainability.

The aesthetic philosophy centers on **Refined Civic Modernism**:
- Native Right-to-Left (RTL) ergonomics that celebrate natural Arabic script flow, visual balance, and intuitive bidirectional interaction.
- Generous breathing space, high legibility, and reduced cognitive friction for fast-moving field volunteers, donors, and dispatchers under time-sensitive rescue conditions.
- High-contrast visual cues for urgency without inducing panic, grounding all actions in calm, sustainable emerald tones.

## Colors

The color palette anchors the ecological mission while providing distinct operational signaling for urgent rescues:

- **Primary (`#059669` / Deep Emerald):** Represents freshness, growth, circular economy, and active relief. Used for key call-to-actions, navigation active states, primary brand anchors, and confirmed status fills.
- **Secondary (`#F59E0B` / Warm Amber):** The urgency trigger. Signifies expiring food batches, rapid-pickup requirements, warnings, and time-critical requests without visual hostility.
- **Tertiary (`#10B981` / Bright Emerald):** Vibrant accent used for progress indicators, secondary highlights, success confirmations, and active eco-milestone metrics.
- **Neutral Palette:**
  - Base Dark (`#0F172A` / Slate 900): Deep slate for primary body copy, titles, and high-emphasis icons. Avoids pure harsh black.
  - Medium Neutral (`#64748B` / Slate 500): Metadata, timestamps, inactive icons, and secondary labels.
  - Border & Dividers (`#E2E8F0` / Slate 200): Subtle separation layers maintaining crisp structure.
  - Surface Muted (`#F1F5F9` / Slate 100): Input background fields, inactive pill states, and card hover fills.
  - Background Canvas (`#F8FAFC` / Slate 50): Base app canvas delivering soft, glare-free optical comfort.

### Semantic Category Color Tokens
- Food Rescue: Emerald tint (`#ECFDF5` background, `#059669` foreground)
- Medical Supplies: Crimson tint (`#FEF2F2` background, `#DC2626` foreground)
- Equipment: Sky tint (`#F0F9FF` background, `#0284C7` foreground)
- Community Services: Violet tint (`#F5F3FF` background, `#7C3AED` foreground)

## Typography

Typography is set using IBM Plex Sans (leveraging its native IBM Plex Sans Arabic cuts). Arabic glyphs require generous line height (`1.45` to `1.65`) compared to Latin counterparts to accommodate diacritics, ascenders, and descenders gracefully without clipping.

### RTL Typesetting Rules
- Text alignment defaults strictly to `right` (`text-align: right`).
- Letter-spacing is explicitly kept at `0` or `normal` across all sizes, as tracking modifications break Arabic cursive connections (*kashida* harmony).
- Numerals default to Western Arabic (0, 1, 2, 3...) for unambiguous operational times, quantities, and map coordinate readings, with localized Eastern Arabic forms supported via user preference.

## Layout & Spacing

The layout is built on a 4-column mobile fluid grid expanding to 8 columns on tablets and 12 columns on desktop web dispatch interfaces.

### Bidirectional Layout Dynamics
- Every inline spacing token relies on logical CSS properties: `margin-inline-start`, `margin-inline-end`, `padding-inline-start`, and `padding-inline-end`.
- Interactive icon placements (back arrows, disclosure chevrons, trailing badges) invert naturally under RTL:
  - Navigation back button points towards the right edge (`rotate-180` in standard Latin asset kits, or native mirrored SVG).
  - Checkboxes and radio buttons occupy the rightmost position of list items, followed by primary descriptive text to the left.
- Mobile screen padding maintains a safe minimum margin of `1rem` (16px) horizontally to prevent accidental edge trigger touches during field operations.

## Elevation & Depth

Visual hierarchy combines clean surface-layer separation with tinted ambient shadows:

- **Level 0 (Flat):** Canvas background (`#F8FAFC`). No shadow.
- **Level 1 (Card & Content Blocks):** `box-shadow: 0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 1px 2px -1px rgba(15, 23, 42, 0.04);` bordered with `#E2E8F0` (1px solid). Used for default resource items and form panels.
- **Level 2 (Urgent Alerts & Active Rescue Cards):** `box-shadow: 0 4px 6px -1px rgba(245, 158, 11, 0.08), 0 2px 4px -2px rgba(245, 158, 11, 0.04);` with a border accentuating the urgency state.
- **Level 3 (Floating Actions & Bottom Sheets):** `box-shadow: 0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -4px rgba(15, 23, 42, 0.03);` used for modal drawers, pickup confirmations, and sticky bottom rescue bars.

## Shapes

The interface embraces inviting, modern rounded geometries:
- Core UI elements (inputs, standard buttons, alerts) utilize `rounded-xl` (12px / 0.75rem to 16px / 1rem).
- Primary visual modules, rescue feed cards, map modals, and bottom action sheets employ `rounded-2xl` (16px to 24px) to soften the experience and communicate human care.
- Filter chips and status indicators use full pill radius (`rounded-full`) for high scanability.

## Components

### Buttons
- **Primary Action (Rescue Confirmation, Claim Item):** Full-bleed or high-prominence buttons in `#059669` with pure white text, `rounded-xl`, height 48px to 52px for comfortable thumb reach. Active tap states drop opacity to 90% with a slight scale transition (`scale-98`).
- **Urgent Action (Immediate Pickup Required):** Solid `#F59E0B` fill with `#0F172A` high-contrast typography.
- **Secondary / Outline:** Background `#FFFFFF`, 1.5px solid `#E2E8F0`, text `#0F172A`.

### Status Badges (شارات الحالة)
- **نشط (Active):** Pill shape (`rounded-full`), padding `0.25rem 0.75rem`. Background `#ECFDF5`, text `#059669`, accompanied by a 6px pulsing emerald dot on the right side of the label text.
- **غير نشط (Inactive / Completed):** Pill shape (`rounded-full`), padding `0.25rem 0.75rem`. Background `#F1F5F9`, text `#64748B`, static neutral slate dot.

### Category Tags (وسوم الفئات)
Tags sit at 28px height with `rounded-lg` or `rounded-full` contours and subtle semantic backgrounds:
- **إنقاذ الأغذية (Food Rescue):** Background `#ECFDF5`, text `#047857`.
- **المستلزمات الطبية (Medical Supplies):** Background `#FEF2F2`, text `#B91C1C`.
- **المعدات والأجهزة (Equipment):** Background `#F0F9FF`, text `#0369A1`.
- **الخدمات المجتمعية (Community Services):** Background `#F5F3FF`, text `#6D28D9`.

### Cards (بطاقات التبرع والإنقاذ)
- Built on pure white (`#FFFFFF`) with Level 1 elevation and `rounded-2xl` corners.
- RTL layout order: Thumbnail image sits on the right or spans the card header; text block reads right-to-left with expiry countdown and status badge aligned at top left.
- Urgent rescue items feature a 2px stroke in `#F59E0B` and an amber-tinted timer badge.

### Form Inputs & Controls
- **Text Inputs:** Height 48px, background `#F8FAFC`, 1px border `#E2E8F0`, rounded `rounded-xl`. Floating labels align to the right. Helper text sits right-aligned below.
- **Checkboxes & Radios:** Positioned on the right side of list tiles. Active states fill with `#059669`. Focus outlines apply 3px soft emerald rings (`rgba(5, 150, 105, 0.2)`).