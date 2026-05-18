# 판별 승자 기록 & 참여자 팀 분리 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 게임당 최대 3판 결과를 실시간으로 기록하고 승자 팀에 점수를 자동 부여하며, 참여자 목록을 청/백팀으로 분리해 표시한다.

**Architecture:** 새 `game_rounds` Supabase 테이블에 판별 결과를 저장하고, 판 추가 시 `score_logs`에도 자동 삽입한다. 어드민 `GameList`에 인라인 판 기록 UI를 추가하고, 게임 상세·어드민 참여자 섹션에서 `VILLAGE_TEAM`으로 청/백팀을 분리 표시한다.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS 4, Supabase JS, TypeScript

> **Note on testing:** 이 프로젝트에 테스트 인프라(jest/vitest)가 없음. 각 태스크는 `npx tsc --noEmit` + 브라우저 육안 검증으로 대체한다.

---

## 선행 작업: Supabase 테이블 생성 (관리자 수동)

Supabase 대시보드 → SQL Editor → 실행:

```sql
create table game_rounds (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references games(id) on delete cascade,
  round_number int not null,
  winner_team text not null check (winner_team in ('blue', 'white', 'draw')),
  points_awarded int not null default 0,
  created_at timestamptz not null default now()
);
```

---

## File Map

| 파일 | 작업 |
|------|------|
| `src/lib/db/rounds.ts` | 신규 — GameRound 타입 + DB 함수 |
| `src/app/api/games/[id]/rounds/route.ts` | 신규 — GET / POST API |
| `src/components/admin/GameList.tsx` | 수정 — RoundRecorder 서브컴포넌트 추가 |
| `src/app/games/[id]/page.tsx` | 수정 — 참여자 청/백팀 2열 분리 |
| `src/app/admin/AdminTabs.tsx` | 수정 — ParticipantSection 팀 분리 |

---

## Task 1: `src/lib/db/rounds.ts` 생성

**Files:**
- Create: `src/lib/db/rounds.ts`

- [ ] **Step 1: 파일 생성**

```typescript
// src/lib/db/rounds.ts
import { createServiceClient } from '@/lib/supabase/service'

export type GameRound = {
  id: string
  game_id: string
  round_number: number
  winner_team: 'blue' | 'white' | 'draw'
  points_awarded: number
  created_at: string
}

export async function listRounds(gameId: string): Promise<GameRound[]> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('game_rounds')
    .select('*')
    .eq('game_id', gameId)
    .order('round_number', { ascending: true })
  return data ?? []
}

export async function addRound(input: {
  game_id: string
  round_number: number
  winner_team: 'blue' | 'white' | 'draw'
  points_awarded: number
}): Promise<GameRound | null> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('game_rounds')
    .insert(input)
    .select()
    .single()
  return data
}
```

- [ ] **Step 2: TypeScript 확인**

```bash
npx tsc --noEmit
```

오류 없어야 함.

- [ ] **Step 3: 커밋**

```bash
git add src/lib/db/rounds.ts
git commit -m "feat: add game_rounds DB functions"
```

---

## Task 2: `src/app/api/games/[id]/rounds/route.ts` 생성

**Files:**
- Create: `src/app/api/games/[id]/rounds/route.ts`

- [ ] **Step 1: 파일 생성**

```typescript
// src/app/api/games/[id]/rounds/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { listRounds, addRound } from '@/lib/db/rounds'
import { addScore } from '@/lib/db/scores'
import { requireAdmin } from '@/lib/auth'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const rounds = await listRounds(id)
  return NextResponse.json(rounds)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: '권한 없음' }, { status: 403 })

  const { id } = await params
  const { round_number, winner_team, points_awarded } = await request.json()

  if (!winner_team || !['blue', 'white', 'draw'].includes(winner_team)) {
    return NextResponse.json({ error: '승자 팀을 선택해주세요.' }, { status: 400 })
  }
  if (typeof points_awarded !== 'number') {
    return NextResponse.json({ error: '점수를 입력해주세요.' }, { status: 400 })
  }
  if (typeof round_number !== 'number' || round_number < 1 || round_number > 3) {
    return NextResponse.json({ error: '판 번호가 올바르지 않습니다.' }, { status: 400 })
  }

  const round = await addRound({ game_id: id, round_number, winner_team, points_awarded })

  if (winner_team !== 'draw') {
    await addScore({
      team: winner_team as 'blue' | 'white',
      points: points_awarded,
      game_id: id,
      reason: `${round_number}판 결과`,
      created_by: admin.id,
    })
  }

  return NextResponse.json(round)
}
```

- [ ] **Step 2: TypeScript 확인**

```bash
npx tsc --noEmit
```

오류 없어야 함.

- [ ] **Step 3: 커밋**

```bash
git add src/app/api/games/[id]/rounds/route.ts
git commit -m "feat: add rounds API (GET + POST)"
```

---

## Task 3: `GameList.tsx` — 판 기록 UI 추가

**Files:**
- Modify: `src/components/admin/GameList.tsx`

- [ ] **Step 1: `GameRound` import 추가**

파일 상단 import 블록에 추가:

```tsx
import type { GameRound } from '@/lib/db/rounds'
```

- [ ] **Step 2: `RoundRecorder` 서브컴포넌트 파일 하단에 추가**

`GameList` 컴포넌트 정의 뒤 파일 맨 아래에 추가:

```tsx
function RoundRecorder({ game }: { game: Game }) {
  const [rounds, setRounds] = useState<GameRound[]>([])
  const [showForm, setShowForm] = useState(false)
  const [winner, setWinner] = useState<'blue' | 'white' | 'draw'>('blue')
  const [points, setPoints] = useState(String(game.points ?? 0))
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch(`/api/games/${game.id}/rounds`)
      .then((r) => r.json())
      .then(setRounds)
  }, [game.id])

  async function handleAdd() {
    setLoading(true)
    const nextRound = rounds.length + 1
    await fetch(`/api/games/${game.id}/rounds`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        round_number: nextRound,
        winner_team: winner,
        points_awarded: Number(points),
      }),
    })
    const updated: GameRound[] = await fetch(`/api/games/${game.id}/rounds`).then((r) => r.json())
    setRounds(updated)
    setShowForm(false)
    setLoading(false)
  }

  const canAdd = rounds.length < 3

  return (
    <div className="mt-2 pt-2 border-t">
      <div className="flex flex-wrap gap-1 mb-1.5">
        {rounds.map((r) => (
          <span
            key={r.id}
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              r.winner_team === 'blue'
                ? 'bg-blue-100 text-blue-700'
                : r.winner_team === 'white'
                ? 'bg-gray-100 text-gray-700'
                : 'bg-yellow-100 text-yellow-700'
            }`}
          >
            {r.round_number}판{' '}
            {r.winner_team === 'blue' ? '청팀' : r.winner_team === 'white' ? '백팀' : '무승부'}{' '}
            +{r.points_awarded}점
          </span>
        ))}
      </div>

      {canAdd && !showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1 rounded hover:bg-indigo-100"
        >
          + {rounds.length + 1}판 기록
        </button>
      )}

      {showForm && (
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1">
            {(['blue', 'white', 'draw'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setWinner(t)}
                className={`text-xs px-2 py-1 rounded font-medium ${
                  winner === t
                    ? t === 'blue'
                      ? 'bg-blue-600 text-white'
                      : t === 'white'
                      ? 'bg-gray-600 text-white'
                      : 'bg-yellow-500 text-white'
                    : 'bg-gray-100'
                }`}
              >
                {t === 'blue' ? '청팀' : t === 'white' ? '백팀' : '무승부'}
              </button>
            ))}
          </div>
          <input
            type="number"
            value={points}
            onChange={(e) => setPoints(e.target.value)}
            className="w-16 text-xs border rounded px-2 py-1"
          />
          <span className="text-xs text-gray-400">점</span>
          <button
            onClick={handleAdd}
            disabled={loading}
            className="text-xs bg-green-600 text-white px-3 py-1 rounded disabled:opacity-50"
          >
            {loading ? '...' : '기록'}
          </button>
          <button
            onClick={() => setShowForm(false)}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            취소
          </button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: `useEffect` import 추가 확인**

파일 상단의 `import { useState } from 'react'` 를 아래로 교체:

```tsx
import { useState, useEffect } from 'react'
```

- [ ] **Step 4: active 게임 카드에 `RoundRecorder` 삽입**

`GameList` 컴포넌트 내부, 각 게임 카드 `</div>` 닫기 직전에 추가.

기존 게임 카드 구조의 마지막 부분:

```tsx
            <div className="flex gap-2 shrink-0">
              {next.next && (
                <button
                  disabled={loading === game.id}
                  onClick={() => changeStatus(game, next.next)}
                  className="text-xs bg-green-600 text-white px-2 py-1 rounded disabled:opacity-50"
                >
                  {loading === game.id ? '...' : next.label}
                </button>
              )}
              <button
                onClick={() => deleteGame(game.id)}
                className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded hover:bg-red-200"
              >
                삭제
              </button>
            </div>
          </div>
```

전체 카드를 아래로 교체 (`<div key={game.id} ...>` ~ `</div>`):

```tsx
          <div
            key={game.id}
            className="bg-white border rounded-lg p-3"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="font-medium text-sm">{game.name}</span>
                <span className="text-xs text-gray-400 ml-2">{ZONES[game.zone]}</span>
                <span className="text-xs text-gray-400 ml-2">{GAME_STATUSES[game.status]}</span>
              </div>
              <div className="flex gap-2 shrink-0">
                {next.next && (
                  <button
                    disabled={loading === game.id}
                    onClick={() => changeStatus(game, next.next)}
                    className="text-xs bg-green-600 text-white px-2 py-1 rounded disabled:opacity-50"
                  >
                    {loading === game.id ? '...' : next.label}
                  </button>
                )}
                <button
                  onClick={() => deleteGame(game.id)}
                  className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded hover:bg-red-200"
                >
                  삭제
                </button>
              </div>
            </div>
            {game.status === 'active' && <RoundRecorder game={game} />}
          </div>
```

- [ ] **Step 5: TypeScript 확인**

```bash
npx tsc --noEmit
```

오류 없어야 함.

- [ ] **Step 6: 커밋**

```bash
git add src/components/admin/GameList.tsx
git commit -m "feat: add per-round recording UI in GameList"
```

---

## Task 4: `src/app/games/[id]/page.tsx` — 참여자 팀 분리

**Files:**
- Modify: `src/app/games/[id]/page.tsx`

- [ ] **Step 1: `VILLAGE_TEAM`·`Village` import 추가**

기존:

```tsx
import { ZONES, GAME_STATUSES } from '@/lib/constants'
```

교체:

```tsx
import { ZONES, GAME_STATUSES, VILLAGE_TEAM, type Village } from '@/lib/constants'
```

- [ ] **Step 2: 팀 분리 변수 추가**

`const registered = ...` 바로 아래에 추가:

```tsx
  const selectedBlue = selected.filter(
    (p) => p.users?.village && VILLAGE_TEAM[p.users.village as Village] === 'blue'
  )
  const selectedWhite = selected.filter(
    (p) => p.users?.village && VILLAGE_TEAM[p.users.village as Village] === 'white'
  )
  const registeredBlue = registered.filter(
    (p) => p.users?.village && VILLAGE_TEAM[p.users.village as Village] === 'blue'
  )
  const registeredWhite = registered.filter(
    (p) => p.users?.village && VILLAGE_TEAM[p.users.village as Village] === 'white'
  )
```

- [ ] **Step 3: 선발된 참여자 섹션 교체**

기존:

```tsx
      {selected.length > 0 && (
        <section>
          <h2 className="font-semibold mb-2">✅ 선발된 참여자 ({selected.length}명)</h2>
          <div className="flex flex-wrap gap-2">
            {selected.map((p) => (
              <span key={p.id} className="bg-blue-50 border border-blue-200 rounded-full px-3 py-1 text-sm">
                {p.users?.village} · {p.users?.name}
              </span>
            ))}
          </div>
        </section>
      )}
```

교체:

```tsx
      {selected.length > 0 && (
        <section>
          <h2 className="font-semibold mb-2">✅ 선발된 참여자 ({selected.length}명)</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs font-medium text-blue-600 mb-1.5">청팀 ({selectedBlue.length}명)</div>
              <div className="flex flex-col gap-1">
                {selectedBlue.map((p) => (
                  <span key={p.id} className="bg-blue-50 border border-blue-200 rounded-full px-3 py-1 text-sm">
                    {p.users?.village} · {p.users?.name}
                  </span>
                ))}
                {selectedBlue.length === 0 && <span className="text-xs text-gray-300">없음</span>}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-gray-500 mb-1.5">백팀 ({selectedWhite.length}명)</div>
              <div className="flex flex-col gap-1">
                {selectedWhite.map((p) => (
                  <span key={p.id} className="bg-gray-50 border border-gray-200 rounded-full px-3 py-1 text-sm">
                    {p.users?.village} · {p.users?.name}
                  </span>
                ))}
                {selectedWhite.length === 0 && <span className="text-xs text-gray-300">없음</span>}
              </div>
            </div>
          </div>
        </section>
      )}
```

- [ ] **Step 4: 신청자 섹션 교체**

기존:

```tsx
      <section>
        <h2 className="font-semibold mb-2">
          📝 신청자 ({participants.length}명
          {game.max_participants ? ` / 제한 ${game.max_participants}명` : ''})
        </h2>
        {registered.length === 0 && selected.length === 0 ? (
          <p className="text-gray-400 text-sm">아직 신청자가 없습니다.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {registered.map((p) => (
              <span key={p.id} className="bg-gray-50 border border-gray-200 rounded-full px-3 py-1 text-sm">
                {p.users?.village} · {p.users?.name}
              </span>
            ))}
          </div>
        )}
      </section>
```

교체:

```tsx
      <section>
        <h2 className="font-semibold mb-2">
          📝 신청자 ({participants.length}명
          {game.max_participants ? ` / 제한 ${game.max_participants}명` : ''})
        </h2>
        {registered.length === 0 && selected.length === 0 ? (
          <p className="text-gray-400 text-sm">아직 신청자가 없습니다.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs font-medium text-blue-600 mb-1.5">청팀 ({registeredBlue.length}명)</div>
              <div className="flex flex-col gap-1">
                {registeredBlue.map((p) => (
                  <span key={p.id} className="bg-blue-50 border border-blue-200 rounded-full px-3 py-1 text-sm">
                    {p.users?.village} · {p.users?.name}
                  </span>
                ))}
                {registeredBlue.length === 0 && <span className="text-xs text-gray-300">없음</span>}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-gray-500 mb-1.5">백팀 ({registeredWhite.length}명)</div>
              <div className="flex flex-col gap-1">
                {registeredWhite.map((p) => (
                  <span key={p.id} className="bg-gray-50 border border-gray-200 rounded-full px-3 py-1 text-sm">
                    {p.users?.village} · {p.users?.name}
                  </span>
                ))}
                {registeredWhite.length === 0 && <span className="text-xs text-gray-300">없음</span>}
              </div>
            </div>
          </div>
        )}
      </section>
```

- [ ] **Step 5: TypeScript 확인**

```bash
npx tsc --noEmit
```

오류 없어야 함.

- [ ] **Step 6: 커밋**

```bash
git add "src/app/games/[id]/page.tsx"
git commit -m "feat: split participants by team in game detail page"
```

---

## Task 5: `AdminTabs.tsx` — ParticipantSection 팀 분리

**Files:**
- Modify: `src/app/admin/AdminTabs.tsx`

- [ ] **Step 1: `VILLAGE_TEAM`·`Village` import 추가**

기존:

```tsx
import type { Participant } from '@/lib/db/participants'
```

교체:

```tsx
import type { Participant } from '@/lib/db/participants'
import { VILLAGE_TEAM, type Village } from '@/lib/constants'
```

- [ ] **Step 2: `ParticipantSection` 내부 participants 렌더링 교체**

기존 `<div className="flex flex-col gap-2">` ~ 닫는 `</div>` 전체:

```tsx
          <div className="flex flex-col gap-2">
            {participants.length === 0 && loaded && (
              <p className="text-gray-400 text-sm">신청자 없음</p>
            )}
            {!loaded && <p className="text-gray-400 text-sm">로딩 중...</p>}
            {participants.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between gap-2 text-sm border rounded px-3 py-2 flex-wrap"
              >
                <span className="flex-1 min-w-0">
                  {p.users?.village} · {p.users?.name}
                  <span className={`ml-2 text-xs ${p.status === 'selected' ? 'text-green-600' : p.status === 'rejected' ? 'text-red-500' : 'text-gray-400'}`}>
                    ({p.status === 'selected' ? '선발' : p.status === 'rejected' ? '탈락' : '대기'})
                  </span>
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSelect(p.id, 'selected')}
                    className={`px-3 py-1.5 rounded text-xs ${p.status === 'selected' ? 'bg-green-600 text-white' : 'bg-gray-100 hover:bg-green-100'}`}
                  >
                    선발
                  </button>
                  <button
                    onClick={() => handleSelect(p.id, 'rejected')}
                    className={`px-3 py-1.5 rounded text-xs ${p.status === 'rejected' ? 'bg-red-600 text-white' : 'bg-gray-100 hover:bg-red-100'}`}
                  >
                    탈락
                  </button>
                </div>
              </div>
            ))}
          </div>
```

교체:

```tsx
          {!loaded && <p className="text-gray-400 text-sm">로딩 중...</p>}
          {loaded && participants.length === 0 && (
            <p className="text-gray-400 text-sm">신청자 없음</p>
          )}
          {loaded && participants.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {(['blue', 'white'] as const).map((team) => {
                const teamParticipants = participants.filter(
                  (p) =>
                    p.users?.village &&
                    VILLAGE_TEAM[p.users.village as Village] === team
                )
                return (
                  <div key={team}>
                    <div className={`text-xs font-semibold mb-2 ${team === 'blue' ? 'text-blue-600' : 'text-gray-500'}`}>
                      {team === 'blue' ? '청팀' : '백팀'} ({teamParticipants.length}명)
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {teamParticipants.map((p) => (
                        <div
                          key={p.id}
                          className="flex flex-col gap-1 text-sm border rounded px-2 py-1.5"
                        >
                          <span className="text-xs">
                            {p.users?.village} · {p.users?.name}
                            <span className={`ml-1 ${p.status === 'selected' ? 'text-green-600' : p.status === 'rejected' ? 'text-red-500' : 'text-gray-400'}`}>
                              ({p.status === 'selected' ? '선발' : p.status === 'rejected' ? '탈락' : '대기'})
                            </span>
                          </span>
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleSelect(p.id, 'selected')}
                              className={`flex-1 py-1 rounded text-xs ${p.status === 'selected' ? 'bg-green-600 text-white' : 'bg-gray-100 hover:bg-green-100'}`}
                            >
                              선발
                            </button>
                            <button
                              onClick={() => handleSelect(p.id, 'rejected')}
                              className={`flex-1 py-1 rounded text-xs ${p.status === 'rejected' ? 'bg-red-600 text-white' : 'bg-gray-100 hover:bg-red-100'}`}
                            >
                              탈락
                            </button>
                          </div>
                        </div>
                      ))}
                      {teamParticipants.length === 0 && (
                        <p className="text-xs text-gray-300">없음</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
```

- [ ] **Step 3: TypeScript 확인**

```bash
npx tsc --noEmit
```

오류 없어야 함.

- [ ] **Step 4: 커밋**

```bash
git add src/app/admin/AdminTabs.tsx
git commit -m "feat: split participants by team in admin section"
```

---

## 최종 확인

- [ ] **프로덕션 빌드 통과**

```bash
npm run build
```

오류 없이 완료되어야 함.

- [ ] **브라우저 검증 체크리스트**

1. 어드민 → 게임 관리 → active 게임: "1판 기록" 버튼 표시 확인
2. 청팀/백팀/무승부 선택 + 점수 입력 후 기록 → 판 배지 표시
3. 어드민 → 점수 관리: 판 기록 시 score_logs에 자동 반영 확인
4. 3판 기록 후 "판 추가" 버튼 사라짐 확인
5. `/games/{id}` → 신청자 섹션이 청팀/백팀 2열로 분리
6. 어드민 → 참여자 관리 → 게임 펼치기: 청팀/백팀 2열 표시 + 선발/탈락 버튼 정상 동작
