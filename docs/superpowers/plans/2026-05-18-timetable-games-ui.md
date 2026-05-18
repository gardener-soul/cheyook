# 타임테이블 & 게임 UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 체육대회 앱에 세로 타임라인 UI, 게임 상세 인스타 링크 버튼, Playground 클릭 이동을 추가한다.

**Architecture:** `timetable-config.ts`에 하드코딩된 슬롯 데이터를 두고, `Timetable.tsx`가 DB 게임 목록을 `order_index`로 매핑해 타임라인을 렌더한다. 나머지 변경은 기존 컴포넌트에 최소한으로 추가한다.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS 4, Supabase JS, TypeScript

> **Note on testing:** 이 프로젝트에 테스트 인프라(jest/vitest)가 없음. 각 태스크는 `npm run dev` 후 브라우저 육안 검증으로 대체한다.

---

## File Map

| 파일 | 작업 |
|------|------|
| `src/lib/timetable-config.ts` | 신규 — 슬롯 타입 정의 + 하드코딩 데이터 |
| `src/components/Timetable.tsx` | 재작성 — 세로 타임라인 컴포넌트 |
| `src/components/GamesPageTabs.tsx` | 수정 — timetable 탭에서 새 컴포넌트 사용 |
| `src/app/games/[id]/page.tsx` | 수정 — 인스타 버튼 + description 줄바꿈 |
| `src/components/Playground.tsx` | 수정 — active 게임명에 Link 추가 |

---

## Task 1: timetable-config.ts 생성

**Files:**
- Create: `src/lib/timetable-config.ts`

- [ ] **Step 1: 파일 생성**

```typescript
// src/lib/timetable-config.ts

export type EventSlot = {
  type: 'event'
  time: string
  label: string
  duration?: string
}

export type SingleGameSlot = {
  type: 'single'
  time: string
  orderIndex: number
  duration?: string
}

export type DualGameSlot = {
  type: 'dual'
  time: string
  zoneA: number
  zoneB: number
  duration?: string
}

export type TimetableSlot = EventSlot | SingleGameSlot | DualGameSlot

export const TIMETABLE_SLOTS: TimetableSlot[] = [
  { type: 'event',  time: '4:30', label: '집결' },
  { type: 'event',  time: '4:35', label: '개회식',       duration: '5분' },
  { type: 'event',  time: '4:40', label: '준비운동',     duration: '5분' },
  { type: 'dual',   time: '4:45', zoneA: 1, zoneB: 2,   duration: '10분' },
  { type: 'dual',   time: '4:55', zoneA: 3, zoneB: 4,   duration: '10분' },
  { type: 'event',  time: '5:05', label: '휴식 & 전환', duration: '5분' },
  { type: 'single', time: '5:10', orderIndex: 5,         duration: '10분' },
  { type: 'single', time: '5:20', orderIndex: 6,         duration: '12분' },
  { type: 'single', time: '5:32', orderIndex: 7,         duration: '15분' },
  { type: 'single', time: '5:47', orderIndex: 8,         duration: '8분' },
  { type: 'single', time: '5:55', orderIndex: 9,         duration: '15분' },
  { type: 'single', time: '6:10', orderIndex: 10,        duration: '20분' },
  { type: 'single', time: '6:30', orderIndex: 11,        duration: '5분' },
  { type: 'event',  time: '6:35', label: '폐회 / 시상' },
]
```

- [ ] **Step 2: TypeScript 컴파일 확인**

```bash
npx tsc --noEmit
```

오류 없으면 통과. `timetable-config.ts` 관련 오류가 없어야 함.

- [ ] **Step 3: 커밋**

```bash
git add src/lib/timetable-config.ts
git commit -m "feat: add hardcoded timetable slot config"
```

---

## Task 2: Timetable.tsx 재작성

**Files:**
- Modify: `src/components/Timetable.tsx`

- [ ] **Step 1: 파일 전체 교체**

```tsx
// src/components/Timetable.tsx
import Link from 'next/link'
import type { Game } from '@/lib/db/games'
import { TIMETABLE_SLOTS } from '@/lib/timetable-config'
import { GAME_STATUSES } from '@/lib/constants'

const statusStyle = {
  pending:   { row: 'bg-white border-blue-100',    badge: 'bg-blue-100 text-blue-600',    nameClass: '' },
  active:    { row: 'bg-green-50 border-green-300', badge: 'bg-green-100 text-green-700',  nameClass: '' },
  completed: { row: 'bg-gray-50 border-gray-200',  badge: 'bg-gray-100 text-gray-400',    nameClass: 'line-through text-gray-400' },
}

function TimeLabel({ time }: { time: string }) {
  return (
    <div className="w-12 shrink-0 text-xs font-mono text-gray-400 pt-1">{time}</div>
  )
}

function GameCell({ game }: { game: Game | undefined }) {
  if (!game) {
    return (
      <div className="flex-1 rounded-lg border border-dashed border-gray-200 p-2 text-xs text-gray-300 text-center">
        —
      </div>
    )
  }

  const s = statusStyle[game.status]
  return (
    <Link href={`/games/${game.id}`} className="flex-1 block">
      <div className={`rounded-lg border p-2 hover:shadow-sm transition-all ${s.row}`}>
        <div className={`text-xs font-semibold truncate ${s.nameClass}`}>
          {game.status === 'active' && '🔥 '}{game.name}
        </div>
        <span className={`text-xs mt-1 px-1.5 py-0.5 rounded-full inline-block ${s.badge}`}>
          {GAME_STATUSES[game.status]}
        </span>
      </div>
    </Link>
  )
}

export default function Timetable({ games }: { games: Game[] }) {
  const byOrder = new Map(games.map((g) => [g.order_index, g]))

  return (
    <div className="flex flex-col gap-1">
      {TIMETABLE_SLOTS.map((slot, i) => {
        if (slot.type === 'event') {
          return (
            <div key={i} className="flex items-center gap-3 py-1.5 px-1">
              <TimeLabel time={slot.time} />
              <span className="text-sm text-gray-400">
                {slot.label}
                {slot.duration && (
                  <span className="text-xs ml-1 text-gray-300">({slot.duration})</span>
                )}
              </span>
            </div>
          )
        }

        if (slot.type === 'single') {
          const game = byOrder.get(slot.orderIndex)
          return (
            <div key={i} className="flex items-start gap-3 py-1 px-1">
              <TimeLabel time={slot.time} />
              <div className="flex-1">
                <GameCell game={game} />
              </div>
            </div>
          )
        }

        // dual
        const gameA = byOrder.get(slot.zoneA)
        const gameB = byOrder.get(slot.zoneB)
        return (
          <div key={i} className="flex items-start gap-3 py-1 px-1">
            <TimeLabel time={slot.time} />
            <div className="flex-1 grid grid-cols-2 gap-2">
              <div>
                <div className="text-xs text-gray-400 mb-1">구역 A</div>
                <GameCell game={gameA} />
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-1">구역 B</div>
                <GameCell game={gameB} />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: TypeScript 확인**

```bash
npx tsc --noEmit
```

오류 없어야 함.

- [ ] **Step 3: 커밋**

```bash
git add src/components/Timetable.tsx
git commit -m "feat: rewrite Timetable as vertical timeline"
```

---

## Task 3: GamesPageTabs.tsx — 타임테이블 탭 교체

**Files:**
- Modify: `src/components/GamesPageTabs.tsx`

- [ ] **Step 1: import 정리 + Timetable import 추가 + 탭 내용 교체**

`GamesPageTabs.tsx` 상단 import 블록을 아래로 교체 (ZONES, GAME_STATUSES는 타임테이블 탭 교체 후 미사용):

```tsx
'use client'
import { useState } from 'react'
import type { Game } from '@/lib/db/games'
import GameCard from './GameCard'
import Timetable from './Timetable'
```

기존 timetable 탭 내용(`tab === 'timetable'` 분기의 `<div className="flex flex-col gap-2">...</div>` 전체)을 아래로 교체:

```tsx
) : (
  <Timetable games={games} />
)}
```

완성된 return 전체:

```tsx
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
      <Timetable games={games} />
    )}
  </div>
)
```

- [ ] **Step 2: 개발 서버 실행 후 육안 검증**

```bash
npm run dev
```

`http://localhost:3000/games` 접속 → "타임테이블" 탭 클릭.

확인 사항:
- 4:30 집결부터 6:35 폐회까지 세로로 나열됨
- 4:45, 4:55 행은 구역 A / 구역 B 2열 표시
- 게임 카드 클릭 시 `/games/{id}` 이동
- DB에 시드 데이터 없으면 게임 셀에 `—` 표시

- [ ] **Step 3: 커밋**

```bash
git add src/components/GamesPageTabs.tsx
git commit -m "feat: replace timetable tab with new Timetable component"
```

---

## Task 4: 게임 상세 페이지 — 인스타 버튼 + description 포맷

**Files:**
- Modify: `src/app/games/[id]/page.tsx`

- [ ] **Step 1: description `whitespace-pre-line` 적용**

`game.description && <p className="mt-3 text-gray-700">{game.description}</p>` 를 아래로 교체:

```tsx
{game.description && (
  <p className="mt-3 text-gray-700 whitespace-pre-line">{game.description}</p>
)}
```

- [ ] **Step 2: 인스타그램 영상 버튼 추가**

`game.description` 렌더 바로 아래(`<div className="flex gap-4 mt-3 ...">` 전)에 추가:

```tsx
{game.instagram_url && (
  <a
    href={game.instagram_url}
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 transition-opacity"
  >
    ▶ 영상으로 보기
  </a>
)}
```

완성된 게임 헤더 섹션 (`<div>` ~ `</div>` 첫 번째 블록):

```tsx
<div>
  <div className="flex items-center gap-3 mb-1">
    <h1 className="text-2xl font-bold">{game.name}</h1>
    <span className="text-sm bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
      {GAME_STATUSES[game.status]}
    </span>
  </div>
  <div className="text-gray-500 text-sm">{ZONES[game.zone]}</div>
  {game.description && (
    <p className="mt-3 text-gray-700 whitespace-pre-line">{game.description}</p>
  )}
  {game.instagram_url && (
    <a
      href={game.instagram_url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 transition-opacity"
    >
      ▶ 영상으로 보기
    </a>
  )}
  <div className="flex gap-4 mt-3 text-sm text-gray-500">
    {game.points != null && <span>배점: {game.points}점</span>}
    {game.max_participants != null && (
      <span>참가 제한: {game.max_participants}명</span>
    )}
  </div>
</div>
```

- [ ] **Step 3: 육안 검증**

개발 서버가 실행 중인 상태에서 인스타 링크가 있는 게임 상세 페이지 접속 (예: `/games/{컵전쟁 id}`).

확인 사항:
- "▶ 영상으로 보기" 버튼이 자홍-보라 그라디언트로 표시됨
- 클릭 시 새 탭으로 인스타 링크 열림
- description의 `\n` 줄바꿈이 화면에 반영됨 (준비물 / 방식 구분)
- 인스타 링크 없는 게임(피구, 이어달리기)에는 버튼 미표시

- [ ] **Step 4: 커밋**

```bash
git add src/app/games/[id]/page.tsx
git commit -m "feat: add instagram video link and fix description line breaks"
```

---

## Task 5: Playground.tsx — active 게임명 Link 추가

**Files:**
- Modify: `src/components/Playground.tsx`

- [ ] **Step 1: Link import 추가**

파일 상단에 추가:

```tsx
import Link from 'next/link'
```

- [ ] **Step 2: 게임명 텍스트를 Link로 감싸기**

기존:

```tsx
<div className="font-semibold text-green-800 mb-2">
  🔥 {game.name}
</div>
```

교체:

```tsx
<Link href={`/games/${game.id}`} className="font-semibold text-green-800 mb-2 hover:underline block">
  🔥 {game.name}
</Link>
```

- [ ] **Step 3: 육안 검증**

홈 페이지(`/`)에서 active 게임이 있는 상태 확인.

확인 사항:
- active 게임명이 링크로 표시됨 (hover 시 밑줄)
- 클릭 시 `/games/{id}` 이동

active 게임이 없다면 어드민에서 한 게임을 active로 변경 후 확인.

- [ ] **Step 4: 커밋**

```bash
git add src/components/Playground.tsx
git commit -m "feat: link active game name to game detail in Playground"
```

---

## 최종 확인

- [ ] **전체 TypeScript 빌드 통과**

```bash
npm run build
```

오류 없이 빌드 완료되어야 함.

- [ ] **최종 커밋 (빌드 성공 확인 후)**

```bash
git add -A
git status  # 변경 파일 없어야 함 (이미 태스크별로 커밋됨)
```
