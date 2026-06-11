---
name: EV Compare Thailand
description: ระบบเปรียบเทียบรถยนต์ไฟฟ้า ค้นหาสเปค และคำนวณความประหยัด
colors:
  primary: "#05f383"
  secondary: "#0ea5e9"
  neutral-bg: "#070a13"
  neutral-card: "#0f172a"
  neutral-border: "#1e293b"
  highlight: "#f59e0b"
typography:
  display:
    fontFamily: "Inter, var(--font-inter), sans-serif"
    fontSize: "clamp(2rem, 5vw, 3rem)"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Inter, var(--font-inter), sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  sm: "6px"
  md: "12px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral-bg}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.primary}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  card-container:
    backgroundColor: "{colors.neutral-card}"
    rounded: "{rounded.md}"
    padding: "24px"
---

# Design System: EV Compare Thailand

## 1. Overview

**Creative North Star: "The Precision Grid"**

The design system for EV Compare Thailand is structured around extreme layout clarity, data accessibility, and high-efficiency typography. It serves as a precise tool for comparing electric vehicles, where readability of dense technical parameters is the absolute priority. The visual design rejects generic SaaS glassmorphism and excessive decorations in favor of solid borders, structured grids, and clean dark-mode surfaces.

### Key Characteristics:
- **Dark Space Backdrop**: Obsidian-level dark background that reduces eye strain during prolonged comparisons.
- **Accented Utility**: Neon Charge Green and Volt Blue used sparingly and intentionally (under 10% of surface area) to draw focus to interactive elements and highlights.
- **Strict Border Definition**: Content modules are defined by fine solid borders instead of soft dropshadows.

## 2. Colors

The color palette is characterized by a deep, high-contrast dark mode optimized for technical clarity.

### Primary
- **Charge Green** (#05f383): The primary interactive accent. Used on active states, select buttons, primary CTAs, and active border highlights.

### Secondary
- **Volt Blue** (#0ea5e9): The secondary information accent. Used to emphasize interactive links, supplementary stats, and secondary brand highlights.

### Neutral
- **Deep Space** (#070a13): The primary background color. Provides a solid, dark foundation.
- **Ev Card** (#0f172a): The background color for cards, panels, and table headers.
- **Ev Border** (#1e293b): The fine border color used to structure grids, separate rows, and define input boundaries.
- **White/Slate-100** (#ffffff / #f1f5f9): The primary text colors, delivering excellent contrast (above 4.5:1).

### Named Rules
**The Accent Limitation Rule.** Primary Charge Green and secondary Volt Blue must carry no more than 10% of any given screen area. Their impact is in their rarity; they must guide the eye, not overwhelm it.

## 3. Typography

**Display Font:** Inter (with system fallback)
**Body Font:** Inter (with system fallback)

The typography is characterized by high readability, balanced line-heights, and distinct weight contrasts.

### Hierarchy
- **Display** (800, clamp(2rem, 5vw, 3rem), 1.2): Used for page headers, main hero titles, and large brand headers.
- **Headline** (700, 1.5rem, 1.3): Used for section headers and major cards.
- **Title** (600, 1.125rem, 1.4): Used for subheadings and card details.
- **Body** (400, 1rem, 1.5): Used for general reading, specs description, and long-form reviews.
- **Label** (500, 0.875rem, normal): Used for buttons, metadata, labels, and table headers.

### Named Rules
**The Content Wrap Rule.** Always use `text-wrap: balance` on H1-H3 headers to prevent awkward text orphans.

## 4. Elevation

EV Compare Thailand utilizes a **Flat & Bordered** elevation philosophy. The structure of the page is defined by fine solid borders (`1px solid #1e293b`), creating distinct panels and rows without relying on fuzzy ambient drop shadows.

### Named Rules
**The Zero Shadow Rule.** Ambient drop shadows are prohibited on cards and panels. Visual depth is established purely through background tone changes (e.g., transitioning from Deep Space to Ev Card background) and fine borders.

## 5. Components

### Buttons
- **Shape:** Rounded Medium (12px)
- **Primary:** Charge Green background, Deep Space text, bold text, `8px 16px` padding.
- **Secondary:** Transparent background with Charge Green border, Charge Green text, `8px 16px` padding.
- **Hover / Focus:** Transition scale/opacity slightly. Primary button reduces opacity to 90% on hover.

### Cards / Containers
- **Corner Style:** Rounded Medium (12px)
- **Background:** Ev Card (#0f172a)
- **Shadow Strategy:** Zero shadows.
- **Border:** 1px solid Ev Border (#1e293b)
- **Internal Padding:** 24px (1.5rem)

### Inputs / Fields
- **Style:** Ev Card background with 1px solid Ev Border (#1e293b) outline, Rounded Small (6px).
- **Focus:** Border transitions to Charge Green with an optional subtle green glow.

### Navigation
- **Style:** Sticky header with `backdrop-blur-md` and `bg-ev-dark/85`. Nav items use Rounded Medium (12px) shapes, active items show a subtle `bg-electric-green/15` and `text-electric-green` color shift.

## 6. Do's and Don'ts

### Do:
- **Do** use strict 1px solid borders (`#1e293b`) to structure grids and table items.
- **Do** ensure all text colors hit a contrast ratio of at least 4.5:1 against their backgrounds.
- **Do** balance technical spec values with clear label headers (e.g. bold value with muted slate label).

### Don't:
- **Don't** use card corner radius larger than 12px.
- **Don't** use soft shadows combined with fine borders.
- **Don't** use gradient text backgrounds or neon glassmorphism.
- **Don't** use diagonal stripe backgrounds or crude sketchy SVG icons.
