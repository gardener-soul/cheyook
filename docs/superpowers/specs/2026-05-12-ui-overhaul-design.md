# Cheyook UI Overhaul Design

Date: 2026-05-12

## Overview

Three UI improvements to the Cheyook sports day app:
1. Team cheering crowd in ScoreBoard
2. Separate `/games` route with two tabs
3. Main page playground (운동장) UI replacing the game list

---

## 1. Team Cheering UI (`TeamCheer` component)

### Goal
Show team members as animated circles below the ScoreBoard, facing each other, creating a lively "cheering crowd" feel.

### Data
- Add `listAllUsers()` to `src/lib/db/users.ts` — fetches all users with a non-null team assignment.
- Fetched in `src/app/page.tsx` alongside existing queries.

### Component: `src/components/TeamCheer.tsx`
- Props: `users: User[]`
- Splits users by `team` field (`blue` / `white`)
- Layout: two columns side by side
  - Left column: 청팀 (blue circles), flex-wrap, items justify-end (faces right)
  - Right column: 백팀 (white/gray circles), flex-wrap, items justify-start (faces left)
- Each member: fixed-size circle (e.g. `w-10 h-10`) with name inside (text-xs, truncate)
- Animation: CSS keyframes defined in `globals.css`
  - `@keyframes cheer` — small vertical bounce (translateY -4px → 0)
  - Each circle gets `animation-delay` from a deterministic offset (index * 0.15s) to stagger the bounce, creating a wave/crowd effect

### Placement
Rendered in `src/app/page.tsx` directly below `<ScoreBoard>`, inside the team score section.

---

## 2. `/games` Route

### Goal
Move game browsing out of the main page into a dedicated route with two tabs.

### Route: `src/app/games/page.tsx`
- Fetches all games server-side
- Renders a tab UI (client component `GamesPageTabs`) with two tabs:
  - **게임 목록** — list of GameCards (same as current, links to `/games/[id]` for detail/signup)
  - **타임테이블** — ordered list showing `order_index`, game name, zone, status, points at a glance (no link needed, just info)

### Component: `src/components/GamesPageTabs.tsx` (client)
- Manages tab state with `useState`
- Accepts `games: Game[]` as prop, renders appropriate view per tab

### Navbar update
- Add a "게임" link to `src/components/Navbar.tsx` pointing to `/games`

### Note
The existing `/games/[id]` detail page is untouched — game signup still happens there.

---

## 3. Main Page Playground UI (운동장)

### Goal
Replace the static game list on the main page with a live "운동장" view showing which games are actively happening in each zone and who's participating.

### Data
- Main page already fetches `activeGames` filtered by zone.
- Additionally fetch participants for each active game: add `getActiveGameParticipants(gameIds)` to `src/lib/db/participants.ts` — a single query joining `game_participants` + `users` for a list of game IDs.
- Pass a map of `gameId → Participant[]` to the playground component.

### Component: `src/components/Playground.tsx`
- Props: `activeByZone`, `participantsByGame`
- Renders three zone cards stacked vertically:
  - **운동장 전체** (full)
  - **운동장 A구역** (zone_a)
  - **운동장 B구역** (zone_b)
- Each zone card:
  - If active game: shows game name as heading, then participant circles (same circle style as TeamCheer, but smaller, showing `name`)
  - If no active game: muted "대기중" placeholder text
- Zone cards use a light green background when active, gray when idle

### Main page changes (`src/app/page.tsx`)
- Remove `<Timetable>` and its section
- Add `<Playground>` section with fetched data
- The "현재 진행 중" section is merged into Playground (no separate list needed)

---

## Component Reuse

The name-bubble circle style is shared between `TeamCheer` and `Playground`. Extract as a tiny inline helper or a shared CSS class rather than a separate component (YAGNI).

---

## File Summary

| File | Change |
|------|--------|
| `src/lib/db/users.ts` | Add `listAllUsers()` |
| `src/lib/db/participants.ts` | Add `getActiveGameParticipants(gameIds)` |
| `src/app/page.tsx` | Add `listAllUsers` + participants fetch; add `<TeamCheer>`, `<Playground>`; remove `<Timetable>` |
| `src/components/TeamCheer.tsx` | New component |
| `src/components/Playground.tsx` | New component |
| `src/app/games/page.tsx` | New route |
| `src/components/GamesPageTabs.tsx` | New client tab component |
| `src/components/Navbar.tsx` | Add "게임" link |
| `src/app/globals.css` | Add `@keyframes cheer` animation |
