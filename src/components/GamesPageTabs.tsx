'use client'
import { useState } from 'react'
import type { Game } from '@/lib/db/games'
import GameCard from './GameCard'
import { ZONES, GAME_STATUSES } from '@/lib/constants'

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
        <div className="flex flex-col gap-2">
          {games.length === 0 ? (
            <p className="text-center text-gray-400 py-8">등록된 게임이 없습니다.</p>
          ) : (
            games.map((game, i) => (
              <div
                key={game.id}
                className="flex items-center gap-3 bg-white border border-blue-100 rounded-xl p-4"
              >
                <div className="text-sm font-bold text-blue-300 w-6 shrink-0 text-center">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-blue-900 truncate">{game.name}</div>
                  <div className="text-xs text-blue-400 mt-0.5">{ZONES[game.zone]}</div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      game.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : game.status === 'completed'
                        ? 'bg-gray-100 text-gray-500'
                        : 'bg-blue-100 text-blue-600'
                    }`}
                  >
                    {GAME_STATUSES[game.status]}
                  </span>
                  {game.points != null && (
                    <span className="text-xs text-blue-300">{game.points}점</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
