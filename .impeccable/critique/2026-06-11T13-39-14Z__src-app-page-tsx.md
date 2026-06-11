---
target: landing page
total_score: 28
p0_count: 0
p1_count: 3
timestamp: 2026-06-11T13-39-14Z
slug: src-app-page-tsx
---
# Design Critique: EV Compare Thailand Landing Page

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3/4 | No loading feedback when navigating server-side page links. |
| 2 | Match System / Real World | 3/4 | Technical EV abbreviations (WLTP, V2L) lack tooltips or clear inline definitions. |
| 3 | User Control and Freedom | 4/4 | Back navigation and logo redirection are intuitive and functional. |
| 4 | Consistency and Standards | 2/4 | Cards use `rounded-2xl` (16px), violating the project's strict `max 12px` constraint. |
| 5 | Error Prevention | 4/4 | Static landing page with no high-risk inputs. |
| 6 | Recognition Rather Than Recall | 2/4 | Mobile navigation collapses into icon-only items without visible text labels. |
| 7 | Flexibility and Efficiency | 2/4 | Lacks accelerators like keyboard shortcuts or search triggers. |
| 8 | Aesthetic and Minimalist Design | 2/4 | Banned text gradients, ambient shadows (`glow-green`/`glow-blue`), and identical card layouts create boilerplate feel. |
| 9 | Error Recovery | 4/4 | Static page with no interactive error states. |
| 10 | Help and Documentation | 2/4 | No basic EV glossary or FAQ section for first-time buyers. |
| **Total** | | **28/40** | **Good (Solid foundation, but needs layout & component compliance)** |

## Anti-Patterns Verdict

*Does this look AI-generated?*

**LLM assessment**: Yes, in its current state, it carries several prominent AI boilerplate tells. The hero section relies heavily on vertical text gradients and a neon color-split span, which feels like a generic 2024 SaaS template. The feature grid is an "identical card template" (4 exact columns of icon + header + text) which lacks rhythm. Finally, the card and button containers use `rounded-2xl` (16px) and neon shadows/glows (`glow-green`/`glow-blue`), which directly violates the Flat & Bordered visual system of the project.

**Deterministic scan**:
The automated scanner found **1 warning** in [page.tsx](file:///c:/test%20project/ev/src/app/page.tsx):
- Line 65: **Gradient text** (`bg-clip-text` + `bg-gradient-to-b`). Text gradients are banned by design constraints.

**Visual overlays**:
Not available. Browser visualization was skipped due to subagent action timeout.

## Overall Impression
The landing page has a clean dark background and clear information grouping, but it is currently bogged down by generic SaaS template styling (gradients, glows, over-rounded corners) that distracts from the core data utility. Stripping these away and refining the mobile navigation will significantly elevate the premium feeling of the product.

## What's Working
1. **Clear Typographic Hierarchy**: Text sizes and weights map well to the content structure, making headings and body copy highly readable.
2. **Observance of Space**: The overall content layout has plenty of breathing room, and the structure is logical (Hero → Features → Featured Cars).

## Priority Issues

### [P1] Gradient Text on Hero and Navigation Logo
- **Why it matters**: Violates the project's absolute ban on text gradients. It reduces text clarity and cheapens the "Precision Grid" aesthetic.
- **Fix**: Remove all `bg-clip-text text-transparent` and gradients. Use high-contrast solid white (`#ffffff`) for titles, and solid Volt Blue (`#0ea5e9`) or Charge Green (`#05f383`) for small targeted accents.
- **Suggested command**: `$impeccable typeset`

### [P1] Non-Compliant Corner Radii and Box Shadows (Glows)
- **Why it matters**: Cards use `rounded-2xl` (16px) which violates the strict `max 12px` border-radius limit. The buttons and cards use shadow-glows (`glow-green`/`glow-blue`), violating the "Zero Shadow Rule."
- **Fix**: Replace all `rounded-2xl` with `rounded-xl` (12px). Remove all shadow and glow utility classes, relying on solid `border-ev-border` (1px solid `#1e293b`) and subtle background changes for visual elevation.
- **Suggested command**: `$impeccable layout`

### [P1] Mobile Icon-Only Navigation
- **Why it matters**: The navbar collapses on mobile into 4 icon-only links with no labels, violating the Recognition heuristic and confusing new users (Jordan).
- **Fix**: Display labels below icons or replace the responsive nav with a standard accessible mobile layout.
- **Suggested command**: `$impeccable adapt`

### [P2] Identical Card Grid for Features
- **Why it matters**: The 4-column features layout uses an identical grid that looks like basic AI scaffolding, creating visual monotony.
- **Fix**: Create a more asymmetric, data-centric layouts (e.g., a two-column detailed spec highlight or interactive preview).
- **Suggested command**: `$impeccable layout`

### [P2] Fake Ratings and Hardcoded Query
- **Why it matters**: Hardcoding `4.8` star rating on every featured car contradicts the brand personality of being an honest and reliable tool. The hardcoded array in `getFeaturedCars()` query is fragile.
- **Fix**: Retrieve ratings dynamically from the database and flag featured cars with a boolean flag (e.g., `isFeatured: true`) in the database query.
- **Suggested command**: `$impeccable harden`

## Persona Red Flags

### Jordan (First-Timer)
- **Red Flag**: The mobile navigation is icon-only. Jordan is left to guess what the comparison arrows or calculator icon represent.
- **Red Flag**: Complex EV jargon like "WLTP/NEDC/CLTC" and "V2L" are displayed without a brief explanation or glossary helper, causing cognitive overload.

### Casey (Distracted Mobile User)
- **Red Flag**: The "Compare" icon button at the bottom of the card is a tiny tap target (`p-2.5`) positioned closely to the main "สเปคโดยละเอียด" button, increasing the risk of accidental taps on the go.

### Riley (Deliberate Stress Tester)
- **Red Flag**: The `getFeaturedCars()` query hardcodes specific model names. If those model names are updated in the database or deleted, the homepage sections will break or show empty states without grace.

## Minor Observations
- The page contains animated pulse components which add unnecessary decorative motion.
- The background blur gradient glows compete with high-contrast text rendering.

## Questions to Consider
- *What if the feature grid were replaced with a live mini-comparison widget to showcase the product's primary utility instantly?*
- *Can we provide a togglable glossary overlay for EV terms to help first-time users?*
