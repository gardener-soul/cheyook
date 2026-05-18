import Link from 'next/link'
import type { Game } from '@/lib/db/games'
import type { Participant } from '@/lib/db/participants'
import { ZONES, type Zone } from '@/lib/constants'
const ZONE_ORDER: Zone[] = ['full', 'zone_a', 'zone_b']

export default function Playground({
  activeByZone,
  participantsByGame,
}: {
  activeByZone: Record<Zone, Game[]>
  participantsByGame: Record<string, Participant[]>
}) {
  return (
    <div className="flex flex-col gap-3">
      {ZONE_ORDER.map((zone) => {
        const games = activeByZone[zone]
        const hasGame = games.length > 0

        return (
          <div
            key={zone}
            className={`rounded-xl border p-4 transition-colors ${
              hasGame
                ? 'bg-green-50 border-green-300'
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">
              {ZONES[zone]}
            </div>

            {hasGame ? (
              games.map((game) => {
                const participants = participantsByGame[game.id] ?? []
                return (
                  <div key={game.id}>
                    <Link href={`/games/${game.id}`} className="font-semibold text-green-800 mb-2 hover:underline block">
                      🔥 {game.name}
                    </Link>
                    {participants.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {participants.map((p, i) => (
                          <div
                            key={p.id}
                            className="w-9 h-9 rounded-full bg-green-200 text-green-900 flex items-center justify-center text-xs font-bold shrink-0 cheer-bubble"
                            style={{ animationDelay: `${(i * 0.1) % 1.0}s` }}
                            title={p.users?.name}
                          >
                            {(p.users?.name ?? '?').slice(0, 2)}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-green-600">참여자 없음</p>
                    )}
                  </div>
                )
              })
            ) : (
              <p className="text-sm text-gray-400">대기중</p>
            )}
          </div>
        )
      })}
    </div>
  )
}
