import type { User } from '@/lib/db/users'

export default function TeamCheer({ users }: { users: User[] }) {
  const blue = users.filter((u) => u.team === 'blue')
  const white = users.filter((u) => u.team === 'white')

  if (blue.length === 0 && white.length === 0) return null

  return (
    <div className="flex gap-2 mt-4 min-h-12">
      {/* 청팀 — flex-wrap toward center */}
      <div className="flex-1 flex flex-wrap content-start justify-end gap-1.5">
        {blue.map((u, i) => (
          <div
            key={u.id}
            className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold shrink-0 cheer-bubble"
            style={{ animationDelay: `${(i * 0.15) % 1.2}s` }}
            title={u.name}
          >
            {u.name.slice(0, 2)}
          </div>
        ))}
      </div>

      {/* divider */}
      <div className="flex items-start pt-2 text-gray-300 text-xs font-bold">⚡</div>

      {/* 백팀 — flex-wrap toward center */}
      <div className="flex-1 flex flex-wrap content-start justify-start gap-1.5">
        {white.map((u, i) => (
          <div
            key={u.id}
            className="w-10 h-10 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center text-xs font-bold shrink-0 cheer-bubble"
            style={{ animationDelay: `${(i * 0.15) % 1.2}s` }}
            title={u.name}
          >
            {u.name.slice(0, 2)}
          </div>
        ))}
      </div>
    </div>
  )
}
