export const VILLAGES = [
  '예앞', 'FC11', '당근', '바인', '비쥬얼', '하하', '글라스', '주먹',
] as const

export type Village = (typeof VILLAGES)[number]

export const TEAMS = {
  blue: { label: '청팀', color: 'blue' },
  white: { label: '백팀', color: 'gray' },
} as const

export type Team = 'blue' | 'white'

export const VILLAGE_TEAM: Record<Village, Team> = {
  '예앞': 'blue',
  '당근': 'blue',
  '글라스': 'blue',
  '비쥬얼': 'blue',
  '바인': 'white',
  'FC11': 'white',
  '주먹': 'white',
  '하하': 'white',
}

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
