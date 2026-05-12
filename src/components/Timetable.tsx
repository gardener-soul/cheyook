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
