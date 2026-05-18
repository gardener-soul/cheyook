# 판별 승자 기록 & 참여자 팀 분리 Design Spec

**Date:** 2026-05-18
**Status:** Approved

---

## Goal

1. 게임당 최대 3판(가변)의 결과를 실시간으로 기록하고, 판별 승자에게 자동으로 점수를 부여한다.
2. 참여자 목록을 청팀 / 백팀으로 분리해 표시한다.

---

## 1. 데이터 모델

### 새 테이블: `game_rounds`

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

**관리자가 해야 할 일:** Supabase 대시보드 SQL 에디터에서 위 SQL을 실행.

### 기존 테이블 변경 없음

- `games.winner_team` — 게임 전체 승자 요약, 유지
- `games.points` — 게임 배점, `points_awarded` 기본값으로 사용
- `score_logs` — 판 결과 제출 시 자동 삽입 (round 1 → `reason: "1판 결과"`)

---

## 2. 백엔드

### 새 파일: `src/lib/db/rounds.ts`

```typescript
export type GameRound = {
  id: string
  game_id: string
  round_number: number
  winner_team: 'blue' | 'white' | 'draw'
  points_awarded: number
  created_at: string
}

listRounds(gameId: string): Promise<GameRound[]>
addRound(input: { game_id, round_number, winner_team, points_awarded }): Promise<GameRound>
```

### 새 API: `src/app/api/games/[id]/rounds/route.ts`

- `GET` — 해당 게임의 판 목록 반환
- `POST` — 판 결과 추가:
  1. `game_rounds`에 삽입
  2. `draw`가 아닌 경우 `score_logs`에 `{ team: winner_team, points: points_awarded, game_id, reason: "{round_number}판 결과" }` 자동 삽입

---

## 3. 어드민 UI — 판 기록

### 수정 파일: `src/components/admin/GameList.tsx`

- `active` 상태 게임 카드에 "판 추가" 버튼 추가
- 클릭 시 인라인 폼 토글:
  - 승자 선택: 청팀 / 백팀 / 무승부 버튼
  - 점수 입력: number input, 기본값 `game.points`
  - "기록" 버튼 → `POST /api/games/[id]/rounds`
- 기존 판 결과 표시: "1판 청팀 (+10점)", "2판 백팀 (+10점)" 형태
- 판 목록은 게임 카드 마운트 시 `GET /api/games/[id]/rounds` 로 로드

---

## 4. 참여자 팀 분리 UI

### 수정 파일 1: `src/app/games/[id]/page.tsx`

신청자 섹션을 청팀 / 백팀 두 컬럼으로 분리.
`VILLAGE_TEAM[p.users.village]` 로 팀 판별.

```
| 청팀 (N명)       | 백팀 (N명)       |
| 예앞·홍길동       | 바인·김철수       |
| ...              | ...              |
```

### 수정 파일 2: `src/app/admin/AdminTabs.tsx` — `ParticipantSection`

어드민 참여자 관리도 동일하게 청팀 / 백팀 컬럼 분리.
선발/탈락 버튼은 유지.

---

## 5. 변경 파일 목록

| 파일 | 작업 |
|------|------|
| Supabase SQL | `game_rounds` 테이블 생성 (관리자 직접 실행) |
| `src/lib/db/rounds.ts` | 신규 |
| `src/app/api/games/[id]/rounds/route.ts` | 신규 |
| `src/components/admin/GameList.tsx` | 수정 — 판 추가 UI |
| `src/app/games/[id]/page.tsx` | 수정 — 참여자 팀 분리 |
| `src/app/admin/AdminTabs.tsx` | 수정 — ParticipantSection 팀 분리 |

---

## 6. 관리자가 해야 할 일 (수동 작업)

Supabase 대시보드 → SQL Editor → 아래 쿼리 실행:

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
