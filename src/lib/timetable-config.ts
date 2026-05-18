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
