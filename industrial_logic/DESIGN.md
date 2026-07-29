---
name: Industrial Logic
colors:
  surface: '#f7faf9'
  surface-dim: '#d7dbda'
  surface-bright: '#f7faf9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f4f3'
  surface-container: '#ebeeed'
  surface-container-high: '#e6e9e8'
  surface-container-highest: '#e0e3e2'
  on-surface: '#181c1c'
  on-surface-variant: '#434749'
  inverse-surface: '#2d3131'
  inverse-on-surface: '#eef1f0'
  outline: '#747879'
  outline-variant: '#c3c7c8'
  surface-tint: '#586062'
  primary: '#181f21'
  on-primary: '#ffffff'
  primary-container: '#2d3436'
  on-primary-container: '#959c9f'
  inverse-primary: '#c1c8ca'
  secondary: '#a83639'
  on-secondary: '#ffffff'
  secondary-container: '#ff7675'
  on-secondary-container: '#720b16'
  tertiary: '#152023'
  on-tertiary: '#ffffff'
  tertiary-container: '#2a3538'
  on-tertiary-container: '#929da2'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dde4e6'
  primary-fixed-dim: '#c1c8ca'
  on-primary-fixed: '#161d1f'
  on-primary-fixed-variant: '#41484a'
  secondary-fixed: '#ffdad8'
  secondary-fixed-dim: '#ffb3b0'
  on-secondary-fixed: '#410006'
  on-secondary-fixed-variant: '#881d24'
  tertiary-fixed: '#d9e4e9'
  tertiary-fixed-dim: '#bdc8cd'
  on-tertiary-fixed: '#131d21'
  on-tertiary-fixed-variant: '#3e484c'
  background: '#f7faf9'
  on-background: '#181c1c'
  surface-variant: '#e0e3e2'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 26px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
  numeric-display:
    fontFamily: Inter
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.03em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  touch-target-min: 48px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 32px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 24px
---

## Brand & Style

The design system is engineered for high-utility industrial environments, specifically inventory management and logistics. The brand personality is reliable, systematic, and resilient, prioritizing rapid data ingestion and status clarity over decorative aesthetics.

The visual style is **Industrial Minimalism**. It draws from architectural drafting and machinery labeling—utilizing heavy-weight borders, high-contrast surfaces, and a rigid adherence to a grid. The UI must feel like a professional tool: unsentimental, durable, and highly legible under harsh warehouse lighting or on ruggedized mobile devices. Physical metaphors are limited to structural depth (layering) rather than skeuomorphic textures, ensuring the interface remains fast and responsive.

## Colors

This design system utilizes a high-contrast palette designed for legibility and "at-a-glance" status reporting.

- **Primary (Deep Slate):** Used for structural elements, headers, and primary text. It provides the "weight" of the interface.
- **Secondary (Safety Orange):** Reserved strictly for critical actions, warnings, and active states. It must stand out against the slate and white backgrounds to guide the eye to high-priority tasks.
- **Neutral / Background:** A clean, slightly cool light grey is used for the main canvas to reduce glare compared to pure white, while pure white is reserved for card surfaces to create distinct elevation.
- **Semantic Accents:** Success states (Connected) use a high-visibility emerald green, while caution states (Syncing) use a bold amber.

## Typography

The typography system relies exclusively on **Inter** for its neutral, highly legible glyphs and excellent numeric clarity. 

Key rules:
- **Numbers Matter:** For material measurements and stock counts, use the `numeric-display` role. These should always be prominent and never truncated.
- **Hierarchy:** Use `label-caps` for metadata (e.g., SKU numbers, Bin locations) to differentiate from human-readable descriptions.
- **Legibility:** All body text maintains a minimum size of 16px to ensure readability on handheld scanners and mobile devices in motion.

## Layout & Spacing

The layout follows a **Fluid Grid** model with strict minimums for touch targets. In a warehouse setting, users may be wearing gloves or using one-handed mobile devices; therefore, the interactive rhythm is more generous than a standard SaaS app.

- **Mobile:** 4-column fluid layout. Margins are 16px. All buttons and inputs must meet the `touch-target-min` of 48px height.
- **Desktop/Tablet:** 12-column grid for dashboard views. Content reflows into cards that span 3, 4, or 6 columns depending on data density.
- **Spacing Rhythm:** Use a base-8 scale. Content within cards uses `stack-sm` (8px) for related items and `stack-md` (16px) for distinct sections.

## Elevation & Depth

This design system uses **Tonal Layers and Hard Strokes** rather than soft shadows to define depth, maintaining an "industrial" feel.

- **Level 0 (Canvas):** The neutral background (#F4F7F6).
- **Level 1 (Cards):** Pure white surfaces with a 1px solid border (#2D3436 at 10% opacity). No shadow.
- **Level 2 (Modals/Pop-overs):** Pure white surfaces with a 2px solid border (#2D3436) and a high-contrast, non-diffused 4px "drop-down" offset to indicate focus.
- **Active State:** Elements being interacted with (pressed) should shift color or increase border weight, providing immediate tactile feedback without needing complex gradients.

## Shapes

The shape language is **Soft (0.25rem)**. This provides just enough radius to feel modern and professional while maintaining the "hard-edged" look of industrial equipment. 

- **Containers:** Use `rounded-sm` for cards and input fields.
- **Action Items:** Primary buttons use `rounded-sm`. 
- **Status Pills:** Small indicators for "Connected" or "Syncing" can use `rounded-xl` to create a "pill" shape that distinguishes them from actionable buttons.

## Components

### Buttons
- **Primary:** Deep Slate background with White text. Bold weight.
- **Action/Warning:** Safety Orange background with White text. Used for "Submit," "Delete," or "Flag."
- **Secondary:** Transparent background with 2px Slate border.

### Status Indicators
- **Connected:** A small green dot paired with `label-caps` text.
- **Syncing:** A small amber dot with an animated rotation or pulsing effect.
- **Offline:** A slate-grey dot with "DASHBOARD" style strike-through text.

### Numeric Inputs
- Specifically designed for "Material Measurements." These should feature large "plus" and "minus" steppers on either side of the value to accommodate glove-friendly adjustments. The value itself uses `numeric-display`.

### Cards
- White background, 1px border. Card headers should have a subtle grey background (#EBEDEE) to separate title info from the data body.

### Lists
- High-density rows with 16px vertical padding. Each row should have a clear separator line. On mobile, rows should be swipeable for common actions like "Add to Manifest."