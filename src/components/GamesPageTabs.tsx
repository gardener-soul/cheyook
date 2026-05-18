'use client'
import { useState } from 'react'
import type { Game } from '@/lib/db/games'
import GameCard from './GameCard'
import Timetable from './Timetable'

type Tab = 'list' | 'timetable'

export default function GamesPageTabs({ games }: { games: Game[] }) {
  const [tab, setTab] = useState<Tab>('list')

  return (
    <div>
      <div className="flex gap-2 mb-4">
        {(['list', 'timetable'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              tab === t
                ? 'bg-blue-600 text-white'
                : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
            }`}
          >
            {t === 'list' ? '게임 목록' : '타임테이블'}
          </button>
        ))}
      </div>

      {tab === 'list' ? (
        <div className="flex flex-col gap-3">
          {games.length === 0 ? (
            <p className="text-center text-gray-400 py-8">등록된 게임이 없습니다.</p>
          ) : (
            games.map((game) => <GameCard key={game.id} game={game} />)
          )}
        </div>
      ) : (
        <Timetable games={games} />
      )}
    </div>
  )
}
