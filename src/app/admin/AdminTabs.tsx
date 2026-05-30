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
  const [tab, setTab] = useState<'games' | 'scores' | 'participants' | 'scoretable'>('games')

  const TAB_LABELS: Record<typeof tab, string> = {
    games: '게임 관리',
    scores: '점수 관리',
    participants: '참여자 관리',
    scoretable: '점수표',
  }

  return (
    <div>
      <div className="flex mb-6 border-b overflow-x-auto">
        {(['games', 'scores', 'participants', 'scoretable'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
              tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'
            }`}
          >
            {TAB_LABELS[t]}
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
      {tab === 'scoretable' && <ScoreTable />}
    </div>
  )
}

const INDIVIDUAL_GAMES = [
  { order: 1, name: '휴지 한 칸 멀리 날리기' },
  { order: 2, name: '꼬깔 쓰고 빨대 넣기' },
  { order: 3, name: '날라가는 풍선 잡기' },
  { order: 4, name: '눈 가리고 점수판에 물건 놓기' },
]

const TEAM_GAMES = [
  { order: 5,  name: '컵 전쟁',         win: 20 },
  { order: 6,  name: '장애물 계주',      win: 40 },
  { order: 7,  name: '몸에 컵 쌓기',     win: 20 },
  { order: 8,  name: '판 뒤집기',        win: 20 },
  { order: 9,  name: '피구',            win: 30 },
  { order: 10, name: '이어달리기 계주',   win: 20 },
]

function ScoreTable() {
  return (
    <div className="flex flex-col gap-6">
      {/* 개인 게임 */}
      <div className="bg-white border rounded-xl p-4">
        <h2 className="font-semibold text-sm text-gray-700 mb-3">개인 게임 (1~4번) — 순위별 차등</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-center">
            <thead>
              <tr className="text-xs text-gray-400 border-b">
                <th className="pb-2 text-left font-normal">게임</th>
                <th className="pb-2 font-normal">참여</th>
                <th className="pb-2 font-normal">1위</th>
                <th className="pb-2 font-normal">2위</th>
                <th className="pb-2 font-normal">3위</th>
                <th className="pb-2 font-normal">4위</th>
              </tr>
            </thead>
            <tbody>
              {INDIVIDUAL_GAMES.map((g) => (
                <tr key={g.order} className="border-b last:border-0">
                  <td className="py-2 text-left text-gray-700">{g.order}. {g.name}</td>
                  <td className="py-2 text-gray-500">+2</td>
                  <td className="py-2 font-semibold text-blue-600">+10</td>
                  <td className="py-2 text-gray-700">+6</td>
                  <td className="py-2 text-gray-700">+3</td>
                  <td className="py-2 text-gray-500">+1</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-gray-400">최대: 참여+1위 = 12점 · 참여만 = 2점</p>
      </div>

      {/* 단체 게임 */}
      <div className="bg-white border rounded-xl p-4">
        <h2 className="font-semibold text-sm text-gray-700 mb-3">단체 게임 (5~10번) — 승/패</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-center">
            <thead>
              <tr className="text-xs text-gray-400 border-b">
                <th className="pb-2 text-left font-normal">게임</th>
                <th className="pb-2 font-normal">참여</th>
                <th className="pb-2 font-normal">승</th>
                <th className="pb-2 font-normal">패</th>
                <th className="pb-2 font-normal">최대</th>
              </tr>
            </thead>
            <tbody>
              {TEAM_GAMES.map((g) => (
                <tr key={g.order} className="border-b last:border-0">
                  <td className="py-2 text-left text-gray-700">{g.order}. {g.name}</td>
                  <td className="py-2 text-gray-500">+5</td>
                  <td className="py-2 font-semibold text-blue-600">+{g.win}</td>
                  <td className="py-2 text-gray-400">0</td>
                  <td className="py-2 text-gray-500 text-xs">{g.win + 5}점</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-gray-400">참여 보너스는 승패 관계없이 지급</p>
      </div>

      {/* 총점 요약 */}
      <div className="bg-gray-50 border rounded-xl p-4 text-sm">
        <h2 className="font-semibold text-gray-700 mb-2">총점 요약</h2>
        <div className="flex flex-col gap-1 text-gray-600">
          <div className="flex justify-between"><span>개인 게임 최대 (전부 1위)</span><span className="font-medium">48점</span></div>
          <div className="flex justify-between"><span>단체 게임 최대 (전부 승)</span><span className="font-medium">180점</span></div>
          <div className="flex justify-between border-t pt-1 mt-1 font-semibold text-gray-800"><span>전체 최대</span><span>228점</span></div>
        </div>
      </div>
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
