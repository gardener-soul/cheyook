import { listGames } from '@/lib/db/games'
import GamesPageTabs from '@/components/GamesPageTabs'

export default async function GamesPage() {
  const games = await listGames()
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">게임</h1>
      <GamesPageTabs games={games} />
    </div>
  )
}
