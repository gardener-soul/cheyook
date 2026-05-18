# 체육대회 타임테이블 & 게임 UI 설계

**날짜:** 2026-05-18  
**범위:** 타임테이블 UI, 현재 진행중 게임 UI, 게임 상세 페이지, 신청/취소

---

## 배경 및 목표

체육대회 앱에 다음 세 가지 기능을 추가한다:

1. **타임테이블 UI** — 시간·구역별 일정을 시각적으로 보여주는 세로 타임라인
2. **현재 진행중 게임 UI** — 홈 페이지 Playground에서 active 게임을 클릭해 상세로 이동
3. **게임 상세 페이지 개선** — 인스타그램 영상 링크 버튼 + 줄바꿈 설명 렌더링

신청/취소(`JoinButton`)는 이미 동작하므로 UI 수정 없음.

---

## 아키텍처

### 변경 파일 목록

| 파일 | 작업 |
|------|------|
| `src/lib/timetable-config.ts` | 신규 — 하드코딩 타임테이블 데이터 |
| `src/components/Timetable.tsx` | 재작성 — 세로 타임라인 UI |
| `src/components/GamesPageTabs.tsx` | 수정 — 새 Timetable 컴포넌트 사용 |
| `src/app/games/[id]/page.tsx` | 수정 — 인스타 버튼, description 포맷 |
| `src/components/Playground.tsx` | 수정 — 게임명 Link 추가 |

DB 변경 없음. `instagram_url` 컬럼은 이전 세션에서 이미 추가됨.

---

## 1. `src/lib/timetable-config.ts`

타임테이블을 하드코딩한 정적 설정 파일. `order_index`로 DB 게임과 매핑한다.

### 슬롯 타입

```ts
type EventSlot = {
  type: 'event'
  time: string
  label: string
  duration?: string
}

type SingleGameSlot = {
  type: 'single'
  time: string
  orderIndex: number
  duration?: string
}

type DualGameSlot = {
  type: 'dual'
  time: string
  zoneA: number   // order_index
  zoneB: number   // order_index
  duration?: string
}

type TimetableSlot = EventSlot | SingleGameSlot | DualGameSlot
```

### 슬롯 데이터

| time  | type   | 내용                                    |
|-------|--------|-----------------------------------------|
| 4:30  | event  | 집결                                    |
| 4:35  | event  | 개회식 (5분)                            |
| 4:40  | event  | 준비운동 (5분)                          |
| 4:45  | dual   | A: order 1 (휴지), B: order 2 (꼬깔)  |
| 4:55  | dual   | A: order 3 (풍선), B: order 4 (안대)  |
| 5:05  | event  | 휴식 & 전환 (5분)                       |
| 5:10  | single | order 5 — 컵 전쟁 (10분)               |
| 5:20  | single | order 6 — 볼펜 지탱하기 (12분)         |
| 5:32  | single | order 7 — 장애물 계주 (15분)           |
| 5:47  | single | order 8 — 몸에 컵 쌓기 (8분)           |
| 5:55  | single | order 9 — 전략 줄다리기 (15분)         |
| 6:10  | single | order 10 — 피구 (20분)                 |
| 6:30  | single | order 11 — 이어달리기 계주 (5분)       |
| 6:35  | event  | 폐회/시상                               |

---

## 2. `src/components/Timetable.tsx` (재작성)

Props: `{ games: Game[] }`

내부에서 `TIMETABLE_SLOTS`를 import하고, `games`를 `order_index`로 인덱싱한 Map을 만들어 슬롯과 조합한다.

### 레이아웃 구조

```
세로 타임라인
│
├─ [4:30] 집결                          ← event 행: 회색 텍스트, 간결
├─ [4:35] 개회식                        ← event 행
├─ [4:40] 준비운동                      ← event 행
│
├─ [4:45] [구역A: 휴지 날리기]          ← dual 행: 2열 grid
│          [구역B: 꼬깔 빨대 넣기]
│
├─ [4:55] [구역A: 날라가는 풍선 잡기]   ← dual 행
│          [구역B: 눈 가리고 점수판]
│
├─ [5:05] 휴식 & 전환                   ← event 행
│
├─ [5:10] 컵 전쟁              ●진행중  ← single 행: status badge
├─ [5:20] 볼펜 지탱하기        ●대기중
...
└─ [6:35] 폐회/시상                     ← event 행
```

### 행별 스타일

- **event 행**: `text-gray-400`, 패딩 최소화, 클릭 불가
- **single/dual 게임 행 (pending)**: 흰 배경, 파란 테두리, `Link`로 `/games/{id}` 이동
- **single/dual 게임 행 (active)**: 초록 배경 (`bg-green-50 border-green-300`), 🔥 아이콘, 강조
- **single/dual 게임 행 (completed)**: 회색 배경, `text-gray-400`, 취소선

### dual 행 레이아웃

`grid grid-cols-2 gap-2`. 각 셀은 게임명 + 구역 레이블(A/B) 표시. 각각 독립 Link.

---

## 3. `src/components/GamesPageTabs.tsx` (수정)

타임테이블 탭에서 기존 인라인 map 코드를 제거하고 `<Timetable games={games} />`로 교체.

---

## 4. `src/app/games/[id]/page.tsx` (수정)

### 인스타그램 영상 버튼

`game.instagram_url`이 있을 때 다음 버튼을 게임 헤더 바로 아래에 렌더:

```
[▶ 영상으로 보기]   (새 탭 열기, target="_blank")
```

스타일: `bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg px-4 py-2 text-sm`

인스타 브랜드 색상 사용. 외부 링크이므로 `rel="noopener noreferrer"` 포함.

### description 포맷

현재 `<p>{game.description}</p>` → `<p className="whitespace-pre-line">{game.description}</p>`

시드 데이터의 `\n` 줄바꿈이 화면에 반영된다.

---

## 5. `src/components/Playground.tsx` (수정)

active 게임의 게임명을 `Link href={/games/${game.id}}`로 감싼다.

게임명 텍스트: `🔥 {game.name}` → 클릭하면 상세 페이지 이동.

active 게임이 없을 때 "대기중" 텍스트는 그대로 유지.

---

## 데이터 흐름

```
timetable-config.ts (정적)
        ↓
Timetable.tsx
  ← games: Game[] (from DB, /games/page.tsx에서 listGames())
  → order_index로 매핑
  → 각 게임 행: Link → /games/{id}

/games/{id}/page.tsx
  ← getGameById(id): game.instagram_url 포함
  → "영상으로 보기" 버튼 (외부 링크)
  → JoinButton (기존 그대로)

Playground.tsx
  ← activeGames (기존 그대로)
  → 게임명에 Link 추가
```

---

## 제약 사항

- 타임테이블 시간은 하드코딩. 행사가 한 번이므로 DB 관리 불필요.
- JoinButton 로직 변경 없음. 기존 API(`/api/games/{id}/join`) 그대로 사용.
- `instagram_url` 없는 게임(피구, 이어달리기)은 버튼 미표시.
- `Timetable.tsx`는 `GamesPageTabs`(`'use client'`) 안에서 사용되므로 클라이언트 컴포넌트로 동작. 서버 데이터 페칭 없이 props만 받으므로 문제없음.
- dual 슬롯에서 해당 `order_index` 게임이 DB에 없을 경우 해당 셀을 빈 상태(`—`)로 렌더.
