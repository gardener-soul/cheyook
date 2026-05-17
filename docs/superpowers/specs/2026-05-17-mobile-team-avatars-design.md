# Mobile Team Avatars Design

**Date:** 2026-05-17  
**Status:** Approved

## Problem

The homepage displays team member avatars (청팀/백팀) using absolute positioning into the page's left/right margins (`right-full`, `left-full`). On mobile there are no margins, so avatars are pushed off-screen — 청팀 is completely invisible, 백팀 is clipped on the right edge.

## Goal

- Desktop: keep the current margin-based avatar layout exactly as-is
- Mobile: hide margin avatars; add a "청백팀 보기" toggle button that reveals a two-column avatar panel below the scoreboard

## Architecture

### New component: `src/components/TeamSection.tsx`

A client component (`'use client'`) that owns:
- The scoreboard display (`<ScoreBoard>`)
- Desktop margin avatar columns (unchanged, hidden on mobile)
- Mobile toggle button + collapsible avatar panel

`page.tsx` replaces its current `<section>` (scoreboard + margin avatar divs) with `<TeamSection>`.

**Props:**
```ts
{
  scores: TeamScores
  hidden: boolean       // score visibility (passed through to ScoreBoard)
  blue: User[]
  white: User[]
}
```

**State:**
```ts
const [showTeams, setShowTeams] = useState(false)
```

### Desktop layout (`md:` and above)

No changes. Margin avatar divs get `hidden md:flex` so they only appear on desktop.

### Mobile layout (below `md`)

1. **"청백팀 보기" button** (`md:hidden`)
   - Full width, centered below scoreboard
   - Background: left-to-right gradient `from-blue-500 to-white` with border
   - Text: "청백팀 보기 👥" (or similar), toggles to "닫기" when open
   - Toggles `showTeams` state

2. **Avatar panel** (shown when `showTeams === true`)
   - Two equal columns: 청팀 left, 백팀 right
   - Each column: team label header + grid of avatar bubbles
   - Avatar bubbles: same style + `cheer-bubble` animation as desktop
   - Animated expand (e.g. `max-h` transition or simple conditional render)

### Mobile UI fixes

- Add `overflow-hidden` to the `<section>` wrapper to prevent margin avatars from bleeding onto mobile screens
- `ScoreBoard`: reduce score font from `text-6xl` to `text-5xl` on mobile for better fit on narrow screens

## Files Changed

| File | Change |
|------|--------|
| `src/components/TeamSection.tsx` | New client component |
| `src/app/page.tsx` | Replace scoreboard section with `<TeamSection>` |
| `src/components/ScoreBoard.tsx` | Add responsive font size |

## Success Criteria

- On desktop (≥768px): layout identical to current, no visual change
- On mobile (<768px): margin avatars not visible, "청백팀 보기" button visible below scoreboard
- Tapping button reveals two-column avatar panel with bouncing animations
- Tapping again collapses the panel
