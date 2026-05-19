import { notFound } from 'next/navigation'
import { getGameById } from '@/lib/db/games'
import { getParticipants, getParticipation } from '@/lib/db/participants'
import { getSession } from '@/lib/auth'
import { ZONES, GAME_STATUSES, VILLAGE_TEAM, type Village } from '@/lib/constants'
import JoinButton from './JoinButton'

export default async function GameDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [game, user] = await Promise.all([getGameById(id), getSession()])

  if (!game) notFound()

  const participants = await getParticipants(id)
  const myParticipation = user ? await getParticipation(id, user.id) : null

  const selected = participants.filter((p) => p.status === 'selected')
  const registered = participants.filter((p) => p.status === 'registered')

  const selectedBlue = selected.filter(
    (p) => p.users?.village && VILLAGE_TEAM[p.users.village as Village] === 'blue'
  )
  const selectedWhite = selected.filter(
    (p) => p.users?.village && VILLAGE_TEAM[p.users.village as Village] === 'white'
  )
  const registeredBlue = registered.filter(
    (p) => p.users?.village && VILLAGE_TEAM[p.users.village as Village] === 'blue'
  )
  const registeredWhite = registered.filter(
    (p) => p.users?.village && VILLAGE_TEAM[p.users.village as Village] === 'white'
  )

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold">{game.name}</h1>
          <span className="text-sm bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
            {GAME_STATUSES[game.status]}
          </span>
        </div>
        <div className="text-gray-500 text-sm">{ZONES[game.zone]}</div>
        {game.description && (
          <p className="mt-3 text-gray-700 whitespace-pre-line">{game.description}</p>
        )}
        {game.instagram_url && (
          <a
            href={game.instagram_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 transition-opacity"
          >
            ▶ 영상으로 보기
          </a>
        )}
        <div className="flex gap-4 mt-3 text-sm text-gray-500">
          {game.points != null && <span>배점: {game.points}점</span>}
          {game.max_participants != null && (
            <span>참가 제한: {game.max_participants}명</span>
          )}
        </div>
      </div>

      {user && game.status === 'pending' && (
        <JoinButton gameId={id} participation={myParticipation} />
      )}
      {!user && game.status === 'pending' && (
        <p className="text-sm text-gray-500">
          참여 신청하려면 <a href="/login" className="text-blue-600">로그인</a>하세요.
        </p>
      )}

      {selected.length > 0 && (
        <section>
          <h2 className="font-semibold mb-2">✅ 선발된 참여자 ({selected.length}명)</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs font-medium text-blue-600 mb-1.5">청팀 ({selectedBlue.length}명)</div>
              <div className="flex flex-col gap-1">
                {selectedBlue.map((p) => (
                  <span key={p.id} className="bg-blue-50 border border-blue-200 rounded-full px-3 py-1 text-sm">
                    {p.users?.village} · {p.users?.name}
                  </span>
                ))}
                {selectedBlue.length === 0 && <span className="text-xs text-gray-300">없음</span>}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-gray-500 mb-1.5">백팀 ({selectedWhite.length}명)</div>
              <div className="flex flex-col gap-1">
                {selectedWhite.map((p) => (
                  <span key={p.id} className="bg-gray-50 border border-gray-200 rounded-full px-3 py-1 text-sm">
                    {p.users?.village} · {p.users?.name}
                  </span>
                ))}
                {selectedWhite.length === 0 && <span className="text-xs text-gray-300">없음</span>}
              </div>
            </div>
          </div>
        </section>
      )}

      <section>
        <h2 className="font-semibold mb-2">
          📝 신청자 ({participants.length}명
          {game.max_participants ? ` / 제한 ${game.max_participants}명` : ''})
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-xs font-medium text-blue-600 mb-1.5">청팀 ({registeredBlue.length}명)</div>
            <div className="flex flex-col gap-1">
              {registeredBlue.map((p) => (
                <span key={p.id} className="bg-blue-50 border border-blue-200 rounded-full px-3 py-1 text-sm">
                  {p.users?.village} · {p.users?.name}
                </span>
              ))}
              {registeredBlue.length === 0 && <span className="text-xs text-gray-300">없음</span>}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-gray-500 mb-1.5">백팀 ({registeredWhite.length}명)</div>
            <div className="flex flex-col gap-1">
              {registeredWhite.map((p) => (
                <span key={p.id} className="bg-gray-50 border border-gray-200 rounded-full px-3 py-1 text-sm">
                  {p.users?.village} · {p.users?.name}
                </span>
              ))}
              {registeredWhite.length === 0 && <span className="text-xs text-gray-300">없음</span>}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
