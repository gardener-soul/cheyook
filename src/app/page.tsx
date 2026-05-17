import { listGames } from '@/lib/db/games'
import { getTeamScores } from '@/lib/db/scores'
import { getScoreVisible } from '@/lib/db/settings'
import { listAllUsers } from '@/lib/db/users'
import { getActiveGameParticipants } from '@/lib/db/participants'
import TeamSection from '@/components/TeamSection'
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
      <TeamSection scores={scores} hidden={!scoreVisible} blue={blue} white={white} />

      <section>
        <h2 className="text-lg font-bold mb-3">🏃 운동장</h2>
        <Playground activeByZone={activeByZone} participantsByGame={participantsByGame} />
      </section>
    </div>
  )
}
