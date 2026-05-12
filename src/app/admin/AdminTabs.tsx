'use client'

import { useState, useEffect } from 'react'
import type { Game } from '@/lib/db/games'
import type { TeamScores, ScoreLog } from '@/lib/db/scores'
import type { Participant } from '@/lib/db/participants'
import GameForm from '@/components/admin/GameForm'
import GameList from '@/components/admin/GameList'
import ScoreManager from '@/components/admin/ScoreManager'

export default function AdminTabs({
  games,
  scores,
  scoreLogs,
  adminId: _adminId,
  scoreVisible,
}: {
  games: Game[]
  scores: TeamScores
  scoreLogs: ScoreLog[]
  adminId: string
  scoreVisible: boolean
}) {
  const [tab, setTab] = useState<'games' | 'scores' | 'participants'>('games')

  return (
    <div>
      <div className="flex gap-2 mb-6 border-b">
        {(['games', 'scores', 'participants'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'
            }`}
          >
            {t === 'games' ? '게임 관리' : t === 'scores' ? '점수 관리' : '참여자 관리'}
          </button>
        ))}
      </div>

      {tab === 'games' && (
        <div className="flex flex-col gap-6">
          <GameForm />
          <GameList games={games} />
        </div>
      )}
      {tab === 'scores' && (
        <ScoreManager scores={scores} scoreLogs={scoreLogs} scoreVisible={scoreVisible} />
      )}
      {tab === 'participants' && (
        <div className="flex flex-col gap-4">
          {games.map((game) => (
            <ParticipantSection key={game.id} game={game} />
          ))}
        </div>
      )}
    </div>
  )
}

function ParticipantSection({ game }: { game: Game }) {
  const [open, setOpen] = useState(false)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!open || loaded) return
    fetch(`/api/games/${game.id}/participants-list`)
      .then((r) => r.json())
      .then((data) => {
        setParticipants(data)
        setLoaded(true)
      })
  }, [open, loaded, game.id])

  async function handleRandom() {
    const res = await fetch(`/api/games/${game.id}/participants`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'random' }),
    })
    const data = await res.json()
    setParticipants(data)
  }

  async function handleSelect(participantId: string, status: 'selected' | 'rejected') {
    await fetch(`/api/games/${game.id}/participants`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participantId, status }),
    })
    setParticipants((prev) =>
      prev.map((p) => (p.id === participantId ? { ...p, status } : p))
    )
  }

  return (
    <div className="border rounded-lg bg-white">
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left px-4 py-3 font-medium flex justify-between items-center"
      >
        <span>{game.name}</span>
        <span className="text-gray-400 text-sm">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 border-t">
          <div className="flex gap-2 my-3">
            {game.max_participants && (
              <button
                onClick={handleRandom}
                className="text-sm bg-purple-600 text-white px-3 py-1 rounded"
              >
                랜덤 {game.max_participants}명 선발
              </button>
            )}
          </div>
          <div className="flex flex-col gap-2">
            {participants.length === 0 && loaded && (
              <p className="text-gray-400 text-sm">신청자 없음</p>
            )}
            {!loaded && <p className="text-gray-400 text-sm">로딩 중...</p>}
            {participants.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between text-sm border rounded px-3 py-2"
              >
                <span>
                  {p.users?.village} · {p.users?.name}
                  <span className={`ml-2 text-xs ${p.status === 'selected' ? 'text-green-600' : p.status === 'rejected' ? 'text-red-500' : 'text-gray-400'}`}>
                    ({p.status === 'selected' ? '선발' : p.status === 'rejected' ? '탈락' : '대기'})
                  </span>
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSelect(p.id, 'selected')}
                    className={`px-2 py-0.5 rounded text-xs ${p.status === 'selected' ? 'bg-green-600 text-white' : 'bg-gray-100 hover:bg-green-100'}`}
                  >
                    선발
                  </button>
                  <button
                    onClick={() => handleSelect(p.id, 'rejected')}
                    className={`px-2 py-0.5 rounded text-xs ${p.status === 'rejected' ? 'bg-red-600 text-white' : 'bg-gray-100 hover:bg-red-100'}`}
                  >
                    탈락
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
