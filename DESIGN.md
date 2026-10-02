# Design Brief — KrossOver

## Tone
Modern, energetic, social-first. Bold yet refined. Instagram-inspired with distinctive dark mode identity.

## Color Palette
| Token | OKLCH | Purpose |
| --- | --- | --- |
| Background | `0.12 0.006 260` | Deep black page base |
| Foreground | `0.93 0.008 250` | Near-white text |
| Card | `0.155 0.008 260` | Elevated surfaces |
| Primary | `0.56 0.22 320` | Purple-pink accent (CTAs, highlights) |
| Accent | `0.25 0.015 260` | Secondary interactive surfaces |
| Border | `0.24 0.01 260` | Subtle dividers |
| Destructive | `0.577 0.245 27` | Red alerts/deletes |
| Success | `0.72 0.18 145` | Green status/confirms |

## Typography
- **Display**: Figtree (400–900) for headers, hero text
- **Body**: Figtree (400–500) for content, UI labels
- **Mono**: Figtree (400) for code/technical content
- **Scale**: 12px (xs), 14px (sm), 16px (base), 20px (lg), 24px (xl), 32px (2xl), 40px (3xl)

## Elevation & Depth
| Surface | Style |
| --- | --- |
| Page background | Linear gradient, deep blacks, minimal texture |
| Header | Glassmorphic blur (24px) with saturate, top border only |
| Cards | Subtle shadow `0 1px 4px` + `0 2px 12px` |
| Bottom dock | Glassmorphic blur (24px), top border only, elevated shadow |
| Pop-ups | Glassmorphic overlay with full blur + saturate |

## Structural Zones
| Zone | Background | Border | Treatment |
| --- | --- | --- | --- |
| Header | `bg-card/85` blur | `border-border/40` top | Glassmorphic, sticky, app logo left |
| Main feed | `bg-background` | None | Gradient base, card stacks |
| Bottom dock | `bg-card/85` blur | `border-border/40` top | Glassmorphic, 5-tab nav (Home/Explore/Create/Messages/Profile) |
| Stories | Circular gradient rings | None | Conic gradient (orange→pink→purple→orange), viewed = dark grey |
| Cards/posts | `bg-card` | `border-border` | Rounded lg (0.75rem), shadow-card |

## Component Patterns
- **Story rings**: Instagram gradient (orange #fa7e1e → pink #d62976 → purple #962fbf → orange), conic-gradient, 2px padding
- **Story ring (viewed)**: Dark grey `0.32 0.01 260`
- **Primary buttons**: Purple-pink gradient, rounded-full, no border
- **Follow/secondary buttons**: Dark pill `0.22 0.01 260` with border, rounded-full
- **Search field**: Dark input `0.2 0.008 260`, rounded-full
- **Notification badge**: Red dot `0.577 0.245 27` positioned top-right with border
- **Icon buttons**: Circular, hover scale +5%, smooth transition

## Motion
- **Default transition**: 0.3s cubic-bezier(0.4, 0, 0.2, 1)
- **Icon hover**: 0.2s transform scale
- **Fade-in**: 300ms ease-out opacity + translateY
- **Slide-up**: 400ms ease-out opacity + translateY(20px)
- **Animations**: accordion-down, accordion-up, fade-in, slide-up defined in Tailwind keyframes

## Spacing & Rhythm
- **Base unit**: 4px
- **Padding**: xs (8px), sm (12px), md (16px), lg (24px), xl (32px)
- **Gap**: 8px (tight), 12px (normal), 16px (loose)
- **Border radius**: sm (4px), md (6px), lg (12px), xl (16px), full (9999px)

## Differentiation
**Lion logo branding** — appears in header, PWA icons, manifest, and favicons. Distinctive purple-pink gradient buttons stand out from Instagram's cooler blues. Glassmorphic surfaces (blur + saturate) create premium feel. Deep blacks with minimal texture avoid generic "dark mode blue" aesthetic.

## Constraints
- No raw hex colors in components (always use CSS variables)
- No arbitrary Tailwind classes (always semantic tokens)
- Story rings use conic-gradient for smooth 360° color sweep
- Glassmorphic surfaces require dual backdrop-filter + -webkit-backdrop-filter
- All OKLCH values expressed as `L C H` (no oklch() wrapper in CSS variables)
- Icons use .icon-hover for consistent hover scale
- Bottom dock is fixed position, mobile-first responsive

