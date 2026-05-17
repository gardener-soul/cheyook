import type { TeamScores } from '@/lib/db/scores'

export default function ScoreBoard({
  scores,
  hidden = false,
}: {
  scores: TeamScores
  hidden?: boolean
}) {
  return (
    <div className="flex gap-3 justify-center">
      {/* 청팀 */}
      <div className="flex-1 bg-blue-600 rounded-2xl p-6 text-center shadow-lg">
        <div className="text-blue-100 font-bold text-base mb-3 tracking-wide">🔵 청팀</div>
        {hidden ? (
          <div className="text-5xl font-black text-white/30 select-none">?</div>
        ) : (
          <div className="text-5xl md:text-6xl font-black text-white">{scores.blue}</div>
        )}
        <div className="text-blue-200 text-sm mt-2">점</div>
      </div>

      {/* VS */}
      <div className="flex items-center px-1">
        <span className="text-2xl font-black text-blue-300">VS</span>
      </div>

      {/* 백팀 */}
      <div className="flex-1 bg-white border-2 border-blue-200 rounded-2xl p-6 text-center shadow-lg">
        <div className="text-blue-400 font-bold text-base mb-3 tracking-wide">⚪ 백팀</div>
        {hidden ? (
          <div className="text-5xl font-black text-blue-100 select-none">?</div>
        ) : (
          <div className="text-5xl md:text-6xl font-black text-blue-700">{scores.white}</div>
        )}
        <div className="text-blue-300 text-sm mt-2">점</div>
      </div>
    </div>
  )
}
