# Mobile Team Avatars Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a mobile-only "청백팀 보기" toggle button that shows team member avatars in a two-column panel, while keeping the existing desktop margin layout unchanged.

**Architecture:** Extract the scoreboard section of `page.tsx` into a new `TeamSection` client component that manages the mobile toggle state. Desktop margin avatars are hidden on mobile with `hidden md:flex`; the toggle button and avatar panel are hidden on desktop with `md:hidden`.

**Tech Stack:** Next.js (App Router), React (`useState`), Tailwind CSS v4

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `src/components/TeamSection.tsx` | Create | Client component owning scoreboard + both avatar layouts |
| `src/app/page.tsx` | Modify | Replace inline scoreboard section with `<TeamSection>` |
| `src/components/ScoreBoard.tsx` | Modify | Add responsive font size (`text-5xl md:text-6xl`) |

---

### Task 1: Create `TeamSection` client component

**Files:**
- Create: `src/components/TeamSection.tsx`

- [ ] **Step 1: Create the file with full implementation**

```tsx
'use client'

import { useState } from 'react'
import ScoreBoard from '@/components/ScoreBoard'
import type { TeamScores } from '@/lib/db/scores'
import type { User } from '@/lib/db/users'

export default function TeamSection({
  scores,
  hidden,
  blue,
  white,
}: {
  scores: TeamScores
  hidden: boolean
  blue: User[]
  white: User[]
}) {
  const [showTeams, setShowTeams] = useState(false)

  return (
    <section className="relative overflow-hidden">
      <h2 className="text-lg font-bold mb-3 text-center">팀 점수</h2>
      <ScoreBoard scores={scores} hidden={hidden} />

      {/* 청팀 아바타 — 데스크탑 전용 왼쪽 마진 */}
      <div className="hidden md:flex absolute top-0 right-full pr-8 flex-wrap justify-end gap-1.5 w-36 content-start pt-8">
        {blue.map((u, i) => (
          <div
            key={u.id}
            className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold shrink-0 cheer-bubble"
            style={{ animationDelay: `${(i * 0.15) % 1.2}s` }}
            title={u.name}
          >
            {u.name.slice(-2)}
          </div>
        ))}
      </div>

      {/* 백팀 아바타 — 데스크탑 전용 오른쪽 마진 */}
      <div className="hidden md:flex absolute top-0 left-full pl-8 flex-wrap justify-start gap-1.5 w-36 content-start pt-8">
        {white.map((u, i) => (
          <div
            key={u.id}
            className="w-10 h-10 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center text-xs font-bold shrink-0 cheer-bubble"
            style={{ animationDelay: `${(i * 0.15) % 1.2}s` }}
            title={u.name}
          >
            {u.name.slice(-2)}
          </div>
        ))}
      </div>

      {/* 청백팀 보기 버튼 — 모바일 전용 */}
      <button
        className="md:hidden mt-4 w-full py-2.5 rounded-xl font-bold text-sm border border-blue-200 bg-gradient-to-r from-blue-500 to-white text-blue-900 shadow-sm"
        onClick={() => setShowTeams((v) => !v)}
      >
        {showTeams ? '닫기 ✕' : '청백팀 보기 👥'}
      </button>

      {/* 모바일 아바타 패널 */}
      {showTeams && (
        <div className="md:hidden mt-3 flex gap-3">
          {/* 청팀 */}
          <div className="flex-1">
            <div className="text-blue-600 font-bold text-sm mb-2 text-center">🔵 청팀</div>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {blue.map((u, i) => (
                <div
                  key={u.id}
                  className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold shrink-0 cheer-bubble"
                  style={{ animationDelay: `${(i * 0.15) % 1.2}s` }}
                  title={u.name}
                >
                  {u.name.slice(-2)}
                </div>
              ))}
            </div>
          </div>

          {/* 구분선 */}
          <div className="w-px bg-blue-100" />

          {/* 백팀 */}
          <div className="flex-1">
            <div className="text-gray-500 font-bold text-sm mb-2 text-center">⚪ 백팀</div>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {white.map((u, i) => (
                <div
                  key={u.id}
                  className="w-10 h-10 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center text-xs font-bold shrink-0 cheer-bubble"
                  style={{ animationDelay: `${(i * 0.15) % 1.2}s` }}
                  title={u.name}
                >
                  {u.name.slice(-2)}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors related to `TeamSection.tsx`

- [ ] **Step 3: Commit**

```bash
git add src/components/TeamSection.tsx
git commit -m "feat: add TeamSection client component with mobile avatar toggle"
```

---

### Task 2: Wire `TeamSection` into `page.tsx`

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Replace the scoreboard section**

In `src/app/page.tsx`, replace the entire `<section className="relative">` block (lines ~33–64) and add the import:

```tsx
import TeamSection from '@/components/TeamSection'
```

Replace the section:

```tsx
// REMOVE this entire block:
<section className="relative">
  <h2 className="text-lg font-bold mb-3 text-center">팀 점수</h2>
  <ScoreBoard scores={scores} hidden={!scoreVisible} />

  {/* 청팀 아바타 — 컨텐츠 영역 왼쪽 마진에 배치 */}
  <div className="absolute top-0 right-full pr-8 flex flex-wrap justify-end gap-1.5 w-36 content-start pt-8">
    {blue.map((u, i) => (
      <div ... />
    ))}
  </div>

  {/* 백팀 아바타 — 컨텐츠 영역 오른쪽 마진에 배치 */}
  <div className="absolute top-0 left-full pl-8 flex flex-wrap justify-start gap-1.5 w-36 content-start pt-8">
    {white.map((u, i) => (
      <div ... />
    ))}
  </div>
</section>
```

```tsx
// ADD this instead:
<TeamSection scores={scores} hidden={!scoreVisible} blue={blue} white={white} />
```

Also remove the now-unused `ScoreBoard` import from `page.tsx`.

The full resulting `page.tsx`:

```tsx
import { listGames } from '@/lib/db/games'
import { getTeamScores } from '@/lib/db/scores'
import { getScoreVisible } from '@/lib/db/settings'
import { listAllUsers } from '@/lib/db/users'
import { getActiveGameParticipants } from '@/lib/db/participants'
import TeamSection from '@/components/TeamSection'
import Playground from '@/components/Playground'

export default async function HomePage() {
  const [games, scores, scoreVisible, allUsers] = await Promise.all([
    listGames(),
    getTeamScores(),
    getScoreVisible(),
    listAllUsers(),
  ])

  const activeGames = games.filter((g) => g.status === 'active')
  const activeByZone = {
    full: activeGames.filter((g) => g.zone === 'full'),
    zone_a: activeGames.filter((g) => g.zone === 'zone_a'),
    zone_b: activeGames.filter((g) => g.zone === 'zone_b'),
  }

  const participantsByGame = await getActiveGameParticipants(
    activeGames.map((g) => g.id)
  )

  const blue = allUsers.filter((u) => u.team === 'blue')
  const white = allUsers.filter((u) => u.team === 'white')

  return (
    <div className="flex flex-col gap-8">
      <TeamSection scores={scores} hidden={!scoreVisible} blue={blue} white={white} />

      <section>
        <h2 className="text-lg font-bold mb-3">🏃 운동장</h2>
        <Playground activeByZone={activeByZone} participantsByGame={participantsByGame} />
      </section>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: replace scoreboard section with TeamSection in page.tsx"
```

---

### Task 3: Fix `ScoreBoard` responsive font size

**Files:**
- Modify: `src/components/ScoreBoard.tsx`

- [ ] **Step 1: Update font size classes**

In `src/components/ScoreBoard.tsx`, change the score number font size to be smaller on mobile:

Change line 18:
```tsx
// BEFORE
<div className="text-6xl font-black text-white">{scores.blue}</div>
// AFTER
<div className="text-5xl md:text-6xl font-black text-white">{scores.blue}</div>
```

Change line 33:
```tsx
// BEFORE
<div className="text-6xl font-black text-blue-700">{scores.white}</div>
// AFTER
<div className="text-5xl md:text-6xl font-black text-blue-700">{scores.white}</div>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ScoreBoard.tsx
git commit -m "fix: responsive score font size for mobile"
```

---

### Task 4: Visual verification

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

- [ ] **Step 2: Verify mobile layout**

Open browser DevTools → toggle device toolbar → set width to 375px (iPhone).

Check:
- Scoreboard displays correctly, no overflow
- "청백팀 보기 👥" button visible below scoreboard with blue→white gradient
- No avatar bubbles visible outside the button
- Clicking the button reveals two-column avatar panel (청팀 left, 백팀 right)
- Avatars animate with `cheer-bubble` bounce
- Clicking again collapses the panel ("닫기 ✕" label while open)

- [ ] **Step 3: Verify desktop layout unchanged**

Set DevTools width to 1280px or close DevTools entirely.

Check:
- "청백팀 보기" button NOT visible
- Avatar bubbles appear in left and right margins as before
- Scoreboard looks identical to pre-change state
