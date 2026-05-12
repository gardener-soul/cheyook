# 체육대회 운영 웹사이트 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 마을 단위 체육대회를 위한 청팀/백팀 점수 관리, 게임 진행, 참여자 신청 기능을 갖춘 웹 플랫폼을 구축한다.

**Architecture:** Next.js 16 App Router + Supabase (DB only, Auth 미사용). 커스텀 HMAC-SHA256 세션 쿠키로 인증. 서버 컴포넌트에서 직접 DB 조회, API Route Handler로 뮤테이션 처리.

**Tech Stack:** Next.js 16.2.6, React 19, TypeScript, Tailwind CSS v4, Supabase JS v2, Node crypto (세션 서명)

---

## 파일 구조

```
src/
  middleware.ts                          ← 로그인 보호 (/admin 접근 제어)
  lib/
    constants.ts                         ← 마을 목록, 팀 색상 상수
    session.ts                           ← HMAC 쿠키 서명/검증
    auth.ts                              ← getSession, requireAdmin 헬퍼
    supabase/
      client.ts                          (기존)
      server.ts                          (기존 - 미사용)
      service.ts                         ← Service Role 클라이언트 (RLS 우회)
    db/
      users.ts                           ← users 테이블 쿼리
      games.ts                           ← games 테이블 쿼리
      participants.ts                    ← game_participants 테이블 쿼리
      scores.ts                          ← score_logs 테이블 쿼리
  app/
    layout.tsx                           ← 전역 레이아웃 + Navbar
    page.tsx                             ← 메인 대시보드
    globals.css                          ← 팀 색상 변수 추가
    login/page.tsx                       ← 로그인 페이지
    register/page.tsx                    ← 회원가입 페이지
    games/[id]/page.tsx                  ← 게임 상세 페이지
    admin/page.tsx                       ← 관리자 패널 (탭 구조)
    api/
      auth/register/route.ts
      auth/login/route.ts
      auth/logout/route.ts
      games/route.ts                     ← GET (목록), POST (생성)
      games/[id]/route.ts                ← PATCH (수정/상태변경), DELETE
      games/[id]/join/route.ts           ← POST (신청), DELETE (취소)
      games/[id]/participants/route.ts   ← PATCH (선발)
      scores/route.ts                    ← GET (총점), POST (수동 부여)
  components/
    Navbar.tsx
    ScoreBoard.tsx
    GameCard.tsx
    Timetable.tsx
    admin/
      GameForm.tsx
      GameList.tsx
      ParticipantManager.tsx
      ScoreManager.tsx
```

---

## Task 1: 환경변수 및 상수 설정

**Files:**
- Modify: `.env.local`
- Create: `src/lib/constants.ts`

- [ ] **Step 1: `.env.local`에 누락된 환경변수 추가**

```bash
# .env.local 현재 내용에 아래 두 줄 추가
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SESSION_SECRET=your-random-32-char-string-here
```

Supabase 대시보드 → Project Settings → API → `service_role` 키를 복사.
`SESSION_SECRET`은 아무 32자 이상 랜덤 문자열 (예: `openssl rand -base64 32`).

- [ ] **Step 2: constants.ts 작성**

```ts
// src/lib/constants.ts
export const VILLAGES = [
  '예앞', 'FC11', '당근', '바인', '비쥬얼', '하하', '글라스', '주먹',
] as const

export type Village = (typeof VILLAGES)[number]

export const TEAMS = {
  blue: { label: '청팀', color: 'blue' },
  white: { label: '백팀', color: 'gray' },
} as const

export type Team = 'blue' | 'white'

export const ZONES = {
  full: '운동장 전체',
  zone_a: '운동장 A구역',
  zone_b: '운동장 B구역',
} as const

export type Zone = keyof typeof ZONES

export const GAME_STATUSES = {
  pending: '대기중',
  active: '진행중',
  completed: '완료',
} as const

export const SESSION_COOKIE = 'cheyook_session'
```

- [ ] **Step 3: 커밋**

```bash
git add .env.local src/lib/constants.ts
git commit -m "feat: add constants and env vars"
```

---

## Task 2: Supabase DB 스키마 생성

**Files:** Supabase SQL 에디터에서 실행 (파일 없음)

- [ ] **Step 1: Supabase 대시보드 → SQL Editor에서 아래 SQL 실행**

```sql
-- users 테이블
CREATE TABLE users (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  village    text NOT NULL,
  team       text CHECK (team IN ('blue', 'white')),
  is_admin   boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (name, village)
);

-- games 테이블
CREATE TABLE games (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name             text NOT NULL,
  description      text,
  zone             text NOT NULL CHECK (zone IN ('full', 'zone_a', 'zone_b')),
  max_participants int,
  points           int,
  status           text NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'active', 'completed')),
  order_index      int NOT NULL DEFAULT 0,
  winner_team      text CHECK (winner_team IN ('blue', 'white', 'draw')),
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- game_participants 테이블
CREATE TABLE game_participants (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id    uuid NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status     text NOT NULL DEFAULT 'registered'
             CHECK (status IN ('registered', 'selected', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (game_id, user_id)
);

-- score_logs 테이블
CREATE TABLE score_logs (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id    uuid REFERENCES games(id) ON DELETE SET NULL,
  team       text NOT NULL CHECK (team IN ('blue', 'white')),
  points     int NOT NULL,
  reason     text,
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
```

- [ ] **Step 2: 테이블 생성 확인**

Supabase 대시보드 → Table Editor에서 4개 테이블(`users`, `games`, `game_participants`, `score_logs`) 확인.

- [ ] **Step 3: RLS 비활성화 (서비스 롤 키로 접근하므로 불필요)**

```sql
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE games DISABLE ROW LEVEL SECURITY;
ALTER TABLE game_participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE score_logs DISABLE ROW LEVEL SECURITY;
```

---

## Task 3: Supabase Service 클라이언트 + DB 쿼리 레이어

**Files:**
- Create: `src/lib/supabase/service.ts`
- Create: `src/lib/db/users.ts`
- Create: `src/lib/db/games.ts`
- Create: `src/lib/db/participants.ts`
- Create: `src/lib/db/scores.ts`

- [ ] **Step 1: service.ts 작성**

```ts
// src/lib/supabase/service.ts
import { createClient } from '@supabase/supabase-js'

export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
```

- [ ] **Step 2: users.ts 작성**

```ts
// src/lib/db/users.ts
import { createServiceClient } from '@/lib/supabase/service'

export type User = {
  id: string
  name: string
  village: string
  team: 'blue' | 'white' | null
  is_admin: boolean
  created_at: string
}

export async function findUser(name: string, village: string): Promise<User | null> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('name', name)
    .eq('village', village)
    .maybeSingle()
  return data
}

export async function createUser(name: string, village: string): Promise<User | null> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('users')
    .insert({ name, village, is_admin: name === 'admin' })
    .select()
    .single()
  return data
}

export async function getUserById(id: string): Promise<User | null> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  return data
}
```

- [ ] **Step 3: games.ts 작성**

```ts
// src/lib/db/games.ts
import { createServiceClient } from '@/lib/supabase/service'
import type { Zone } from '@/lib/constants'

export type Game = {
  id: string
  name: string
  description: string | null
  zone: Zone
  max_participants: number | null
  points: number | null
  status: 'pending' | 'active' | 'completed'
  order_index: number
  winner_team: 'blue' | 'white' | 'draw' | null
  created_at: string
}

export async function listGames(): Promise<Game[]> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('games')
    .select('*')
    .order('order_index', { ascending: true })
  return data ?? []
}

export async function getGameById(id: string): Promise<Game | null> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('games')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  return data
}

export async function createGame(input: {
  name: string
  description?: string
  zone: Zone
  max_participants?: number
  points?: number
  order_index: number
}): Promise<Game | null> {
  const supabase = createServiceClient()
  const { data } = await supabase.from('games').insert(input).select().single()
  return data
}

export async function updateGame(id: string, input: Partial<Omit<Game, 'id' | 'created_at'>>): Promise<Game | null> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('games')
    .update(input)
    .eq('id', id)
    .select()
    .single()
  return data
}

export async function deleteGame(id: string): Promise<void> {
  const supabase = createServiceClient()
  await supabase.from('games').delete().eq('id', id)
}
```

- [ ] **Step 4: participants.ts 작성**

```ts
// src/lib/db/participants.ts
import { createServiceClient } from '@/lib/supabase/service'

export type Participant = {
  id: string
  game_id: string
  user_id: string
  status: 'registered' | 'selected' | 'rejected'
  created_at: string
  users?: { name: string; village: string }
}

export async function getParticipants(gameId: string): Promise<Participant[]> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('game_participants')
    .select('*, users(name, village)')
    .eq('game_id', gameId)
    .order('created_at', { ascending: true })
  return data ?? []
}

export async function joinGame(gameId: string, userId: string): Promise<Participant | null> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('game_participants')
    .insert({ game_id: gameId, user_id: userId })
    .select()
    .single()
  return data
}

export async function leaveGame(gameId: string, userId: string): Promise<void> {
  const supabase = createServiceClient()
  await supabase
    .from('game_participants')
    .delete()
    .eq('game_id', gameId)
    .eq('user_id', userId)
}

export async function getParticipation(gameId: string, userId: string): Promise<Participant | null> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('game_participants')
    .select('*')
    .eq('game_id', gameId)
    .eq('user_id', userId)
    .maybeSingle()
  return data
}

export async function updateParticipantStatus(
  id: string,
  status: 'registered' | 'selected' | 'rejected'
): Promise<void> {
  const supabase = createServiceClient()
  await supabase
    .from('game_participants')
    .update({ status })
    .eq('id', id)
}

export async function selectRandomParticipants(gameId: string, count: number): Promise<void> {
  const supabase = createServiceClient()
  const { data: all } = await supabase
    .from('game_participants')
    .select('id')
    .eq('game_id', gameId)

  if (!all) return

  const shuffled = [...all].sort(() => Math.random() - 0.5)
  const selected = shuffled.slice(0, count).map((p) => p.id)
  const rejected = shuffled.slice(count).map((p) => p.id)

  if (selected.length > 0) {
    await supabase
      .from('game_participants')
      .update({ status: 'selected' })
      .in('id', selected)
  }
  if (rejected.length > 0) {
    await supabase
      .from('game_participants')
      .update({ status: 'rejected' })
      .in('id', rejected)
  }
}
```

- [ ] **Step 5: scores.ts 작성**

```ts
// src/lib/db/scores.ts
import { createServiceClient } from '@/lib/supabase/service'

export type ScoreLog = {
  id: string
  game_id: string | null
  team: 'blue' | 'white'
  points: number
  reason: string | null
  created_by: string
  created_at: string
}

export type TeamScores = { blue: number; white: number }

export async function getTeamScores(): Promise<TeamScores> {
  const supabase = createServiceClient()
  const { data } = await supabase.from('score_logs').select('team, points')
  if (!data) return { blue: 0, white: 0 }
  return data.reduce(
    (acc, row) => {
      acc[row.team as 'blue' | 'white'] += row.points
      return acc
    },
    { blue: 0, white: 0 }
  )
}

export async function listScoreLogs(): Promise<ScoreLog[]> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('score_logs')
    .select('*')
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function addScore(input: {
  team: 'blue' | 'white'
  points: number
  reason?: string
  created_by: string
  game_id?: string
}): Promise<void> {
  const supabase = createServiceClient()
  await supabase.from('score_logs').insert(input)
}
```

- [ ] **Step 6: 커밋**

```bash
git add src/lib/supabase/service.ts src/lib/db/
git commit -m "feat: add service client and db query layer"
```

---

## Task 4: 세션 유틸리티 + Auth 헬퍼

**Files:**
- Create: `src/lib/session.ts`
- Create: `src/lib/auth.ts`

- [ ] **Step 1: session.ts 작성**

```ts
// src/lib/session.ts
import { createHmac } from 'crypto'
import { SESSION_COOKIE } from '@/lib/constants'

function getSecret(): string {
  const secret = process.env.SESSION_SECRET
  if (!secret) throw new Error('SESSION_SECRET is not set')
  return secret
}

export function signToken(userId: string): string {
  const sig = createHmac('sha256', getSecret()).update(userId).digest('hex')
  return `${userId}.${sig}`
}

export function verifyToken(token: string): string | null {
  const dotIndex = token.lastIndexOf('.')
  if (dotIndex === -1) return null
  const userId = token.slice(0, dotIndex)
  const sig = token.slice(dotIndex + 1)
  const expected = createHmac('sha256', getSecret()).update(userId).digest('hex')
  if (sig !== expected) return null
  return userId
}

export { SESSION_COOKIE }
```

- [ ] **Step 2: auth.ts 작성**

```ts
// src/lib/auth.ts
import { cookies } from 'next/headers'
import { verifyToken, SESSION_COOKIE } from '@/lib/session'
import { getUserById, type User } from '@/lib/db/users'

export async function getSession(): Promise<User | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return null
  const userId = verifyToken(token)
  if (!userId) return null
  return getUserById(userId)
}

export async function requireAdmin(): Promise<User | null> {
  const user = await getSession()
  if (!user?.is_admin) return null
  return user
}
```

- [ ] **Step 3: 커밋**

```bash
git add src/lib/session.ts src/lib/auth.ts
git commit -m "feat: add session signing and auth helpers"
```

---

## Task 5: Middleware (라우트 보호)

**Files:**
- Create: `src/middleware.ts`

- [ ] **Step 1: middleware.ts 작성**

```ts
// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, SESSION_COOKIE } from '@/lib/session'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/admin')) {
    const token = request.cookies.get(SESSION_COOKIE)?.value
    if (!token || !verifyToken(token)) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
```

- [ ] **Step 2: 커밋**

```bash
git add src/middleware.ts
git commit -m "feat: add middleware for admin route protection"
```

---

## Task 6: Auth API Routes

**Files:**
- Create: `src/app/api/auth/register/route.ts`
- Create: `src/app/api/auth/login/route.ts`
- Create: `src/app/api/auth/logout/route.ts`

- [ ] **Step 1: register/route.ts 작성**

```ts
// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createUser, findUser } from '@/lib/db/users'
import { signToken, SESSION_COOKIE } from '@/lib/session'
import { VILLAGES } from '@/lib/constants'

export async function POST(request: NextRequest) {
  const { name, village } = await request.json()

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return NextResponse.json({ error: '이름을 입력해주세요.' }, { status: 400 })
  }
  if (!VILLAGES.includes(village)) {
    return NextResponse.json({ error: '올바른 마을을 선택해주세요.' }, { status: 400 })
  }

  const trimmedName = name.trim()
  const existing = await findUser(trimmedName, village)
  if (existing) {
    return NextResponse.json({ error: '이미 가입된 이름입니다.' }, { status: 409 })
  }

  const user = await createUser(trimmedName, village)
  if (!user) {
    return NextResponse.json({ error: '가입에 실패했습니다.' }, { status: 500 })
  }

  const token = signToken(user.id)
  const response = NextResponse.json({ ok: true })
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7일
  })
  return response
}
```

- [ ] **Step 2: login/route.ts 작성**

```ts
// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { findUser } from '@/lib/db/users'
import { signToken, SESSION_COOKIE } from '@/lib/session'
import { VILLAGES } from '@/lib/constants'

export async function POST(request: NextRequest) {
  const { name, village } = await request.json()

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return NextResponse.json({ error: '이름을 입력해주세요.' }, { status: 400 })
  }
  if (!VILLAGES.includes(village)) {
    return NextResponse.json({ error: '올바른 마을을 선택해주세요.' }, { status: 400 })
  }

  const user = await findUser(name.trim(), village)
  if (!user) {
    return NextResponse.json({ error: '가입된 정보가 없습니다.' }, { status: 401 })
  }

  const token = signToken(user.id)
  const response = NextResponse.json({ ok: true, isAdmin: user.is_admin })
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })
  return response
}
```

- [ ] **Step 3: logout/route.ts 작성**

```ts
// src/app/api/auth/logout/route.ts
import { NextResponse } from 'next/server'
import { SESSION_COOKIE } from '@/lib/session'

export async function POST() {
  const response = NextResponse.json({ ok: true })
  response.cookies.delete(SESSION_COOKIE)
  return response
}
```

- [ ] **Step 4: 동작 확인 (curl)**

```bash
# 회원가입
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"테스터","village":"당근"}' \
  -c /tmp/cookie.txt -v

# 로그인
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"name":"테스터","village":"당근"}' \
  -c /tmp/cookie.txt -v
```

응답에 `Set-Cookie: cheyook_session=...` 헤더가 있으면 정상.

- [ ] **Step 5: 커밋**

```bash
git add src/app/api/auth/
git commit -m "feat: add register, login, logout API routes"
```

---

## Task 7: Games API Routes

**Files:**
- Create: `src/app/api/games/route.ts`
- Create: `src/app/api/games/[id]/route.ts`

- [ ] **Step 1: games/route.ts 작성**

```ts
// src/app/api/games/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { listGames, createGame } from '@/lib/db/games'
import { requireAdmin } from '@/lib/auth'

export async function GET() {
  const games = await listGames()
  return NextResponse.json(games)
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: '권한 없음' }, { status: 403 })

  const body = await request.json()
  const { name, description, zone, max_participants, points, order_index } = body

  if (!name || !zone) {
    return NextResponse.json({ error: '이름과 구역은 필수입니다.' }, { status: 400 })
  }

  const game = await createGame({
    name,
    description,
    zone,
    max_participants: max_participants ?? null,
    points: points ?? null,
    order_index: order_index ?? 0,
  })

  return NextResponse.json(game, { status: 201 })
}
```

- [ ] **Step 2: games/[id]/route.ts 작성**

```ts
// src/app/api/games/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getGameById, updateGame, deleteGame } from '@/lib/db/games'
import { addScore } from '@/lib/db/scores'
import { requireAdmin } from '@/lib/auth'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: '권한 없음' }, { status: 403 })

  const { id } = await params
  const body = await request.json()

  const game = await updateGame(id, body)
  if (!game) return NextResponse.json({ error: '게임 없음' }, { status: 404 })

  // 게임 완료 + 승자 기록 시 점수 자동 부여
  if (body.status === 'completed' && body.winner_team && body.winner_team !== 'draw' && game.points) {
    await addScore({
      team: body.winner_team,
      points: game.points,
      game_id: id,
      created_by: admin.id,
    })
  }

  return NextResponse.json(game)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: '권한 없음' }, { status: 403 })

  const { id } = await params
  await deleteGame(id)
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 3: 커밋**

```bash
git add src/app/api/games/
git commit -m "feat: add games CRUD API routes"
```

---

## Task 8: Join & Participants API Routes

**Files:**
- Create: `src/app/api/games/[id]/join/route.ts`
- Create: `src/app/api/games/[id]/participants/route.ts`

- [ ] **Step 1: join/route.ts 작성**

```ts
// src/app/api/games/[id]/join/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { joinGame, leaveGame, getParticipation } from '@/lib/db/participants'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: '로그인 필요' }, { status: 401 })

  const { id: gameId } = await params

  const existing = await getParticipation(gameId, user.id)
  if (existing) {
    return NextResponse.json({ error: '이미 신청했습니다.' }, { status: 409 })
  }

  const participant = await joinGame(gameId, user.id)
  return NextResponse.json(participant, { status: 201 })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: '로그인 필요' }, { status: 401 })

  const { id: gameId } = await params
  await leaveGame(gameId, user.id)
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: participants/route.ts 작성**

```ts
// src/app/api/games/[id]/participants/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import {
  updateParticipantStatus,
  selectRandomParticipants,
  getParticipants,
} from '@/lib/db/participants'
import { getGameById } from '@/lib/db/games'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: '권한 없음' }, { status: 403 })

  const { id: gameId } = await params
  const body = await request.json()

  // 랜덤 선발: { action: 'random' }
  if (body.action === 'random') {
    const game = await getGameById(gameId)
    if (!game?.max_participants) {
      return NextResponse.json({ error: '참가 제한 인원이 설정되지 않았습니다.' }, { status: 400 })
    }
    await selectRandomParticipants(gameId, game.max_participants)
    const updated = await getParticipants(gameId)
    return NextResponse.json(updated)
  }

  // 개별 상태 변경: { participantId: string, status: 'selected' | 'rejected' }
  if (body.participantId && body.status) {
    await updateParticipantStatus(body.participantId, body.status)
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: '잘못된 요청' }, { status: 400 })
}
```

- [ ] **Step 3: 커밋**

```bash
git add src/app/api/games/[id]/join/ src/app/api/games/[id]/participants/
git commit -m "feat: add game join and participant selection API routes"
```

---

## Task 9: Scores API Route

**Files:**
- Create: `src/app/api/scores/route.ts`

- [ ] **Step 1: scores/route.ts 작성**

```ts
// src/app/api/scores/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getTeamScores, addScore } from '@/lib/db/scores'
import { requireAdmin } from '@/lib/auth'

export async function GET() {
  const scores = await getTeamScores()
  return NextResponse.json(scores)
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: '권한 없음' }, { status: 403 })

  const { team, points, reason } = await request.json()

  if (!team || !['blue', 'white'].includes(team)) {
    return NextResponse.json({ error: '팀을 선택해주세요.' }, { status: 400 })
  }
  if (!points || typeof points !== 'number') {
    return NextResponse.json({ error: '점수를 입력해주세요.' }, { status: 400 })
  }

  await addScore({ team, points, reason, created_by: admin.id })
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: 커밋**

```bash
git add src/app/api/scores/
git commit -m "feat: add scores API route"
```

---

## Task 10: 공통 컴포넌트 + 레이아웃

**Files:**
- Create: `src/components/Navbar.tsx`
- Create: `src/components/ScoreBoard.tsx`
- Create: `src/components/GameCard.tsx`
- Create: `src/components/Timetable.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: globals.css에 팀 색상 변수 추가**

```css
/* src/app/globals.css - 기존 내용 맨 아래에 추가 */
@layer base {
  :root {
    --blue-team: #2563eb;
    --white-team: #6b7280;
  }
}
```

- [ ] **Step 2: Navbar.tsx 작성**

```tsx
// src/components/Navbar.tsx
import Link from 'next/link'
import { getSession } from '@/lib/auth'

export default async function Navbar() {
  const user = await getSession()

  return (
    <nav className="bg-white border-b px-4 py-3 flex items-center justify-between">
      <Link href="/" className="font-bold text-lg">🏃 체육대회</Link>
      <div className="flex gap-3 items-center text-sm">
        {user ? (
          <>
            <span className="text-gray-600">{user.village} · {user.name}</span>
            {user.is_admin && (
              <Link href="/admin" className="text-blue-600 font-medium">관리자</Link>
            )}
            <form action="/api/auth/logout" method="POST">
              <button type="submit" className="text-gray-500 hover:text-gray-800">로그아웃</button>
            </form>
          </>
        ) : (
          <>
            <Link href="/login" className="text-gray-600">로그인</Link>
            <Link href="/register" className="bg-blue-600 text-white px-3 py-1 rounded">가입</Link>
          </>
        )}
      </div>
    </nav>
  )
}
```

- [ ] **Step 3: ScoreBoard.tsx 작성**

```tsx
// src/components/ScoreBoard.tsx
import type { TeamScores } from '@/lib/db/scores'

export default function ScoreBoard({ scores }: { scores: TeamScores }) {
  return (
    <div className="flex gap-4 justify-center">
      <div className="flex-1 bg-blue-50 border-2 border-blue-400 rounded-xl p-6 text-center">
        <div className="text-blue-600 font-bold text-xl mb-2">청팀</div>
        <div className="text-5xl font-black text-blue-700">{scores.blue}</div>
        <div className="text-gray-500 text-sm mt-1">점</div>
      </div>
      <div className="flex items-center text-3xl font-bold text-gray-400">VS</div>
      <div className="flex-1 bg-gray-50 border-2 border-gray-400 rounded-xl p-6 text-center">
        <div className="text-gray-600 font-bold text-xl mb-2">백팀</div>
        <div className="text-5xl font-black text-gray-700">{scores.white}</div>
        <div className="text-gray-500 text-sm mt-1">점</div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: GameCard.tsx 작성**

```tsx
// src/components/GameCard.tsx
import Link from 'next/link'
import type { Game } from '@/lib/db/games'
import { ZONES, GAME_STATUSES } from '@/lib/constants'

const statusColors = {
  pending: 'bg-gray-100 text-gray-600',
  active: 'bg-green-100 text-green-700',
  completed: 'bg-blue-100 text-blue-700',
}

export default function GameCard({ game }: { game: Game }) {
  return (
    <Link href={`/games/${game.id}`}>
      <div className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
        <div className="flex items-start justify-between gap-2">
          <span className="font-semibold">{game.name}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[game.status]}`}>
            {GAME_STATUSES[game.status]}
          </span>
        </div>
        <div className="text-sm text-gray-500 mt-1">{ZONES[game.zone]}</div>
        {game.points != null && (
          <div className="text-xs text-gray-400 mt-1">배점: {game.points}점</div>
        )}
      </div>
    </Link>
  )
}
```

- [ ] **Step 5: Timetable.tsx 작성**

```tsx
// src/components/Timetable.tsx
import type { Game } from '@/lib/db/games'
import GameCard from './GameCard'

export default function Timetable({ games }: { games: Game[] }) {
  if (games.length === 0) {
    return <p className="text-center text-gray-400 py-8">등록된 게임이 없습니다.</p>
  }
  return (
    <div className="flex flex-col gap-3">
      {games.map((game) => (
        <GameCard key={game.id} game={game} />
      ))}
    </div>
  )
}
```

- [ ] **Step 6: layout.tsx 수정 (Navbar 추가)**

```tsx
// src/app/layout.tsx
import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans' })

export const metadata: Metadata = {
  title: '체육대회',
  description: '마을 체육대회 운영 플랫폼',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-gray-50">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-6 max-w-2xl">
          {children}
        </main>
      </body>
    </html>
  )
}
```

- [ ] **Step 7: 커밋**

```bash
git add src/components/ src/app/layout.tsx src/app/globals.css
git commit -m "feat: add navbar, scoreboard, game card, timetable components"
```

---

## Task 11: 로그인 & 회원가입 페이지

**Files:**
- Create: `src/app/login/page.tsx`
- Create: `src/app/register/page.tsx`

- [ ] **Step 1: login/page.tsx 작성**

```tsx
// src/app/login/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { VILLAGES } from '@/lib/constants'

export default function LoginPage() {
  const router = useRouter()
  const [village, setVillage] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, village }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) {
      setError(data.error)
      return
    }
    router.push(data.isAdmin ? '/admin' : '/')
    router.refresh()
  }

  return (
    <div className="max-w-sm mx-auto mt-12">
      <h1 className="text-2xl font-bold mb-6 text-center">로그인</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 bg-white p-6 rounded-xl shadow-sm">
        <div>
          <label className="block text-sm font-medium mb-1">마을</label>
          <select
            value={village}
            onChange={(e) => setVillage(e.target.value)}
            required
            className="w-full border rounded-lg px-3 py-2"
          >
            <option value="">마을 선택</option>
            {VILLAGES.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">이름</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="이름 입력"
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? '로그인 중...' : '로그인'}
        </button>
        <p className="text-center text-sm text-gray-500">
          처음이세요? <Link href="/register" className="text-blue-600">가입하기</Link>
        </p>
      </form>
    </div>
  )
}
```

- [ ] **Step 2: register/page.tsx 작성**

```tsx
// src/app/register/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { VILLAGES } from '@/lib/constants'

export default function RegisterPage() {
  const router = useRouter()
  const [village, setVillage] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, village }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) {
      setError(data.error)
      return
    }
    router.push('/')
    router.refresh()
  }

  return (
    <div className="max-w-sm mx-auto mt-12">
      <h1 className="text-2xl font-bold mb-6 text-center">가입하기</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 bg-white p-6 rounded-xl shadow-sm">
        <div>
          <label className="block text-sm font-medium mb-1">마을</label>
          <select
            value={village}
            onChange={(e) => setVillage(e.target.value)}
            required
            className="w-full border rounded-lg px-3 py-2"
          >
            <option value="">마을 선택</option>
            {VILLAGES.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">이름</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="이름 입력"
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? '가입 중...' : '가입하기'}
        </button>
        <p className="text-center text-sm text-gray-500">
          이미 가입했나요? <Link href="/login" className="text-blue-600">로그인</Link>
        </p>
      </form>
    </div>
  )
}
```

- [ ] **Step 3: `next dev` 실행 후 브라우저 확인**

```bash
npm run dev
```

- `http://localhost:3000/register` → 마을 드롭다운 + 이름 입력 → 가입 확인
- `http://localhost:3000/login` → 로그인 확인
- Supabase 대시보드 Table Editor → users 테이블에 새 행 생성 확인

- [ ] **Step 4: 커밋**

```bash
git add src/app/login/ src/app/register/
git commit -m "feat: add login and register pages"
```

---

## Task 12: 메인 대시보드 페이지

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: page.tsx 작성**

```tsx
// src/app/page.tsx
import { listGames } from '@/lib/db/games'
import { getTeamScores } from '@/lib/db/scores'
import ScoreBoard from '@/components/ScoreBoard'
import Timetable from '@/components/Timetable'
import { ZONES } from '@/lib/constants'

export default async function HomePage() {
  const [games, scores] = await Promise.all([listGames(), getTeamScores()])

  const activeGames = games.filter((g) => g.status === 'active')
  const activeByZone = {
    full: activeGames.filter((g) => g.zone === 'full'),
    zone_a: activeGames.filter((g) => g.zone === 'zone_a'),
    zone_b: activeGames.filter((g) => g.zone === 'zone_b'),
  }

  return (
    <div className="flex flex-col gap-8">
      {/* 스코어보드 */}
      <section>
        <h2 className="text-lg font-bold mb-3 text-center">팀 점수</h2>
        <ScoreBoard scores={scores} />
      </section>

      {/* 현재 진행 중인 게임 */}
      {activeGames.length > 0 && (
        <section>
          <h2 className="text-lg font-bold mb-3">🔥 현재 진행 중</h2>
          {(['full', 'zone_a', 'zone_b'] as const).map((zone) =>
            activeByZone[zone].length > 0 ? (
              <div key={zone} className="mb-4">
                <h3 className="text-sm font-medium text-gray-500 mb-2">{ZONES[zone]}</h3>
                <div className="flex flex-col gap-2">
                  {activeByZone[zone].map((game) => (
                    <div
                      key={game.id}
                      className="bg-green-50 border border-green-300 rounded-lg p-4"
                    >
                      <span className="font-semibold">{game.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null
          )}
        </section>
      )}

      {/* 타임테이블 */}
      <section>
        <h2 className="text-lg font-bold mb-3">📋 게임 목록</h2>
        <Timetable games={games} />
      </section>
    </div>
  )
}
```

- [ ] **Step 2: 브라우저 확인**

`http://localhost:3000` → 스코어보드(0 vs 0), 게임 목록 렌더링 확인.

- [ ] **Step 3: 커밋**

```bash
git add src/app/page.tsx
git commit -m "feat: add main dashboard page"
```

---

## Task 13: 게임 상세 페이지

**Files:**
- Create: `src/app/games/[id]/page.tsx`

- [ ] **Step 1: games/[id]/page.tsx 작성**

```tsx
// src/app/games/[id]/page.tsx
import { notFound } from 'next/navigation'
import { getGameById } from '@/lib/db/games'
import { getParticipants, getParticipation } from '@/lib/db/participants'
import { getSession } from '@/lib/auth'
import { ZONES, GAME_STATUSES } from '@/lib/constants'
import JoinButton from './JoinButton'

export default async function GameDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [game, user] = await Promise.all([getGameById(id), getSession()])

  if (!game) notFound()

  const participants = await getParticipants(id)
  const myParticipation = user ? await getParticipation(id, user.id) : null

  const selected = participants.filter((p) => p.status === 'selected')
  const registered = participants.filter((p) => p.status === 'registered')

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold">{game.name}</h1>
          <span className="text-sm bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
            {GAME_STATUSES[game.status]}
          </span>
        </div>
        <div className="text-gray-500 text-sm">{ZONES[game.zone]}</div>
        {game.description && <p className="mt-3 text-gray-700">{game.description}</p>}
        <div className="flex gap-4 mt-3 text-sm text-gray-500">
          {game.points != null && <span>배점: {game.points}점</span>}
          {game.max_participants != null && (
            <span>참가 제한: {game.max_participants}명</span>
          )}
        </div>
      </div>

      {/* 참여 신청 버튼 */}
      {user && game.status === 'pending' && (
        <JoinButton gameId={id} participation={myParticipation} />
      )}
      {!user && game.status === 'pending' && (
        <p className="text-sm text-gray-500">
          참여 신청하려면 <a href="/login" className="text-blue-600">로그인</a>하세요.
        </p>
      )}

      {/* 선발된 참여자 */}
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

      {/* 신청자 목록 */}
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
    </div>
  )
}
```

- [ ] **Step 2: JoinButton 클라이언트 컴포넌트 작성**

```tsx
// src/app/games/[id]/JoinButton.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Participant } from '@/lib/db/participants'

export default function JoinButton({
  gameId,
  participation,
}: {
  gameId: string
  participation: Participant | null
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const joined = !!participation

  async function handleClick() {
    setLoading(true)
    await fetch(`/api/games/${gameId}/join`, {
      method: joined ? 'DELETE' : 'POST',
    })
    setLoading(false)
    router.refresh()
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`py-2 px-6 rounded-lg font-medium disabled:opacity-50 ${
        joined
          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          : 'bg-blue-600 text-white hover:bg-blue-700'
      }`}
    >
      {loading ? '처리 중...' : joined ? '신청 취소' : '참여 신청'}
    </button>
  )
}
```

- [ ] **Step 3: 브라우저 확인**

1. admin으로 `/api/games`에 테스트 게임 생성
2. `http://localhost:3000/games/{id}` → 게임 상세 렌더링 확인
3. 로그인 후 참여 신청 → 신청자 목록에 추가 확인

- [ ] **Step 4: 커밋**

```bash
git add src/app/games/
git commit -m "feat: add game detail page with join functionality"
```

---

## Task 14: Admin 페이지

**Files:**
- Create: `src/app/admin/page.tsx`
- Create: `src/components/admin/GameForm.tsx`
- Create: `src/components/admin/GameList.tsx`
- Create: `src/components/admin/ParticipantManager.tsx`
- Create: `src/components/admin/ScoreManager.tsx`

- [ ] **Step 1: admin/page.tsx 작성 (탭 구조 + admin 권한 체크)**

```tsx
// src/app/admin/page.tsx
import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/auth'
import { listGames } from '@/lib/db/games'
import { getTeamScores, listScoreLogs } from '@/lib/db/scores'
import AdminTabs from './AdminTabs'

export default async function AdminPage() {
  const admin = await requireAdmin()
  if (!admin) redirect('/')

  const [games, scores, scoreLogs] = await Promise.all([
    listGames(),
    getTeamScores(),
    listScoreLogs(),
  ])

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">관리자 패널</h1>
      <AdminTabs games={games} scores={scores} scoreLogs={scoreLogs} adminId={admin.id} />
    </div>
  )
}
```

- [ ] **Step 2: AdminTabs 클라이언트 컴포넌트 작성**

```tsx
// src/app/admin/AdminTabs.tsx
'use client'

import { useState, useEffect } from 'react'
import type { Game } from '@/lib/db/games'
import type { Participant } from '@/lib/db/participants'
import type { TeamScores, ScoreLog } from '@/lib/db/scores'
import GameForm from '@/components/admin/GameForm'
import GameList from '@/components/admin/GameList'
import ScoreManager from '@/components/admin/ScoreManager'

export default function AdminTabs({
  games,
  scores,
  scoreLogs,
  adminId,
}: {
  games: Game[]
  scores: TeamScores
  scoreLogs: ScoreLog[]
  adminId: string
}) {
  const [tab, setTab] = useState<'games' | 'scores' | 'participants'>('games')

  return (
    <div>
      <div className="flex gap-2 mb-6 border-b">
        {(['games', 'scores', 'participants'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'
            }`}
          >
            {t === 'games' ? '게임 관리' : t === 'scores' ? '점수 관리' : '참여자 관리'}
          </button>
        ))}
      </div>

      {tab === 'games' && (
        <div className="flex flex-col gap-6">
          <GameForm />
          <GameList games={games} />
        </div>
      )}
      {tab === 'scores' && (
        <ScoreManager scores={scores} scoreLogs={scoreLogs} adminId={adminId} />
      )}
      {tab === 'participants' && (
        <div className="flex flex-col gap-4">
          {games.map((game) => (
            <ParticipantManagerWrapper key={game.id} game={game} />
          ))}
        </div>
      )}
    </div>
  )
}

function ParticipantManagerWrapper({ game }: { game: Game }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border rounded-lg">
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left px-4 py-3 font-medium flex justify-between"
      >
        <span>{game.name}</span>
        <span className="text-gray-400">{open ? '▲' : '▼'}</span>
      </button>
      {open && <ParticipantManagerClient gameId={game.id} maxParticipants={game.max_participants} />}
    </div>
  )
}

function ParticipantManagerClient({
  gameId,
  maxParticipants,
}: {
  gameId: string
  maxParticipants: number | null
}) {
  const [participants, setParticipants] = useState<Participant[]>([])

  useEffect(() => {
    fetch(`/api/games/${gameId}/participants-list`)
      .then((r) => r.json())
      .then(setParticipants)
  }, [gameId])

  async function handleRandom() {
    const res = await fetch(`/api/games/${gameId}/participants`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'random' }),
    })
    const data = await res.json()
    setParticipants(data)
  }

  async function handleSelect(participantId: string, status: 'selected' | 'rejected') {
    await fetch(`/api/games/${gameId}/participants`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participantId, status }),
    })
    setParticipants((prev) => prev.map((p) => p.id === participantId ? { ...p, status } : p))
  }

  return (
    <div className="px-4 pb-4">
      <div className="flex gap-2 mb-3">
        {maxParticipants && (
          <button
            onClick={handleRandom}
            className="text-sm bg-purple-600 text-white px-3 py-1 rounded"
          >
            랜덤 {maxParticipants}명 선발
          </button>
        )}
      </div>
      <div className="flex flex-col gap-2">
        {participants.map((p) => (
          <div key={p.id} className="flex items-center justify-between text-sm border rounded px-3 py-2">
            <span>{p.users?.village} · {p.users?.name}</span>
            <div className="flex gap-2">
              <button
                onClick={() => handleSelect(p.id, 'selected')}
                className={`px-2 py-0.5 rounded text-xs ${p.status === 'selected' ? 'bg-green-600 text-white' : 'bg-gray-100'}`}
              >
                선발
              </button>
              <button
                onClick={() => handleSelect(p.id, 'rejected')}
                className={`px-2 py-0.5 rounded text-xs ${p.status === 'rejected' ? 'bg-red-600 text-white' : 'bg-gray-100'}`}
              >
                탈락
              </button>
            </div>
          </div>
        ))}
        {participants.length === 0 && <p className="text-gray-400 text-sm">신청자 없음</p>}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: GameForm.tsx 작성**

```tsx
// src/components/admin/GameForm.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { VILLAGES as _VILLAGES, ZONES } from '@/lib/constants'

export default function GameForm() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: '', description: '', zone: 'full', max_participants: '', points: '', order_index: '0',
  })
  const [loading, setLoading] = useState(false)

  function set(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await fetch('/api/games', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        description: form.description || undefined,
        zone: form.zone,
        max_participants: form.max_participants ? Number(form.max_participants) : undefined,
        points: form.points ? Number(form.points) : undefined,
        order_index: Number(form.order_index),
      }),
    })
    setLoading(false)
    setForm({ name: '', description: '', zone: 'full', max_participants: '', points: '', order_index: '0' })
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border rounded-xl p-4 flex flex-col gap-3">
      <h2 className="font-semibold">게임 추가</h2>
      <input value={form.name} onChange={(e) => set('name', e.target.value)} required placeholder="게임 이름" className="border rounded px-3 py-2 text-sm" />
      <textarea value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="게임 설명 (선택)" className="border rounded px-3 py-2 text-sm" rows={2} />
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-gray-500">구역</label>
          <select value={form.zone} onChange={(e) => set('zone', e.target.value)} className="w-full border rounded px-2 py-1.5 text-sm">
            {Object.entries(ZONES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500">순서</label>
          <input type="number" value={form.order_index} onChange={(e) => set('order_index', e.target.value)} className="w-full border rounded px-2 py-1.5 text-sm" />
        </div>
        <div>
          <label className="text-xs text-gray-500">배점 (점)</label>
          <input type="number" value={form.points} onChange={(e) => set('points', e.target.value)} placeholder="미정" className="w-full border rounded px-2 py-1.5 text-sm" />
        </div>
        <div>
          <label className="text-xs text-gray-500">참가 제한 (명)</label>
          <input type="number" value={form.max_participants} onChange={(e) => set('max_participants', e.target.value)} placeholder="제한 없음" className="w-full border rounded px-2 py-1.5 text-sm" />
        </div>
      </div>
      <button type="submit" disabled={loading} className="bg-blue-600 text-white py-2 rounded font-medium text-sm disabled:opacity-50">
        {loading ? '추가 중...' : '게임 추가'}
      </button>
    </form>
  )
}
```

- [ ] **Step 4: GameList.tsx 작성**

```tsx
// src/components/admin/GameList.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Game } from '@/lib/db/games'
import { ZONES, GAME_STATUSES } from '@/lib/constants'

const STATUS_NEXT: Record<string, { label: string; next: string }> = {
  pending: { label: '게임 시작', next: 'active' },
  active: { label: '게임 완료', next: 'completed' },
  completed: { label: '완료됨', next: '' },
}

export default function GameList({ games }: { games: Game[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  async function changeStatus(game: Game, nextStatus: string) {
    setLoading(game.id)
    let body: Record<string, unknown> = { status: nextStatus }
    if (nextStatus === 'completed') {
      const winner = window.prompt('승자 팀을 입력하세요: blue / white / draw')
      if (!winner) { setLoading(null); return }
      body = { status: 'completed', winner_team: winner }
    }
    await fetch(`/api/games/${game.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setLoading(null)
    router.refresh()
  }

  async function deleteGame(id: string) {
    if (!window.confirm('삭제할까요?')) return
    await fetch(`/api/games/${id}`, { method: 'DELETE' })
    router.refresh()
  }

  if (games.length === 0) {
    return <p className="text-gray-400 text-sm text-center py-4">등록된 게임 없음</p>
  }

  return (
    <div className="flex flex-col gap-2">
      {games.map((game) => {
        const next = STATUS_NEXT[game.status]
        return (
          <div key={game.id} className="bg-white border rounded-lg p-3 flex items-center justify-between gap-3">
            <div>
              <span className="font-medium text-sm">{game.name}</span>
              <span className="text-xs text-gray-400 ml-2">{ZONES[game.zone]}</span>
              <span className="text-xs text-gray-400 ml-2">{GAME_STATUSES[game.status]}</span>
            </div>
            <div className="flex gap-2">
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
                className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded"
              >
                삭제
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 5: ScoreManager.tsx 작성**

```tsx
// src/components/admin/ScoreManager.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { TeamScores, ScoreLog } from '@/lib/db/scores'

export default function ScoreManager({
  scores,
  scoreLogs,
  adminId: _adminId,
}: {
  scores: TeamScores
  scoreLogs: ScoreLog[]
  adminId: string
}) {
  const router = useRouter()
  const [team, setTeam] = useState<'blue' | 'white'>('blue')
  const [points, setPoints] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await fetch('/api/scores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ team, points: Number(points), reason }),
    })
    setLoading(false)
    setPoints('')
    setReason('')
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 현재 총점 */}
      <div className="flex gap-4">
        <div className="flex-1 bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <div className="text-blue-600 font-bold">청팀</div>
          <div className="text-3xl font-black text-blue-700">{scores.blue}</div>
        </div>
        <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
          <div className="text-gray-600 font-bold">백팀</div>
          <div className="text-3xl font-black text-gray-700">{scores.white}</div>
        </div>
      </div>

      {/* 수동 점수 부여 */}
      <form onSubmit={handleSubmit} className="bg-white border rounded-xl p-4 flex flex-col gap-3">
        <h2 className="font-semibold text-sm">수동 점수 부여</h2>
        <div className="flex gap-2">
          <button type="button" onClick={() => setTeam('blue')} className={`flex-1 py-2 rounded font-medium text-sm ${team === 'blue' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>청팀</button>
          <button type="button" onClick={() => setTeam('white')} className={`flex-1 py-2 rounded font-medium text-sm ${team === 'white' ? 'bg-gray-600 text-white' : 'bg-gray-100'}`}>백팀</button>
        </div>
        <input type="number" value={points} onChange={(e) => setPoints(e.target.value)} required placeholder="점수 (음수 가능)" className="border rounded px-3 py-2 text-sm" />
        <input type="text" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="사유 (선택)" className="border rounded px-3 py-2 text-sm" />
        <button type="submit" disabled={loading} className="bg-blue-600 text-white py-2 rounded font-medium text-sm disabled:opacity-50">
          {loading ? '처리 중...' : '점수 부여'}
        </button>
      </form>

      {/* 점수 기록 */}
      <div>
        <h2 className="font-semibold text-sm mb-2">점수 기록</h2>
        <div className="flex flex-col gap-2">
          {scoreLogs.map((log) => (
            <div key={log.id} className="flex items-center justify-between text-sm border rounded px-3 py-2 bg-white">
              <div>
                <span className={log.team === 'blue' ? 'text-blue-600 font-medium' : 'text-gray-600 font-medium'}>
                  {log.team === 'blue' ? '청팀' : '백팀'}
                </span>
                {log.reason && <span className="text-gray-400 ml-2">{log.reason}</span>}
              </div>
              <span className="font-bold">{log.points > 0 ? `+${log.points}` : log.points}점</span>
            </div>
          ))}
          {scoreLogs.length === 0 && <p className="text-gray-400 text-sm">점수 기록 없음</p>}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 6: 참여자 목록 조회 API 추가 (AdminTabs에서 사용)**

```ts
// src/app/api/games/[id]/participants-list/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { getParticipants } from '@/lib/db/participants'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: '권한 없음' }, { status: 403 })

  const { id: gameId } = await params
  const participants = await getParticipants(gameId)
  return NextResponse.json(participants)
}
```

- [ ] **Step 7: 전체 동작 확인**

```bash
npm run dev
```

1. `http://localhost:3000/register` → 이름 `admin`, 마을 `예앞`으로 가입
2. `http://localhost:3000/admin` → 게임 관리 탭에서 게임 추가
3. 게임 시작 버튼 → status `active` 확인
4. `/` → 스코어보드 및 진행 중 게임 표시 확인
5. 다른 계정 가입 후 게임 상세에서 참여 신청
6. admin → 참여자 관리 탭 → 선발/랜덤 선발 확인
7. 게임 완료 → `white`/`blue` 입력 → 점수 자동 부여 확인
8. 점수 관리 탭 → 수동 점수 부여 확인

- [ ] **Step 8: 최종 커밋**

```bash
git add src/app/admin/ src/components/admin/ src/app/api/games/
git commit -m "feat: add admin panel with game management, score management, participant selection"
```

---

## 완료 기준

- [ ] 회원가입/로그인/로그아웃 동작
- [ ] admin 가입 시 관리자 권한 부여 및 `/admin` 접근
- [ ] 비관리자는 `/admin` 접근 시 `/login`으로 리다이렉트
- [ ] 게임 생성/상태변경/삭제
- [ ] 게임 완료 시 해당 팀 점수 자동 기록
- [ ] 참여 신청/취소
- [ ] 참가 제한 초과 시 랜덤 또는 수동 선발
- [ ] 수동 점수 부여
- [ ] 메인 대시보드에 청/백 총점 + 진행 중 게임 표시
