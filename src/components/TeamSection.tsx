'use client'

import { useState } from 'react'
import ScoreBoard from '@/components/ScoreBoard'
import type { TeamScores } from '@/lib/db/scores'
import type { User } from '@/lib/db/users'

export default function TeamSection({
  scores,
  hidden,
  blue,
  white,
}: {
  scores: TeamScores
  hidden: boolean
  blue: User[]
  white: User[]
}) {
  const [showTeams, setShowTeams] = useState(false)

  return (
    <section className="relative overflow-hidden">
      <h2 className="text-lg font-bold mb-3 text-center">팀 점수</h2>
      <ScoreBoard scores={scores} hidden={hidden} />

      {/* 청팀 아바타 — 데스크탑 전용 왼쪽 마진 */}
      <div className="hidden md:flex absolute top-0 right-full pr-8 flex-wrap justify-end gap-1.5 w-36 content-start pt-8">
        {blue.map((u, i) => (
          <div
            key={u.id}
            className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold shrink-0 cheer-bubble"
            style={{ animationDelay: `${(i * 0.15) % 1.2}s` }}
            title={u.name}
          >
            {u.name.slice(-2)}
          </div>
        ))}
      </div>

      {/* 백팀 아바타 — 데스크탑 전용 오른쪽 마진 */}
      <div className="hidden md:flex absolute top-0 left-full pl-8 flex-wrap justify-start gap-1.5 w-36 content-start pt-8">
        {white.map((u, i) => (
          <div
            key={u.id}
            className="w-10 h-10 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center text-xs font-bold shrink-0 cheer-bubble"
            style={{ animationDelay: `${(i * 0.15) % 1.2}s` }}
            title={u.name}
          >
            {u.name.slice(-2)}
          </div>
        ))}
      </div>

      {/* 청백팀 보기 버튼 — 모바일 전용 */}
      <button
        className="md:hidden mt-4 w-full py-2.5 rounded-xl font-bold text-sm border border-blue-200 bg-gradient-to-r from-blue-500 to-white text-blue-900 shadow-sm"
        onClick={() => setShowTeams((v) => !v)}
      >
        {showTeams ? '닫기 ✕' : '청백팀 보기 👥'}
      </button>

      {/* 모바일 아바타 패널 */}
      {showTeams && (
        <div className="md:hidden mt-3 flex gap-3">
          {/* 청팀 */}
          <div className="flex-1">
            <div className="text-blue-600 font-bold text-sm mb-2 text-center">🔵 청팀</div>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {blue.map((u, i) => (
                <div
                  key={u.id}
                  className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold shrink-0 cheer-bubble"
                  style={{ animationDelay: `${(i * 0.15) % 1.2}s` }}
                  title={u.name}
                >
                  {u.name.slice(-2)}
                </div>
              ))}
            </div>
          </div>

          {/* 구분선 */}
          <div className="w-px bg-blue-100" />

          {/* 백팀 */}
          <div className="flex-1">
            <div className="text-gray-500 font-bold text-sm mb-2 text-center">⚪ 백팀</div>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {white.map((u, i) => (
                <div
                  key={u.id}
                  className="w-10 h-10 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center text-xs font-bold shrink-0 cheer-bubble"
                  style={{ animationDelay: `${(i * 0.15) % 1.2}s` }}
                  title={u.name}
                >
                  {u.name.slice(-2)}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
