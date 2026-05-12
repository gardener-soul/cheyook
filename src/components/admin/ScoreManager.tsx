'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { TeamScores, ScoreLog } from '@/lib/db/scores'

export default function ScoreManager({
  scores,
  scoreLogs,
  scoreVisible: initialScoreVisible,
}: {
  scores: TeamScores
  scoreLogs: ScoreLog[]
  scoreVisible: boolean
}) {
  const router = useRouter()
  const [team, setTeam] = useState<'blue' | 'white'>('blue')
  const [points, setPoints] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [scoreVisible, setScoreVisible] = useState(initialScoreVisible)
  const [visibilityLoading, setVisibilityLoading] = useState(false)

  async function handleToggleVisibility() {
    setVisibilityLoading(true)
    const next = !scoreVisible
    await fetch('/api/settings/score-visible', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visible: next }),
    })
    setScoreVisible(next)
    setVisibilityLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await fetch('/api/scores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ team, points: Number(points), reason }),
    })
    setLoading(false)
    setPoints('')
    setReason('')
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-4">
        <div className="flex-1 bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <div className="text-blue-600 font-bold">청팀</div>
          <div className="text-3xl font-black text-blue-700">{scores.blue}</div>
        </div>
        <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
          <div className="text-gray-600 font-bold">백팀</div>
          <div className="text-3xl font-black text-gray-700">{scores.white}</div>
        </div>
      </div>

      <button
        onClick={handleToggleVisibility}
        disabled={visibilityLoading}
        className={`w-full py-3 rounded-xl font-semibold text-sm transition-colors ${
          scoreVisible
            ? 'bg-yellow-400 hover:bg-yellow-500 text-yellow-900'
            : 'bg-gray-800 hover:bg-gray-700 text-white'
        } disabled:opacity-50`}
      >
        {visibilityLoading ? '처리 중...' : scoreVisible ? '🔓 점수 가리기' : '🔐 점수 공개하기'}
      </button>

      <form onSubmit={handleSubmit} className="bg-white border rounded-xl p-4 flex flex-col gap-3">
        <h2 className="font-semibold text-sm">수동 점수 부여</h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setTeam('blue')}
            className={`flex-1 py-2 rounded font-medium text-sm ${team === 'blue' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
          >
            청팀
          </button>
          <button
            type="button"
            onClick={() => setTeam('white')}
            className={`flex-1 py-2 rounded font-medium text-sm ${team === 'white' ? 'bg-gray-600 text-white' : 'bg-gray-100'}`}
          >
            백팀
          </button>
        </div>
        <input
          type="number"
          value={points}
          onChange={(e) => setPoints(e.target.value)}
          required
          placeholder="점수 (음수 가능)"
          className="border rounded px-3 py-2 text-sm"
        />
        <input
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="사유 (선택)"
          className="border rounded px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white py-2 rounded font-medium text-sm disabled:opacity-50"
        >
          {loading ? '처리 중...' : '점수 부여'}
        </button>
      </form>

      <div>
        <h2 className="font-semibold text-sm mb-2">점수 기록</h2>
        <div className="flex flex-col gap-2">
          {scoreLogs.length === 0 && (
            <p className="text-gray-400 text-sm">점수 기록 없음</p>
          )}
          {scoreLogs.map((log) => (
            <div
              key={log.id}
              className="flex items-center justify-between text-sm border rounded px-3 py-2 bg-white"
            >
              <div>
                <span className={log.team === 'blue' ? 'text-blue-600 font-medium' : 'text-gray-600 font-medium'}>
                  {log.team === 'blue' ? '청팀' : '백팀'}
                </span>
                {log.reason && <span className="text-gray-400 ml-2">{log.reason}</span>}
              </div>
              <span className="font-bold">
                {log.points > 0 ? `+${log.points}` : log.points}점
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
