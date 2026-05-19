-- =============================================================
-- 체육대회 게임 시드 데이터
-- Supabase SQL Editor에서 실행하세요.
-- 기존 게임 데이터를 모두 지우고 새로 삽입합니다.
-- =============================================================

-- 1. instagram_url 컬럼 추가 (이미 있으면 무시)
ALTER TABLE games
  ADD COLUMN IF NOT EXISTS instagram_url TEXT;

-- 2. 기존 게임 전부 삭제 (game_participants CASCADE)
TRUNCATE TABLE games RESTART IDENTITY CASCADE;

-- 3. 게임 삽입 (타임테이블 순서 기준)

INSERT INTO games (name, description, zone, max_participants, points, order_index, status, instagram_url) VALUES

-- ── 개인 게임 블록 (4:45 ~ 5:05, 구역 A/B 동시 진행) ──────────────────

(
  '휴지 한 칸 멀리 날리기',
  E'준비물: 휴지 한 칸\n\n시작점을 정해놓고, 사람들은 휴지 한 칸을 들고 가장 멀리 날리는 사람이 승리!',
  'zone_a', NULL, NULL, 1, 'pending',
  'https://www.instagram.com/reel/DVqT9RDETq6/?igsh=b3R6c2Y4bHFobG54'
),

(
  '꼬깔 쓰고 빨대 넣기',
  E'준비물: 꼬깔, 병, 빨대\n\n꼬깔을 쓴 채로 (고깔 위 구멍으로 앞을 봄) 목적지의 병 안에 빨대를 넣으면 승리!',
  'zone_b', NULL, NULL, 2, 'pending',
  'https://www.instagram.com/reel/DSw0BsKDzUZ/?igsh=dmV4cGt1bjBjNmFj'
),

(
  '날라가는 풍선 잡기',
  E'준비물: 풍선\n\n2명이 적당한 거리를 두고 선다. 한 쪽이 풍선을 불어 날리면, 반대쪽 사람이 그 풍선을 잡으면 승리!',
  'zone_a', NULL, NULL, 3, 'pending',
  'https://www.instagram.com/reel/DVxRu26Dd1F/?igsh=MTI4Y2I2a3pzaDFsbg=='
),

(
  '눈 가리고 점수판에 물건 놓기',
  E'준비물: 안대, 점수판, 물병\n\n안대를 쓴 채로 시작점에서 물병을 들고 점수판을 향해 걷는다. 점수판에 가장 정확히 올려놓는 팀이 승리!',
  'zone_b', NULL, NULL, 4, 'pending',
  'https://www.instagram.com/reel/DWqiO2wCWcY/?igsh=dHVrYzNyNGd4cXhu'
),

-- ── 단체 게임 블록 (5:10 ~) ──────────────────────────────────────────

(
  '컵 전쟁',
  E'준비물: 많은 양의 종이컵\n\n종이컵을 손 위 (또는 정수리)에 올려놓고 균형을 잡으면서 상대방의 컵을 떨어트린다. 마지막에 남은 팀이 승리! (배틀로얄)',
  'full', NULL, NULL, 5, 'pending',
  'https://www.instagram.com/reel/DUAiDyEj-6S/?igsh=MW83MDhlam55N21lcg=='
),

(
  '볼펜 지탱하기',
  E'준비물: (참가 인원 - 1) × 2개의 볼펜\n\n5명이 손가락 사이에 볼펜 균형을 잡은 채 목적지까지 달린다. 볼펜을 떨어트리면 그 자리에서 멈추고 다시 잡은 뒤 출발. 먼저 도착하는 팀 승리! (팀당 5명)',
  'full', 10, NULL, 6, 'pending',
  'https://www.instagram.com/reel/DS1zRDgF9Qm/?igsh=MXI5dHhqNzhnbWR4aQ=='
),

(
  '장애물 계주',
  E'3단계 릴레이 계주!\n\n① 레그터널 패스 — 공을 다리 사이로 굴려 끝 사람까지 전달\n② 탁구공 컵 전달 — 컵으로 탁구공을 던져 다음 사람에게 연속 전달\n③ 파라슈트 — 큰 천을 잡고 공을 위로 튀기기\n\n팀당 10~15명 참가.',
  'full', 30, NULL, 7, 'pending',
  'https://www.instagram.com/reel/DXq2NgIk5Fc/?igsh=MWxhMmkwZGkwbXhyeQ=='
),

(
  '몸에 컵 쌓기',
  E'준비물: 많은 양의 종이컵\n\n출발지에서 목적지에 서 있는 사람에게 종이컵을 최대한 많이 쌓는 팀이 승리!',
  'full', NULL, NULL, 8, 'pending',
  'https://www.instagram.com/reel/DSpBmzZj2xT/?igsh=Z2g3bmV6OG5lYnpq'
),

(
  '전략 줄다리기',
  E'준비물: 줄 3~5개\n\n여러 줄을 깔아놓고 각 팀이 어느 줄에 몇 명을 배치할지 사전에 전략을 짠다. 전략 배치 후 줄다리기 시작 — 어느 팀이 더 많은 줄을 이기는지 겨룬다!',
  'full', NULL, NULL, 9, 'pending',
  'https://www.instagram.com/reel/DQjLQlOk1lf/?igsh=MWZmZ3U1eHphbnJjMA=='
),

(
  '피구',
  E'팀당 10~15명이 참가하는 피구. 상대팀 선수를 모두 아웃시키는 팀이 승리!',
  'full', 30, NULL, 10, 'pending',
  NULL
),

(
  '이어달리기 계주',
  E'마무리 하이라이트! 팀당 8~10명이 참가하는 이어달리기. 먼저 완주하는 팀이 승리!',
  'full', 20, NULL, 11, 'pending',
  NULL
);
