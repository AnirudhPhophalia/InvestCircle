---
name: Precision Institutional Dark
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#393939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#c1c6d3'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#8b919d'
  outline-variant: '#414751'
  surface-tint: '#a5c8ff'
  primary: '#a5c8ff'
  on-primary: '#00315f'
  primary-container: '#5092e7'
  on-primary-container: '#002a53'
  inverse-primary: '#005faf'
  secondary: '#b1c8ed'
  on-secondary: '#1a314f'
  secondary-container: '#344a6a'
  on-secondary-container: '#a3badf'
  tertiary: '#ffb870'
  on-tertiary: '#4a2800'
  tertiary-container: '#ce7e1c'
  on-tertiary-container: '#402200'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d4e3ff'
  primary-fixed-dim: '#a5c8ff'
  on-primary-fixed: '#001c3a'
  on-primary-fixed-variant: '#004786'
  secondary-fixed: '#d4e3ff'
  secondary-fixed-dim: '#b1c8ed'
  on-secondary-fixed: '#011c39'
  on-secondary-fixed-variant: '#324867'
  tertiary-fixed: '#ffdcbe'
  tertiary-fixed-dim: '#ffb870'
  on-tertiary-fixed: '#2c1600'
  on-tertiary-fixed-variant: '#693c00'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
typography:
  headline-xl:
    fontFamily: Work Sans
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Work Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Work Sans
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
    lineHeight: 18px
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '500'
    lineHeight: 14px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 32px
---

## Brand & Style
The design system adopts a professional, high-density aesthetic tailored for institutional finance and enterprise data environments. The personality is authoritative, precise, and focused. By transitioning to a dark color mode, the interface reduces eye strain for long-duration analytical work while maintaining the rigorous clarity of a systematic grid.

The style is **Corporate / Modern**, emphasizing functional hierarchy over decorative elements. It utilizes a flat design language with no shadows, relying instead on tonal shifts and subtle borders to define depth. The interface evokes a sense of reliability and technical sophistication, ensuring that complex data remains the primary focus.

## Colors
The palette is centered on a deep charcoal foundation to provide a stable, low-glare workspace. 

- **Primary**: #387ED1 (Professional Blue) is used sparingly for primary actions, active states, and critical focal points.
- **Surface (Base)**: #121212 serves as the primary application background.
- **Surface (Container)**: #1A1A1A is used for cards, sidebars, and nested sections to create subtle depth.
- **Typography**: Primary text uses an off-white (#F5F5F5) for high legibility, while secondary metadata uses a muted light gray (#A0A0A0).
- **Dividers**: #333333 provides the structural framework, replacing shadows with crisp, low-contrast borders.

## Typography
The typographic system prioritizes legibility and information density. 

- **Headlines**: Work Sans provides a grounded, professional feel for section headers.
- **Body**: Inter is used for all functional text and data entry, chosen for its neutral, systematic character.
- **Data Labels**: JetBrains Mono is utilized for tabular data, labels, and status indicators to emphasize technical precision and alignment.

On mobile devices, `headline-xl` should scale down to 24px and `headline-lg` to 20px to maintain proportion.

## Layout & Spacing
This design system uses a **Fixed Grid** model for desktop dashboards and a fluid model for mobile. 

- **Desktop**: 12-column grid with a 1200px max-width container, 16px gutters, and 32px external margins.
- **Tablet**: 8-column grid with 16px gutters and 24px margins.
- **Mobile**: 4-column fluid grid with 16px margins.

Spacing follows a strict 4px baseline shift to ensure all elements align perfectly within a dense, data-driven layout.

## Elevation & Depth
Elevation is expressed through **Tonal Layers** and **Low-Contrast Outlines** rather than shadows. 

1. **Level 0 (Base)**: #121212 - used for the main workspace background.
2. **Level 1 (Surface)**: #1A1A1A - used for cards, modules, and navigation panels.
3. **Borders**: All containers use a 1px solid border of #333333 to define boundaries. 

This approach maintains a "flat" institutional look that avoids the "glow" often associated with dark modes, ensuring a serious and sober aesthetic.

## Shapes
The shape language is **Soft** but disciplined. A subtle 0.25rem (4px) corner radius is applied to all interactive elements and containers. This provides a modern touch without sacrificing the "industrial" feel of the system. 

- Standard components (inputs, buttons): 4px radius.
- Larger containers (cards, modals): 8px (rounded-lg).
- Tags/Badges: 4px radius. No pill shapes are used in this system.

## Components
- **Buttons**: Primary buttons are solid #387ED1 with white text. Secondary buttons are #1A1A1A with a #333333 border and off-white text. They are strictly flat with no gradients.
- **Inputs**: Background color is #121212 (darker than the card surface) with a #333333 border. On focus, the border changes to #387ED1.
- **Cards**: Surface color #1A1A1A with a 1px #333333 border. No shadow.
- **Data Tables**: Header rows use a slightly lighter background (#252525) with JetBrains Mono labels. Row dividers use #333333.
- **Chips/Status**: Use a subtle background tint of the status color (e.g., dark green for "Success") with a 1px border. Do not use high-saturation blocks of color.
- **Lists**: Clean, border-bottom separated items. Hover states are indicated by a subtle shift to #252525 background.