'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Participant } from '@/lib/db/participants'

export default function JoinButton({
  gameId,
  participation,
}: {
  gameId: string
  participation: Participant | null
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const joined = !!participation

  async function handleClick() {
    setLoading(true)
    await fetch(`/api/games/${gameId}/join`, {
      method: joined ? 'DELETE' : 'POST',
    })
    setLoading(false)
    router.refresh()
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`py-2 px-6 rounded-lg font-medium disabled:opacity-50 ${
        joined
          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          : 'bg-blue-600 text-white hover:bg-blue-700'
      }`}
    >
      {loading ? '처리 중...' : joined ? '신청 취소' : '참여 신청'}
    </button>
  )
}
