---
name: Precision Institutional
colors:
  surface: '#fcf9f8'
  surface-dim: '#dcd9d9'
  surface-bright: '#fcf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f2'
  surface-container: '#f0eded'
  surface-container-high: '#eae7e7'
  surface-container-highest: '#e5e2e1'
  on-surface: '#1c1b1b'
  on-surface-variant: '#414751'
  inverse-surface: '#313030'
  inverse-on-surface: '#f3f0ef'
  outline: '#727783'
  outline-variant: '#c1c6d3'
  surface-tint: '#005faf'
  primary: '#005cab'
  on-primary: '#ffffff'
  primary-container: '#2d76c8'
  on-primary-container: '#fefcff'
  inverse-primary: '#a5c8ff'
  secondary: '#006e1c'
  on-secondary: '#ffffff'
  secondary-container: '#91f78e'
  on-secondary-container: '#00731e'
  tertiary: '#b81311'
  on-tertiary: '#ffffff'
  tertiary-container: '#dc3128'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d4e3ff'
  primary-fixed-dim: '#a5c8ff'
  on-primary-fixed: '#001c3a'
  on-primary-fixed-variant: '#004786'
  secondary-fixed: '#94f990'
  secondary-fixed-dim: '#78dc77'
  on-secondary-fixed: '#002204'
  on-secondary-fixed-variant: '#005313'
  tertiary-fixed: '#ffdad5'
  tertiary-fixed-dim: '#ffb4a9'
  on-tertiary-fixed: '#410001'
  on-tertiary-fixed-variant: '#930005'
  background: '#fcf9f8'
  on-background: '#1c1b1b'
  surface-variant: '#e5e2e1'
typography:
  display:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  data-mono:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  label-caps:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  container-max: 1280px
  gutter: 20px
---

## Brand & Style

The design system is rooted in **Professional Minimalism** and **Functional Utility**. It is designed for high-frequency financial interactions where clarity, speed, and trust are paramount. The aesthetic avoids all decorative ornamentation, focusing entirely on data density and legibility.

The brand personality is institutional yet accessible—reminiscent of professional trading terminals but refined for modern web standards. It utilizes a "flat" design language with a strict adherence to a 1px stroke economy. There are no gradients, no heavy shadows, and no blurred backgrounds. Every pixel must serve a functional purpose in communicating market data or interface state.

## Colors

The palette is strictly functional. Backgrounds use a "layered white" approach in light mode to separate navigation from content without relying on shadows.

- **Primary Blue (#387ED1):** Reserved exclusively for primary actions, active navigation states, and text links.
- **Semantic Colors:** Green (#4CAF50) and Red (#F44336) are used specifically for financial performance (gains/losses) and status indicators. They should never be used for decorative purposes.
- **Neutrals:** A range of grays defines the hierarchy of information. Borders and dividers are kept at a consistent 1px width to maintain a crisp, "technical" feel.
- **Dark Mode:** Inverts the logic using deep charcoal and near-black surfaces to reduce eye strain during long trading sessions.

## Typography

This design system prioritizes high-speed scanning of alphanumeric data. 

1. **Inter** is the primary typeface for all UI labels, headings, and instructional text due to its exceptional legibility at small sizes.
2. **JetBrains Mono** (or a tabular variant of Inter) is used for all numerical data, prices, and timestamps. This ensures that decimal points align vertically in lists and tables, allowing users to compare values instantly.
3. **Contrast:** Use font weight (Medium/Semibold) rather than color to create hierarchy. Secondary information should move to a lighter gray tone (#666666) rather than a smaller font size where possible.

## Layout & Spacing

The layout follows a **Rigid Grid** philosophy. Content is organized in a highly structured manner, often utilizing a multi-pane approach (e.g., a fixed sidebar for a watchlist and a fluid main area for charts and order books).

- **Spacing Rhythm:** Based on a 4px baseline. Most components use 8px (sm) or 16px (md) internal padding.
- **Grid:** A 12-column fluid grid is used for dashboard layouts, but data tables should span the full width of their containers.
- **Density:** This is a "high-density" system. Margins are kept tight to maximize the amount of information visible on a single screen without scrolling.

## Elevation & Depth

This design system rejects the use of physical elevation metaphors like shadows. Instead, depth is communicated through **Tonal Z-axis layering** and **Stroke containment**.

- **Level 0 (Background):** Pure white (#FFFFFF). Used for the main canvas.
- **Level 1 (Subtle Inset):** Off-white (#FBFBFB). Used for sidebars, navigation headers, or "wells" that contain specific groups of data.
- **Borders:** All containers are defined by a 1px border (#EEEEEE). 
- **Active State:** Selection is indicated by a 2px primary blue left-border accent or a subtle background tint, never by lifting the element off the page.

## Shapes

The shape language is "Soft-Square." While 0px radius is too aggressive, a small **4px (0.25rem)** radius is applied to buttons and input fields to provide a hint of modern refinement without appearing "bubbly" or informal.

- **Buttons/Inputs:** 4px radius.
- **Cards/Containers:** 4px radius or 0px when aligned to the edge of the viewport.
- **Status Tags:** 2px radius for a sharper, more technical appearance.

## Components

### Buttons
- **Primary:** Flat #387ED1 background, white text. No shadows.
- **Secondary:** Transparent background, 1px #EEEEEE border, dark gray text.
- **States:** On hover, primary buttons darken slightly (5-10%); secondary buttons gain a #FBFBFB background tint.

### Input Fields
- **Default:** 1px #EEEEEE border, 4px radius, white background.
- **Focus:** 1px #387ED1 border. No outer glow or "ring."
- **Data Inputs:** Use monospaced font for numerical entry.

### Data Tables
- **Header:** Light gray text (#999999), all-caps, 11px. 
- **Rows:** 1px bottom border only. Hover state changes the entire row background to #FBFBFB for precise tracking.

### Chips & Tags
- **Success/Danger:** Use a 10% opacity fill of the semantic color (Green/Red) with 100% opacity text for the label. This ensures readability while remaining understated.

### Icons
- Use **Line Icons** with a consistent 1.5px or 2px stroke weight. Icons should be monochrome (Dark Gray) unless they are active or indicate a specific semantic status.