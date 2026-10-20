---
name: Magic Tree House Viewer
description: A departure-timetable desk reader — ink board, stock paper, one signal yellow.
colors:
  ink: "#15212b"
  ink-2: "#1d2b36"
  ink-line: "#2c3b47"
  board-fg: "#eef1ee"
  board-muted: "#a9b5bd"
  signal: "#f4c21b"
  route: "#5b7182"
  ground: "#f4f3ee"
  card: "#fbfaf7"
  secondary: "#e7e6df"
  muted-foreground: "#56616a"
  border: "#d8d7cf"
  destructive: "#b3261e"
  bookmark-idle: "#9aa1a3"
typography:
  display:
    fontFamily: "Barlow Condensed, PingFang SC, sans-serif"
    fontSize: "clamp(2.375rem, 5vw, 3.75rem)"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Barlow Condensed, PingFang SC, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.025em"
  title:
    fontFamily: "Barlow Condensed, PingFang SC, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "normal"
  body:
    fontFamily: "Charter, Iowan Old Style, Palatino Linotype, Georgia, serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.7
    letterSpacing: "normal"
  label:
    fontFamily: "Barlow Condensed, PingFang SC, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.04em"
rounded:
  sm: "0.15rem"
  md: "0.2rem"
  lg: "0.25rem"
  full: "999px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  measure: "66ch"
  sidebar: "340px"
components:
  board-switch:
    backgroundColor: "transparent"
    textColor: "{colors.board-muted}"
    typography: "{typography.label}"
    rounded: "{rounded.lg}"
    padding: "0 12px"
    height: "32px"
  board-switch-pressed:
    backgroundColor: "{colors.signal}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.lg}"
    padding: "0 12px"
    height: "32px"
  timetable-row:
    backgroundColor: "transparent"
    textColor: "{colors.board-fg}"
    padding: "10px 24px"
  timetable-row-current:
    backgroundColor: "{colors.signal}"
    textColor: "{colors.ink}"
    padding: "10px 24px"
  search-ink:
    backgroundColor: "{colors.ink-2}"
    textColor: "{colors.board-fg}"
    rounded: "{rounded.lg}"
    height: "36px"
    padding: "0 12px 0 36px"
  bookmark-tab:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    size: "0.8em"
  pager-link:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.title}"
    rounded: "{rounded.lg}"
    padding: "8px"
---

# Design System: Magic Tree House Viewer

## Overview

**Creative North Star: "Departure Timetable"**

Every book is a departure whose time already lives in its title. The viewer is an ink timetable wrapped around a calm reading column — not a generic e-reader with a grey sidebar, white page, and blue accent. Signage lives on the dark board; English reading lives on cool timetable stock.

Density stays timetable-tight in chrome (condensed caps, tabular figures, four-column rows) and book-calm in the column (serif English, quiet Chinese underlines). One signal yellow marks only where you are and what you kept. Depth is mostly tonal: ink against stock, with a single soft sticky shadow on the departure board.

**Key Characteristics:**
- Ink frame (`#15212b`) for sidebar and sticky departure board; stock ground (`#f4f3ee`) for reading
- Barlow Condensed for all board/signage; Charter/Iowan for English; PingFang for Chinese
- Signal yellow spent only on current position and kept sentences
- Route blue-grey (`#5b7182`) for the line, focus rings, and reveal borders — never saturated blue
- 66ch reading measure; unkept bookmark tabs hidden until hover/focus

## Colors

A cool ink-and-stock palette with one reserved signal. Chrome is dark; the page is pale paper.

### Primary
- **Timetable Ink** (`#15212b`): Sidebar and departure-board surfaces; primary chrome fill. Darker cousins **Ink Lift** (`#1d2b36`) for hover/search wells and **Ink Line** (`#2c3b47`) for hairline dividers on the board.

### Secondary
- **Signal Yellow** (`#f4c21b`): Current book row, pressed board switches, route “here” marker, kept-sentence tab fill, favorites count, express highlight band. Rarity is mandatory.

### Tertiary
- **Route Blue-Grey** (`#5b7182`): Focus rings, caret, Chinese reveal border, ring token. Structural, not decorative.

### Neutral
- **Board Foreground** (`#eef1ee`): Primary text on ink.
- **Board Muted** (`#a9b5bd`): Secondary board labels, idle stops, placeholders.
- **Timetable Stock** (`#f4f3ee`): Page / reading background.
- **Card Stock** (`#fbfaf7`): Fact-block panels inside chapter content.
- **Stock Wash** (`#e7e6df`): Secondary/muted/accent surfaces on the light side.
- **Reading Secondary** (`#56616a`): Chinese lines and muted UI on stock.
- **Stock Rule** (`#d8d7cf`): Borders and inputs on light surfaces.
- **Bookmark Idle** (`#9aa1a3`): Rest stroke for unkept tabs (visible only on hover/touch).
- **Destructive** (`#b3261e`): Error copy only.

### Named Rules
**The Signal Rarity Rule.** Signal yellow marks only current position and kept sentences. It is never a general accent, link color, or decorative wash.

**The Route-Not-Blue Rule.** Navigation structure uses route blue-grey, not saturated UI blue. Focus, caret, and reveal borders follow `--route`.

## Typography

**Display Font:** Barlow Condensed (self-hosted 500/600) with PingFang SC fallback  
**Body Font:** Charter / Iowan Old Style / Palatino Linotype / Georgia  
**Chinese Font:** PingFang SC / Hiragino Sans GB / Noto Sans CJK SC  
**UI Sans:** System UI stack with PingFang SC

**Character:** Condensed station signage for the board; a quiet book serif for English stamina; smaller, cooler Chinese that never competes with the English line.

### Hierarchy
- **Display** (600, clamp ~38–60px, line-height 1): Sticky chapter title on the departure board.
- **Headline** (600, 22px, wide tracking, uppercase): Product name on the timetable header.
- **Title** (600, ~20px): Pager chapter titles; board meta at 15px medium for book/stop line.
- **Body** (400, default 18px adjustable 12–32, line-height 1.7): English chapter prose in a 66ch column.
- **Label** (600, 15px, tracking ~0.04em, often uppercase): Board switches, column headers (xs / 0.14em), time phrases, figure notes.

Chinese under each English line is 0.8em of the body size, PingFang, muted-foreground, line-height 1.75.

### Named Rules
**The Two-Face Rule.** Board chrome is always Barlow Condensed; reading English is always the serif stack. Do not put reading body in the condensed face, or board titles in the serif.

**The English-First Type Rule.** Chinese is smaller and cooler; it assists and never matches English weight or size.

## Layout

Two-pane desk layout: sticky ink timetable (`340px`) beside a fluid reading column. Below `lg`, the timetable stacks above (`max-h: 45vh`) and the board becomes a stacked mobile header.

Reading column: `max-width: 66ch`, horizontal padding 24 / 32 / 48px (`px-6` / `md:px-8` / `lg:px-12`), top padding ~40px. Timetable rows use a four-column grid: No. (`24px`) | 出发 (`76px`) | 书名 (flex) | 收藏 (auto), gap `10px`, horizontal inset `24px`.

The sticky departure board heads the main pane: large chapter title + book/time/stop meta, then the route line of chapter stops with board switches on the right. On scroll, the title block can tuck (`sticky top` negative offset) while the route line and switches remain.

### Named Rules
**The Four-Column Rule.** The book list is always No. | 出发 | 书名 | 收藏. Do not collapse into a single-title list or invent extra columns.

**The Sixty-Six Rule.** Continuous reading stays inside a 66ch measure. Do not full-bleed body prose across the main pane.

## Elevation & Depth

Mostly flat and tonal: ink frame against stock paper. No floating card stack on the page. The sticky departure board carries one soft drop (`0 6px 16px -10px rgba(21,33,43,0.6)`). The route “here” disc uses a hard ink halo (`0 0 0 4px` ink) as a station-marker ring, not a drop shadow.

### Shadow Vocabulary
- **Board sticky** (`box-shadow: 0 6px 16px -10px rgba(21,33,43,0.6)`): Sticky departure board only.
- **Here ring** (`box-shadow: 0 0 0 4px #15212b`): Current stop marker on the route line.

### Named Rules
**The Flat Chrome Rule.** Timetable rows and reading surfaces stay flat at rest. Do not add offset card shadows to list rows or paragraph blocks.

## Shapes

Tight station geometry: base radius `0.25rem` (4px), with board controls using small radii (`rounded-sm` / ~2–4px). Route stops and the “here” marker are full discs (`999px`). Bookmark tabs are a custom notched rectangle SVG (`12×16` viewBox), not stars. Fact blocks use full-bleed top/bottom ink hairlines, not rounded cards. Chapter figures use a `2px` image radius.

### Named Rules
**The Tab-Not-Star Rule.** Kept sentences use the bookmark-tab silhouette. Do not substitute stars, hearts, or pill badges for the keep mark.

## Components

### Board switches
Board language/size/express controls on ink. Height 32px, Barlow semibold 15px, muted text; pressed state fills signal yellow with ink text. Sit in an ink-2 well with `2px` padding.

### Timetable row
Four-column row button. Current book: full signal yellow bar, ink text. Idle: board foreground, ink-line hairline, hover lifts to ink-2. Kept count uses signal (or ink when the row is current). Expanded chapters hang from a vertical ink-line with disc stops; current chapter disc is signal-filled.

### Search (ink)
Ink-2 field, ink-line border, board-fg text, board-muted placeholder; focus border turns signal (no ring glow on the board search).

### Bookmark tab
Inline after each English cue. Unkept: opacity 0 at rest, ~0.5 on line hover, full on cue hover/focus; idle stroke `#9aa1a3`. Kept (`.on`): always visible, ink stroke, signal fill. Touch (`hover: none`): idle opacity 0.3 so tabs remain reachable.

### Route line
Muted track (`board-muted` at 55% opacity). Stops are 13px hollow discs; passed stops fill muted; kept stops grow a 3×7px signal tick above. Current position is a 22px signal disc that slides (`0.6s cubic-bezier(0.16, 1, 0.3, 1)`; disabled under `prefers-reduced-motion`).

### Pager
Two-up prev/next under a top ink hairline. Board labels uppercase with tracking; titles Barlow semibold ~20px. Hover washes stock secondary.

### Reading content
Serif English, Chinese under; reveal in en/zh modes uses a left route border. Express mode (`只看收藏`) dims non-kept cues to 0.22 opacity and paints kept cues with a signal underline wash at 62% from the top.

## Do's and Don'ts

### Do:
- **Do** spend signal yellow only on current row/stop/switch and kept tabs or express highlights.
- **Do** keep the reading column at 66ch with English serif + quieter Chinese beneath.
- **Do** hide unkept bookmark tabs until hover, focus, or touch affordance.
- **Do** treat the sticky ink board + stock column as the default chrome/page split.

### Don't:
- **Don't** use saturated blue, purple gradients, or generic e-reader grey/white/blue accents.
- **Don't** show idle keep marks in the reading line as permanent grey chrome.
- **Don't** put continuous body copy in Barlow Condensed or board titles in the reading serif.
- **Don't** widen the book list beyond the four timetable columns or drop the departure time phrase.
