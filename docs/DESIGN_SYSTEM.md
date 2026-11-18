# BorrowNest Visual Design System & CSS Architecture

**Specification Version:** 1.0.0 (Module 07)  
**Product:** BorrowNest — *Share what you own. Borrow what you need.*  
**Standard:** WCAG 2.2 AAA Accessibility & Local-First Responsive Interface  

---

## 1. Design System Overview & Architecture

The BorrowNest Design System provides a coherent, accessible, and responsive visual foundation across all workspaces (Discover, Lending, Borrowing, and Account).

### Design System Principles
1. **Local-First Honesty**: Clear distinction between genuine browser-persisted user records and curated demonstration items. Zero simulated remote servers or fabricated locations.
2. **Unified Semantic Token Hierarchy**: Every design decision (colors, spacing, radii, typography, shadows, elevation) is driven by canonical `--bn-*` CSS custom properties defined in `src/styles/tokens.css`.
3. **Accessibility by Default (WCAG 2.2 AAA)**:
   - Minimum touch target dimensions of 44×44px for primary mobile controls.
   - Contrast ratios exceeding 4.5:1 for normal text and 3:1 for large text / graphical UI components.
   - High-visibility focus indicators (`:focus-visible`) across all interactive elements with a 2px offset.
   - Multi-modal status indication (status is never communicated solely by color; icon and textual indicators are always paired).
4. **Fluid & Mobile-First Responsiveness**:
   - Zero horizontal scrollbars or clipping from 320px viewport width up to 1920px ultra-wide screens.
   - Fixed mobile bottom navigation with safe content padding (`padding-bottom: 72px`).
   - Adaptive CSS Grid layouts using `repeat(auto-fill, minmax(min(100%, 280px), 1fr))`.

---

## 2. Color Palette & Semantic Token Scales

### Primary: Deep Teal Scale (`--bn-color-primary-*`)
Conveys community trust, stability, and utility.

| Token | Hex | Role |
| :--- | :--- | :--- |
| `--bn-color-primary-50` | `#f0fdfa` | Subtle backgrounds, active states, pill highlights |
| `--bn-color-primary-100` | `#ccfbf1` | Chip borders, soft container backgrounds |
| `--bn-color-primary-200` | `#99f6e4` | Secondary borders, modal accents |
| `--bn-color-primary-300` | `#5eead4` | Interactive accents, hover outlines |
| `--bn-color-primary-400` | `#2dd4bf` | Focused highlights, graphic elements |
| `--bn-color-primary-500` | `#14b8a6` | Interactive iconography |
| `--bn-color-primary-600` | `#0d9488` | Standard action buttons, focus rings |
| `--bn-color-primary-700` | `#0f766e` | Base primary brand, solid buttons, headings |
| `--bn-color-primary-800` | `#115e59` | Primary button hover states, prominent labels |
| `--bn-color-primary-900` | `#134e4a` | High-contrast text on light surfaces |
| `--bn-color-primary-950` | `#042f2e` | Deep contrast text |

### Accent: Warm Amber Scale (`--bn-color-accent-*`)
Conveys human warmth, lending activity, and illustrative demonstration highlights.

| Token | Hex | Role |
| :--- | :--- | :--- |
| `--bn-color-accent-50` | `#fffbeb` | Warning banners, demo showcase highlights |
| `--bn-color-accent-100` | `#fef3c7` | Demo badge background, archived item tags |
| `--bn-color-accent-200` | `#fde68a` | Demo badge border, warning container borders |
| `--bn-color-accent-300` | `#fcd34d` | Warning borders |
| `--bn-color-accent-400` | `#fbbf24` | Alert icons, restore borders |
| `--bn-color-accent-500` | `#f59e0b` | Interactive accent elements |
| `--bn-color-accent-600` | `#d97706` | Brand accent |
| `--bn-color-accent-700` | `#b45309` | Demo badge text, warning headings |
| `--bn-color-accent-800` | `#92400e` | High-contrast warning text |

### Neutral: Slate Scale (`--bn-color-slate-*`)
Ensures legible typographic hierarchy and clean surface separation.

| Token | Hex | Role |
| :--- | :--- | :--- |
| `--bn-color-slate-50` | `#f8fafc` | Page canvas background (`--bn-surface-bg`) |
| `--bn-color-slate-100` | `#f1f5f9` | Subtle containers (`--bn-surface-subtle`) |
| `--bn-color-slate-200` | `#e2e8f0` | Subtle borders (`--bn-border-subtle`) |
| `--bn-color-slate-300` | `#cbd5e1` | Strong borders (`--bn-border-strong`) |
| `--bn-color-slate-400` | `#94a3b8` | Tertiary text, disabled icons |
| `--bn-color-slate-500` | `#64748b` | Muted metadata (`--bn-text-muted`) |
| `--bn-color-slate-600` | `#475569` | Secondary text (`--bn-text-secondary`) |
| `--bn-color-slate-700` | `#334155` | Body text accents |
| `--bn-color-slate-800` | `#1e293b` | Dark subtitles |
| `--bn-color-slate-900` | `#0f172a` | Primary text (`--bn-text-primary`) |

### Semantic Status Scales
- **Success (`--bn-color-success-*`)**: Greens for available items, active loans, completed handovers.
- **Danger (`--bn-color-danger-*`)**: Reds for destructive actions, cancellation, overdue loans, missing fields.
- **Warning / Illustrative (`--bn-color-accent-*`)**: Ambers for demonstration badges, uncollected reservations, archived listings.

---

## 3. Spacing, Typography & Elevation Architecture

### Canonical Spacing Scale (`--bn-spacing-*`)
Standardized on an 8pt baseline grid with fine-grained fractional steps:

- `--bn-spacing-0-5`: `2px` (Fine icon offsets)
- `--bn-spacing-1`: `4px` (Tight gaps, pill padding)
- `--bn-spacing-2`: `8px` (Element margins, input padding)
- `--bn-spacing-3`: `12px` (Card inner spacing)
- `--bn-spacing-4`: `16px` (Standard layout gap)
- `--bn-spacing-5`: `20px` (Container padding)
- `--bn-spacing-6`: `24px` (Section gaps)
- `--bn-spacing-8`: `32px` (Major layout divisions)
- `--bn-spacing-12`: `48px` (Section margins)
- `--bn-spacing-16`: `64px` (Page boundaries)

*(Backward-compatible `--bn-space-*` aliases are maintained to ensure legacy compatibility.)*

### Typography Hierarchy
- System Font Stack: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif`
- Code / Monospace: `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace`
- Sizes: `xs` (12px), `sm` (14px), `base` (16px), `lg` (18px), `xl` (20px), `2xl` (24px), `3xl` (30px)
- Line Heights: `tight` (1.25), `snug` (1.375), `normal` (1.5), `relaxed` (1.625)

### Radii & Shadows
- Radii: `xs` (2px), `sm` (4px), `md` (6px), `lg` (8px), `xl` (12px), `2xl` (16px), `full` (9999px)
- Shadows: Soft, diffuse multi-layer elevations (`--bn-shadow-xs` through `--bn-shadow-xl`)

---

## 4. Automated Token Integrity Enforcement

To prevent design token regressions or un-prefixed ad-hoc CSS properties, BorrowNest includes an automated integrity validation scanner:

- **Validation Tool**: `scripts/validate-tokens.mjs`
- **CLI Script**: `npm run check:tokens`
- **Automated Vitest Test**: `src/styles/tokenIntegrity.test.js`
- **Enforcement**: Parses all `:root` declarations in `src/styles/tokens.css` and ensures 100% of `var(--bn-...)` usages across all 31 CSS files resolve without fallbacks or broken references.
