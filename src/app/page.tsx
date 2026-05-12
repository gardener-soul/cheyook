import { listGames } from '@/lib/db/games'
import { getTeamScores } from '@/lib/db/scores'
import { getScoreVisible } from '@/lib/db/settings'
import { listAllUsers } from '@/lib/db/users'
import { getActiveGameParticipants } from '@/lib/db/participants'
import ScoreBoard from '@/components/ScoreBoard'
import TeamCheer from '@/components/TeamCheer'
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

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h2 className="text-lg font-bold mb-3 text-center">팀 점수</h2>
        <ScoreBoard scores={scores} hidden={!scoreVisible} />
        <TeamCheer users={allUsers} />
      </section>

      <section>
        <h2 className="text-lg font-bold mb-3">🏃 운동장</h2>
        <Playground activeByZone={activeByZone} participantsByGame={participantsByGame} />
      </section>
    </div>
  )
}
