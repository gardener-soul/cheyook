# 체육대회 운영 웹사이트 설계 문서

**작성일:** 2026-05-12  
**프로젝트:** cheyook  
**스택:** Next.js 16, TypeScript, Tailwind CSS v4, Supabase (DB + 세션)

---

## 1. 개요

마을 단위 체육대회를 웹에서 간편하게 운영하기 위한 플랫폼.  
청팀 vs 백팀의 점수 현황, 게임 진행 상태, 참여자 관리를 admin이 실시간으로 제어하고, 참가자는 게임에 자율 신청할 수 있다.

---

## 2. 사용자 및 권한

| 구분 | 조건 | 권한 |
|------|------|------|
| 일반 참가자 | 마을+이름으로 가입한 사용자 | 메인 화면 조회, 게임 참여 신청 |
| Admin | 이름이 `"admin"`인 사용자 | 위 모든 권한 + 게임 관리 + 점수 관리 + 참여자 선발 |

### 마을 목록 (8개)

`예앞`, `FC11`, `당근`, `바인`, `비쥬얼`, `하하`, `글라스`, `주먹`

### 팀 배정

- 각 마을의 청팀/백팀 분류는 추후 결정
- `users.team` 컬럼은 `null`로 시작하며, admin이 추후 배정
- 배정 전까지는 팀 표시 없이 점수만 집계

---

## 3. 인증 방식

- **비밀번호 없음** — 마을(드롭다운) + 이름(텍스트)으로만 가입/로그인
- 가입 시: `users` 테이블에 (name, village) INSERT, 중복이면 에러
- 로그인 시: (name, village) 조합으로 DB 조회, 일치하면 세션 발급
- 세션: 서명된 HttpOnly 쿠키에 `user_id` 저장
- 이름이 `"admin"`이면 `is_admin = true` 자동 설정

---

## 4. DB 스키마

### `users`

```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
name        text NOT NULL
village     text NOT NULL
team        text CHECK (team IN ('blue', 'white')) -- null 허용
is_admin    boolean NOT NULL DEFAULT false
created_at  timestamptz NOT NULL DEFAULT now()

UNIQUE (name, village)
```

### `games`

```sql
id                uuid PRIMARY KEY DEFAULT gen_random_uuid()
name              text NOT NULL
description       text
zone              text NOT NULL CHECK (zone IN ('full', 'zone_a', 'zone_b'))
max_participants  int  -- null이면 제한 없음
points            int  -- null이면 미정, 추후 admin이 설정
status            text NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'active', 'completed'))
order_index       int NOT NULL DEFAULT 0  -- 타임테이블 순서
winner_team       text CHECK (winner_team IN ('blue', 'white', 'draw'))
created_at        timestamptz NOT NULL DEFAULT now()
```

**zone 의미:**
- `full` — 메인 게임, 운동장 전체 사용
- `zone_a` — 서브 게임, 운동장 A구역 (절반)
- `zone_b` — 서브 게임, 운동장 B구역 (절반)

### `game_participants`

```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
game_id     uuid NOT NULL REFERENCES games(id) ON DELETE CASCADE
user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE
status      text NOT NULL DEFAULT 'registered'
            CHECK (status IN ('registered', 'selected', 'rejected'))
created_at  timestamptz NOT NULL DEFAULT now()

UNIQUE (game_id, user_id)
```

**status 의미:**
- `registered` — 신청 완료 (참가 제한 이하이거나 초과 대기 중)
- `selected` — admin이 최종 선발
- `rejected` — admin이 탈락 처리

### `score_logs`

```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
game_id     uuid REFERENCES games(id) ON DELETE SET NULL  -- null 허용 (수동 부여 시)
team        text NOT NULL CHECK (team IN ('blue', 'white'))
points      int NOT NULL
reason      text  -- 수동 점수 부여 시 사유
created_by  uuid NOT NULL REFERENCES users(id)
created_at  timestamptz NOT NULL DEFAULT now()
```

총점 계산:
```sql
SELECT team, SUM(points) AS total FROM score_logs GROUP BY team;
```

---

## 5. 페이지 구조

### 5-1. 공개 페이지

#### `/` — 메인 대시보드

- **청팀 vs 백팀 총점 스코어보드** (상단 강조 표시)
- **현재 진행 중인 게임** (status = 'active')
  - 구역별 표시: 운동장 전체 / A구역 / B구역
  - 게임명, 참여 인원, 참여 신청 버튼 (로그인 시)
- **타임테이블** — 전체 게임 목록 (order_index 순, status별 시각적 구분)
- 새로고침 시 데이터 갱신 (실시간 아님)

#### `/login`

- 마을 드롭다운 + 이름 입력
- 로그인 버튼 → POST `/api/auth/login`

#### `/register`

- 마을 드롭다운 + 이름 입력
- 가입 버튼 → POST `/api/auth/register`
- 중복(name+village) 시 에러 메시지

#### `/games/[id]` — 게임 상세

- 게임 설명, 구역, 배점, 참가 제한 인원
- 참여 신청 버튼 (로그인한 사용자, 미신청 시)
- 현재 신청자 목록 (이름, 마을 표시)
- 선발된 참여자 목록 (status = 'selected')

### 5-2. Admin 전용 페이지

#### `/admin` — 관리자 대시보드

**게임 관리 탭**
- 게임 생성 폼 (이름, 설명, 구역, 배점, 참가 제한, 순서)
- 게임 목록 테이블 (수정, 삭제, 상태 변경 버튼)
- 상태 변경: `pending → active → completed`
- 승자 팀 기록 (completed 시)

**점수 관리 탭**
- 현재 청/백팀 총점 표시
- 게임 결과 점수 자동 반영 현황 (score_logs 목록)
- 수동 점수 부여 폼 (팀 선택, 점수, 사유 입력)

**참여자 관리 탭**
- 게임별 신청자 목록
- 참가 제한 초과 시: 랜덤 선발 버튼 / 개별 수동 선발 버튼
- 선발/탈락 상태 변경

---

## 6. API 설계

| 메서드 | 경로 | 권한 | 설명 |
|--------|------|------|------|
| POST | `/api/auth/register` | 누구나 | 회원가입, 세션 쿠키 발급 |
| POST | `/api/auth/login` | 누구나 | 로그인, 세션 쿠키 발급 |
| POST | `/api/auth/logout` | 로그인 | 세션 쿠키 삭제 |
| GET | `/api/games` | 공개 | 게임 목록 (order_index ASC) |
| POST | `/api/games` | admin | 게임 생성 |
| PATCH | `/api/games/[id]` | admin | 게임 수정 / 상태 변경 / 승자 기록 — `status: completed` + `winner_team` 설정 시 `score_logs`에 해당 게임 배점 자동 INSERT |
| DELETE | `/api/games/[id]` | admin | 게임 삭제 |
| POST | `/api/games/[id]/join` | 로그인 | 게임 참여 신청 |
| DELETE | `/api/games/[id]/join` | 로그인 | 참여 신청 취소 |
| PATCH | `/api/games/[id]/participants` | admin | 참여자 선발 (랜덤/수동) |
| GET | `/api/scores` | 공개 | 청/백팀 총점 |
| POST | `/api/scores` | admin | 수동 점수 부여 |

### 세션 쿠키 스펙

- 이름: `cheyook_session`
- 값: `user_id`를 HMAC-SHA256으로 서명한 토큰
- 속성: `HttpOnly`, `SameSite=Lax`, `Path=/`
- 서명 키: 환경변수 `SESSION_SECRET`

### Middleware 보호 경로

- `/admin/**` → admin이 아니면 `/`로 리다이렉트
- `/api/admin/**` → admin이 아니면 401
- `/api/games/[id]/join` → 비로그인이면 401

---

## 7. 게임 진행 흐름

```
[Admin] 게임 생성 (status: pending)
    ↓
[참가자] 게임 상세에서 참여 신청 (game_participants: registered)
    ↓
[Admin] 참가 제한 초과 시 선발 (selected / rejected)
    ↓
[Admin] 게임 시작 (status: active) → 메인 대시보드에 노출
    ↓
[실제 게임 진행]
    ↓
[Admin] 게임 완료 + 승자 팀 기록 (status: completed, winner_team: blue/white/draw)
    ↓
[시스템] score_logs에 게임 배점 자동 INSERT (game_id 연결)
    ↓
[Admin] 필요 시 수동 점수 추가 부여 (game_id: null)
```

---

## 8. 환경변수

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...   # 서버사이드 DB 작업용
SESSION_SECRET=...              # 세션 쿠키 서명 키 (32자 이상 랜덤 문자열)
```

---

## 9. 미결 사항 (추후 결정)

| 항목 | 상태 |
|------|------|
| 각 마을의 청팀/백팀 배정 | 미정 — `users.team` 컬럼으로 추후 업데이트 |
| 게임 확정 목록 및 순서 | 미정 — admin이 웹에서 직접 등록 |
| 게임별 배점 | 미정 — `games.points` 컬럼으로 추후 설정 |
| 게임당 참가 인원 수 | 미정 — `games.max_participants`으로 설정 |
