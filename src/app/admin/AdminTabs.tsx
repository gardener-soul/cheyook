'use client'

import { useState, useEffect } from 'react'
import type { Game } from '@/lib/db/games'
import type { TeamScores, ScoreLog } from '@/lib/db/scores'
import type { Participant } from '@/lib/db/participants'
import { VILLAGE_TEAM, type Village } from '@/lib/constants'
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
      <div className="flex mb-6 border-b overflow-x-auto">
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
        <div className="px-4 pb-4 border-t pt-3">
          {!loaded && <p className="text-gray-400 text-sm">로딩 중...</p>}
          {loaded && participants.length === 0 && (
            <p className="text-gray-400 text-sm">신청자 없음</p>
          )}
          {loaded && participants.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {(['blue', 'white'] as const).map((team) => {
                const teamParticipants = participants.filter(
                  (p) =>
                    p.users?.village &&
                    VILLAGE_TEAM[p.users.village as Village] === team
                )
                return (
                  <div key={team}>
                    <div className={`text-xs font-semibold mb-2 ${team === 'blue' ? 'text-blue-600' : 'text-gray-500'}`}>
                      {team === 'blue' ? '청팀' : '백팀'} ({teamParticipants.length}명)
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {teamParticipants.map((p) => (
                        <div
                          key={p.id}
                          className="flex flex-col gap-1 text-sm border rounded px-2 py-1.5"
                        >
                          <span className="text-xs">
                            {p.users?.village} · {p.users?.name}
                            <span className={`ml-1 ${p.status === 'selected' ? 'text-green-600' : p.status === 'rejected' ? 'text-red-500' : 'text-gray-400'}`}>
                              ({p.status === 'selected' ? '선발' : p.status === 'rejected' ? '탈락' : '대기'})
                            </span>
                          </span>
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleSelect(p.id, 'selected')}
                              className={`flex-1 py-1 rounded text-xs ${p.status === 'selected' ? 'bg-green-600 text-white' : 'bg-gray-100 hover:bg-green-100'}`}
                            >
                              선발
                            </button>
                            <button
                              onClick={() => handleSelect(p.id, 'rejected')}
                              className={`flex-1 py-1 rounded text-xs ${p.status === 'rejected' ? 'bg-red-600 text-white' : 'bg-gray-100 hover:bg-red-100'}`}
                            >
                              탈락
                            </button>
                          </div>
                        </div>
                      ))}
                      {teamParticipants.length === 0 && (
                        <p className="text-xs text-gray-300">없음</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
