import { listGames } from '@/lib/db/games'
import { getTeamScores } from '@/lib/db/scores'
import { getScoreVisible } from '@/lib/db/settings'
import { listAllUsers } from '@/lib/db/users'
import { getActiveGameParticipants } from '@/lib/db/participants'
import ScoreBoard from '@/components/ScoreBoard'
import Playground from '@/components/Playground'

export default async function HomePage() {
  const [games, scores, scoreVisible, allUsers] = await Promise.all([
    listGames(),
    getTeamScores(),
    getScoreVisible(),
    listAllUsers(),
  ])

  const activeGames = games.filter((g) => g.status === 'active')
  const activeByZone = {
    full: activeGames.filter((g) => g.zone === 'full'),
    zone_a: activeGames.filter((g) => g.zone === 'zone_a'),
    zone_b: activeGames.filter((g) => g.zone === 'zone_b'),
  }

  const participantsByGame = await getActiveGameParticipants(
    activeGames.map((g) => g.id)
  )

  const blue = allUsers.filter((u) => u.team === 'blue')
  const white = allUsers.filter((u) => u.team === 'white')

  return (
    <div className="flex flex-col gap-8">
      <section className="relative">
        <h2 className="text-lg font-bold mb-3 text-center">팀 점수</h2>
        <ScoreBoard scores={scores} hidden={!scoreVisible} />

        {/* 청팀 아바타 — 컨텐츠 영역 왼쪽 마진에 배치 */}
        <div className="absolute top-0 right-full pr-8 flex flex-wrap justify-end gap-1.5 w-36 content-start pt-8">
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

        {/* 백팀 아바타 — 컨텐츠 영역 오른쪽 마진에 배치 */}
        <div className="absolute top-0 left-full pl-8 flex flex-wrap justify-start gap-1.5 w-36 content-start pt-8">
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
      </section>

      <section>
        <h2 className="text-lg font-bold mb-3">🏃 운동장</h2>
        <Playground activeByZone={activeByZone} participantsByGame={participantsByGame} />
      </section>
    </div>
  )
}
