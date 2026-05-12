'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Game } from '@/lib/db/games'
import { ZONES, GAME_STATUSES } from '@/lib/constants'

const STATUS_NEXT: Record<string, { label: string; next: string }> = {
  pending: { label: '게임 시작', next: 'active' },
  active: { label: '게임 완료', next: 'completed' },
  completed: { label: '완료됨', next: '' },
}

export default function GameList({ games }: { games: Game[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  async function changeStatus(game: Game, nextStatus: string) {
    setLoading(game.id)
    let body: Record<string, unknown> = { status: nextStatus }
    if (nextStatus === 'completed') {
      const winner = window.prompt('승자 팀 입력: blue / white / draw')
      if (!winner) {
        setLoading(null)
        return
      }
      body = { status: 'completed', winner_team: winner }
    }
    await fetch(`/api/games/${game.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setLoading(null)
    router.refresh()
  }

  async function deleteGame(id: string) {
    if (!window.confirm('이 게임을 삭제할까요?')) return
    await fetch(`/api/games/${id}`, { method: 'DELETE' })
    router.refresh()
  }

  if (games.length === 0) {
    return <p className="text-gray-400 text-sm text-center py-4">등록된 게임 없음</p>
  }

  return (
    <div className="flex flex-col gap-2">
      {games.map((game) => {
        const next = STATUS_NEXT[game.status]
        return (
          <div
            key={game.id}
            className="bg-white border rounded-lg p-3 flex items-center justify-between gap-3"
          >
            <div className="min-w-0">
              <span className="font-medium text-sm">{game.name}</span>
              <span className="text-xs text-gray-400 ml-2">{ZONES[game.zone]}</span>
              <span className="text-xs text-gray-400 ml-2">{GAME_STATUSES[game.status]}</span>
            </div>
            <div className="flex gap-2 shrink-0">
              {next.next && (
                <button
                  disabled={loading === game.id}
                  onClick={() => changeStatus(game, next.next)}
                  className="text-xs bg-green-600 text-white px-2 py-1 rounded disabled:opacity-50"
                >
                  {loading === game.id ? '...' : next.label}
                </button>
              )}
              <button
                onClick={() => deleteGame(game.id)}
                className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded hover:bg-red-200"
              >
                삭제
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
