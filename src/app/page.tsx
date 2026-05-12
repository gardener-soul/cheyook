import { listGames } from '@/lib/db/games'
import { getTeamScores } from '@/lib/db/scores'
import { getScoreVisible } from '@/lib/db/settings'
import ScoreBoard from '@/components/ScoreBoard'
import Timetable from '@/components/Timetable'
import { ZONES } from '@/lib/constants'

export default async function HomePage() {
  const [games, scores, scoreVisible] = await Promise.all([
    listGames(),
    getTeamScores(),
    getScoreVisible(),
  ])

  const activeGames = games.filter((g) => g.status === 'active')
  const activeByZone = {
    full: activeGames.filter((g) => g.zone === 'full'),
    zone_a: activeGames.filter((g) => g.zone === 'zone_a'),
    zone_b: activeGames.filter((g) => g.zone === 'zone_b'),
  }

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h2 className="text-lg font-bold mb-3 text-center">팀 점수</h2>
        <ScoreBoard scores={scores} hidden={!scoreVisible} />
      </section>

      {activeGames.length > 0 && (
        <section>
          <h2 className="text-lg font-bold mb-3">🔥 현재 진행 중</h2>
          {(['full', 'zone_a', 'zone_b'] as const).map((zone) =>
            activeByZone[zone].length > 0 ? (
              <div key={zone} className="mb-4">
                <h3 className="text-sm font-medium text-gray-500 mb-2">{ZONES[zone]}</h3>
                <div className="flex flex-col gap-2">
                  {activeByZone[zone].map((game) => (
                    <div
                      key={game.id}
                      className="bg-green-50 border border-green-300 rounded-lg p-4"
                    >
                      <span className="font-semibold">{game.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null
          )}
        </section>
      )}

      <section>
        <h2 className="text-lg font-bold mb-3">📋 게임 목록</h2>
        <Timetable games={games} />
      </section>
    </div>
  )
}
