type UnassignedUser = {
  id: string
  name: string
  village: string
}

interface UnassignedListProps {
  users: UnassignedUser[]
  onInvite?: (userId: string) => void
}

export default function UnassignedList({ users, onInvite }: UnassignedListProps) {
  return (
    <div className="flex flex-col h-full">
      <h2 className="font-bold text-base mb-3">미배정 인원 ({users.length}명)</h2>
      {users.length === 0 ? (
        <p className="text-sm text-gray-500">모두 배정되었습니다 🎉</p>
      ) : (
        <ul className="flex flex-col gap-1 overflow-y-auto">
          {users.map((u) => (
            <li
              key={u.id}
              className={`flex items-center justify-between px-2 py-1.5 rounded text-sm ${
                onInvite ? 'cursor-pointer hover:bg-yellow-200' : ''
              }`}
              onClick={onInvite ? () => onInvite(u.id) : undefined}
            >
              <span className="font-medium">{u.name}</span>
              <span className="text-gray-500 text-xs">{u.village}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
