import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/auth'
import { listGames } from '@/lib/db/games'
import { getTeamScores, listScoreLogs } from '@/lib/db/scores'
import { getScoreVisible } from '@/lib/db/settings'
import AdminTabs from './AdminTabs'

export default async function AdminPage() {
  const admin = await requireAdmin()
  if (!admin) redirect('/')

  const [games, scores, scoreLogs, scoreVisible] = await Promise.all([
    listGames(),
    getTeamScores(),
    listScoreLogs(),
    getScoreVisible(),
  ])

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">관리자 패널</h1>
      <AdminTabs games={games} scores={scores} scoreLogs={scoreLogs} adminId={admin.id} scoreVisible={scoreVisible} />
    </div>
  )
}
