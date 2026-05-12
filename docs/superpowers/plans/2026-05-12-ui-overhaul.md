# UI Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a team cheering crowd UI, a `/games` route with tabs, and a playground UI on the main page.

**Architecture:** DB layer gets two new query functions; three new components (`TeamCheer`, `Playground`, `GamesPageTabs`) are added; main page is restructured to drop the static game list in favour of the live playground; a new `/games` page houses game browsing.

**Tech Stack:** Next.js 15 (App Router, server components), Supabase, Tailwind CSS v4

---

## File Map

| File | Action |
|------|--------|
| `src/lib/db/users.ts` | Add `listAllUsers()` |
| `src/lib/db/participants.ts` | Add `getActiveGameParticipants()` |
| `src/app/globals.css` | Add `@keyframes cheer` + `.cheer-bubble` |
| `src/components/TeamCheer.tsx` | Create — animated crowd circles |
| `src/components/Playground.tsx` | Create — zone cards with participants |
| `src/app/page.tsx` | Restructure — add TeamCheer + Playground, remove Timetable |
| `src/components/GamesPageTabs.tsx` | Create — client tab UI |
| `src/app/games/page.tsx` | Create — `/games` route |
| `src/components/Navbar.tsx` | Add "게임" link |

---

## Task 1: DB helpers — `listAllUsers` and `getActiveGameParticipants`

**Files:**
- Modify: `src/lib/db/users.ts`
- Modify: `src/lib/db/participants.ts`

- [ ] **Step 1: Add `listAllUsers` to users.ts**

Open `src/lib/db/users.ts` and append after the existing `getUserById` function:

```ts
export async function listAllUsers(): Promise<User[]> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('users')
    .select('*')
    .not('team', 'is', null)
    .order('name', { ascending: true })
  return data ?? []
}
```

- [ ] **Step 2: Add `getActiveGameParticipants` to participants.ts**

Open `src/lib/db/participants.ts` and append after the existing `selectRandomParticipants` function:

```ts
export async function getActiveGameParticipants(
  gameIds: string[]
): Promise<Record<string, Participant[]>> {
  if (gameIds.length === 0) return {}
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('game_participants')
    .select('*, users(name, village)')
    .in('game_id', gameIds)
  const result: Record<string, Participant[]> = {}
  for (const p of data ?? []) {
    if (!result[p.game_id]) result[p.game_id] = []
    result[p.game_id].push(p)
  }
  return result
}
```

- [ ] **Step 3: Verify the build compiles**

```bash
cd c:/Users/wbype/Desktop/cheyook
npx next build 2>&1 | tail -20
```

Expected: build succeeds (or only pre-existing errors, none from the new functions).

- [ ] **Step 4: Commit**

```bash
git add src/lib/db/users.ts src/lib/db/participants.ts
git commit -m "feat: add listAllUsers and getActiveGameParticipants db helpers"
```

---

## Task 2: CSS animation for the bubble crowd

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Append keyframe and utility class**

Add to the bottom of `src/app/globals.css`:

```css
@keyframes cheer {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

.cheer-bubble {
  animation: cheer 0.9s ease-in-out infinite;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/globals.css
git commit -m "feat: add cheer bubble animation"
```

---

## Task 3: `TeamCheer` component

**Files:**
- Create: `src/components/TeamCheer.tsx`

- [ ] **Step 1: Create the component**

```tsx
import type { User } from '@/lib/db/users'

export default function TeamCheer({ users }: { users: User[] }) {
  const blue = users.filter((u) => u.team === 'blue')
  const white = users.filter((u) => u.team === 'white')

  if (blue.length === 0 && white.length === 0) return null

  return (
    <div className="flex gap-2 mt-4 min-h-12">
      {/* 청팀 — flex-wrap toward center */}
      <div className="flex-1 flex flex-wrap content-start justify-end gap-1.5">
        {blue.map((u, i) => (
          <div
            key={u.id}
            className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold shrink-0 cheer-bubble"
            style={{ animationDelay: `${(i * 0.15) % 1.2}s` }}
            title={u.name}
          >
            {u.name.slice(0, 2)}
          </div>
        ))}
      </div>

      {/* divider */}
      <div className="flex items-start pt-2 text-gray-300 text-xs font-bold">⚡</div>

      {/* 백팀 — flex-wrap toward center */}
      <div className="flex-1 flex flex-wrap content-start justify-start gap-1.5">
        {white.map((u, i) => (
          <div
            key={u.id}
            className="w-10 h-10 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center text-xs font-bold shrink-0 cheer-bubble"
            style={{ animationDelay: `${(i * 0.15) % 1.2}s` }}
            title={u.name}
          >
            {u.name.slice(0, 2)}
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/TeamCheer.tsx
git commit -m "feat: add TeamCheer crowd component"
```

---

## Task 4: `Playground` component

**Files:**
- Create: `src/components/Playground.tsx`

- [ ] **Step 1: Create the component**

```tsx
import type { Game } from '@/lib/db/games'
import type { Participant } from '@/lib/db/participants'
import { ZONES } from '@/lib/constants'

type Zone = 'full' | 'zone_a' | 'zone_b'
const ZONE_ORDER: Zone[] = ['full', 'zone_a', 'zone_b']

export default function Playground({
  activeByZone,
  participantsByGame,
}: {
  activeByZone: Record<Zone, Game[]>
  participantsByGame: Record<string, Participant[]>
}) {
  return (
    <div className="flex flex-col gap-3">
      {ZONE_ORDER.map((zone) => {
        const games = activeByZone[zone]
        const hasGame = games.length > 0

        return (
          <div
            key={zone}
            className={`rounded-xl border p-4 transition-colors ${
              hasGame
                ? 'bg-green-50 border-green-300'
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">
              {ZONES[zone]}
            </div>

            {hasGame ? (
              games.map((game) => {
                const participants = participantsByGame[game.id] ?? []
                return (
                  <div key={game.id}>
                    <div className="font-semibold text-green-800 mb-2">
                      🔥 {game.name}
                    </div>
                    {participants.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {participants.map((p, i) => (
                          <div
                            key={p.id}
                            className="w-9 h-9 rounded-full bg-green-200 text-green-900 flex items-center justify-center text-xs font-bold shrink-0 cheer-bubble"
                            style={{ animationDelay: `${(i * 0.1) % 1.0}s` }}
                            title={p.users?.name}
                          >
                            {(p.users?.name ?? '?').slice(0, 2)}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-green-600">참여자 없음</p>
                    )}
                  </div>
                )
              })
            ) : (
              <p className="text-sm text-gray-400">대기중</p>
            )}
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Playground.tsx
git commit -m "feat: add Playground zone component"
```

---

## Task 5: Restructure main page

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Replace the entire file content**

```tsx
import { listGames } from '@/lib/db/games'
import { getTeamScores } from '@/lib/db/scores'
import { getScoreVisible } from '@/lib/db/settings'
import { listAllUsers } from '@/lib/db/users'
import { getActiveGameParticipants } from '@/lib/db/participants'
import ScoreBoard from '@/components/ScoreBoard'
import TeamCheer from '@/components/TeamCheer'
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

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h2 className="text-lg font-bold mb-3 text-center">팀 점수</h2>
        <ScoreBoard scores={scores} hidden={!scoreVisible} />
        <TeamCheer users={allUsers} />
      </section>

      <section>
        <h2 className="text-lg font-bold mb-3">🏃 운동장</h2>
        <Playground activeByZone={activeByZone} participantsByGame={participantsByGame} />
      </section>
    </div>
  )
}
```

- [ ] **Step 2: Verify build**

```bash
npx next build 2>&1 | tail -20
```

Expected: no TypeScript or build errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: restructure main page with TeamCheer and Playground"
```

---

## Task 6: `/games` route with tabs

**Files:**
- Create: `src/components/GamesPageTabs.tsx`
- Create: `src/app/games/page.tsx`

- [ ] **Step 1: Create `GamesPageTabs` client component**

```tsx
'use client'
import { useState } from 'react'
import type { Game } from '@/lib/db/games'
import GameCard from './GameCard'
import { ZONES, GAME_STATUSES } from '@/lib/constants'

type Tab = 'list' | 'timetable'

export default function GamesPageTabs({ games }: { games: Game[] }) {
  const [tab, setTab] = useState<Tab>('list')

  return (
    <div>
      <div className="flex gap-2 mb-4">
        {(['list', 'timetable'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              tab === t
                ? 'bg-blue-600 text-white'
                : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
            }`}
          >
            {t === 'list' ? '게임 목록' : '타임테이블'}
          </button>
        ))}
      </div>

      {tab === 'list' ? (
        <div className="flex flex-col gap-3">
          {games.length === 0 ? (
            <p className="text-center text-gray-400 py-8">등록된 게임이 없습니다.</p>
          ) : (
            games.map((game) => <GameCard key={game.id} game={game} />)
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {games.length === 0 ? (
            <p className="text-center text-gray-400 py-8">등록된 게임이 없습니다.</p>
          ) : (
            games.map((game, i) => (
              <div
                key={game.id}
                className="flex items-center gap-3 bg-white border border-blue-100 rounded-xl p-4"
              >
                <div className="text-sm font-bold text-blue-300 w-6 shrink-0 text-center">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-blue-900 truncate">{game.name}</div>
                  <div className="text-xs text-blue-400 mt-0.5">{ZONES[game.zone]}</div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      game.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : game.status === 'completed'
                        ? 'bg-gray-100 text-gray-500'
                        : 'bg-blue-100 text-blue-600'
                    }`}
                  >
                    {GAME_STATUSES[game.status]}
                  </span>
                  {game.points != null && (
                    <span className="text-xs text-blue-300">{game.points}점</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Create `/games` page**

Create `src/app/games/page.tsx`:

```tsx
import { listGames } from '@/lib/db/games'
import GamesPageTabs from '@/components/GamesPageTabs'

export default async function GamesPage() {
  const games = await listGames()
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">게임</h1>
      <GamesPageTabs games={games} />
    </div>
  )
}
```

- [ ] **Step 3: Verify build**

```bash
npx next build 2>&1 | tail -20
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/GamesPageTabs.tsx src/app/games/page.tsx
git commit -m "feat: add /games route with game list and timetable tabs"
```

---

## Task 7: Add "게임" link to Navbar

**Files:**
- Modify: `src/components/Navbar.tsx`

- [ ] **Step 1: Wrap logo + new link in a flex group**

Replace the current logo `<Link>` at the start of `<nav>` with:

```tsx
<div className="flex items-center gap-4">
  <Link href="/" className="font-bold text-xl text-white tracking-tight">
    🏃 체육대회
  </Link>
  <Link href="/games" className="text-blue-100 hover:text-white text-sm transition-colors">
    게임
  </Link>
</div>
```

The `justify-between` on `<nav>` already handles spacing — the right-side user area stays unchanged.

- [ ] **Step 2: Verify build and do a final check**

```bash
npx next build 2>&1 | tail -20
```

Expected: clean build.

- [ ] **Step 3: Commit**

```bash
git add src/components/Navbar.tsx
git commit -m "feat: add games link to navbar"
```

---

## Self-Review Checklist

- [x] **Spec: TeamCheer** — Task 3 implements animated circles from `listAllUsers()` (Task 1).
- [x] **Spec: Playground** — Task 4 uses `getActiveGameParticipants` (Task 1) and zone split from page (Task 5).
- [x] **Spec: /games tabs** — Task 6 covers both 게임 목록 and 타임테이블 tabs.
- [x] **Spec: Navbar link** — Task 7.
- [x] **Spec: Remove Timetable from main** — Task 5 drops the `<Timetable>` section entirely.
- [x] **Type consistency** — `Participant`, `Game`, `User` types used consistently across all tasks; `activeByZone` shape defined in Task 5 matches Task 4 props.
- [x] **No placeholders** — all steps contain complete code.
