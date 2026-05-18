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
