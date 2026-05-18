'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Game } from '@/lib/db/games'
import { ZONES, GAME_STATUSES } from '@/lib/constants'
import type { GameRound } from '@/lib/db/rounds'

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
            className="bg-white border rounded-lg p-3"
          >
            <div className="flex items-center justify-between gap-3">
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
            {game.status === 'active' && <RoundRecorder game={game} />}
          </div>
        )
      })}
    </div>
  )
}

function RoundRecorder({ game }: { game: Game }) {
  const [rounds, setRounds] = useState<GameRound[]>([])
  const [showForm, setShowForm] = useState(false)
  const [winner, setWinner] = useState<'blue' | 'white' | 'draw'>('blue')
  const [points, setPoints] = useState(String(game.points ?? 0))
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch(`/api/games/${game.id}/rounds`)
      .then((r) => r.json())
      .then(setRounds)
  }, [game.id])

  async function handleAdd() {
    setLoading(true)
    const nextRound = rounds.length + 1
    await fetch(`/api/games/${game.id}/rounds`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        round_number: nextRound,
        winner_team: winner,
        points_awarded: Number(points),
      }),
    })
    const updated: GameRound[] = await fetch(`/api/games/${game.id}/rounds`).then((r) => r.json())
    setRounds(updated)
    setShowForm(false)
    setLoading(false)
  }

  const canAdd = rounds.length < 3

  return (
    <div className="mt-2 pt-2 border-t">
      <div className="flex flex-wrap gap-1 mb-1.5">
        {rounds.map((r) => (
          <span
            key={r.id}
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              r.winner_team === 'blue'
                ? 'bg-blue-100 text-blue-700'
                : r.winner_team === 'white'
                ? 'bg-gray-100 text-gray-700'
                : 'bg-yellow-100 text-yellow-700'
            }`}
          >
            {r.round_number}판{' '}
            {r.winner_team === 'blue' ? '청팀' : r.winner_team === 'white' ? '백팀' : '무승부'}{' '}
            +{r.points_awarded}점
          </span>
        ))}
      </div>

      {canAdd && !showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1 rounded hover:bg-indigo-100"
        >
          + {rounds.length + 1}판 기록
        </button>
      )}

      {showForm && (
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1">
            {(['blue', 'white', 'draw'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setWinner(t)}
                className={`text-xs px-2 py-1 rounded font-medium ${
                  winner === t
                    ? t === 'blue'
                      ? 'bg-blue-600 text-white'
                      : t === 'white'
                      ? 'bg-gray-600 text-white'
                      : 'bg-yellow-500 text-white'
                    : 'bg-gray-100'
                }`}
              >
                {t === 'blue' ? '청팀' : t === 'white' ? '백팀' : '무승부'}
              </button>
            ))}
          </div>
          <input
            type="number"
            value={points}
            onChange={(e) => setPoints(e.target.value)}
            className="w-16 text-xs border rounded px-2 py-1"
          />
          <span className="text-xs text-gray-400">점</span>
          <button
            onClick={handleAdd}
            disabled={loading}
            className="text-xs bg-green-600 text-white px-3 py-1 rounded disabled:opacity-50"
          >
            {loading ? '...' : '기록'}
          </button>
          <button
            onClick={() => setShowForm(false)}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            취소
          </button>
        </div>
      )}
    </div>
  )
}
