import Link from 'next/link'
import type { Game } from '@/lib/db/games'
import { ZONES, GAME_STATUSES } from '@/lib/constants'

const statusStyle = {
  pending: { badge: 'bg-blue-100 text-blue-600', dot: 'bg-blue-400' },
  active:  { badge: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
  completed: { badge: 'bg-gray-100 text-gray-500', dot: 'bg-gray-400' },
}

export default function GameCard({ game }: { game: Game }) {
  const style = statusStyle[game.status]
  return (
    <Link href={`/games/${game.id}`}>
      <div className="bg-white border border-blue-100 rounded-xl p-4 hover:shadow-md hover:border-blue-300 transition-all flex items-center gap-3">
        <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${style.dot}`} />
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-blue-900 truncate">{game.name}</div>
          <div className="text-xs text-blue-400 mt-0.5">{ZONES[game.zone]}</div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${style.badge}`}>
            {GAME_STATUSES[game.status]}
          </span>
          {game.points != null && (
            <span className="text-xs text-blue-300">{game.points}점</span>
          )}
        </div>
      </div>
    </Link>
  )
}
