import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import {
  updateParticipantStatus,
  selectRandomParticipants,
  getParticipants,
} from '@/lib/db/participants'
import { getGameById } from '@/lib/db/games'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: '권한 없음' }, { status: 403 })

  const { id: gameId } = await params
  const body = await request.json()

  if (body.action === 'random') {
    const game = await getGameById(gameId)
    if (!game?.max_participants) {
      return NextResponse.json({ error: '참가 제한 인원이 설정되지 않았습니다.' }, { status: 400 })
    }
    await selectRandomParticipants(gameId, game.max_participants)
    const updated = await getParticipants(gameId)
    return NextResponse.json(updated)
  }

  if (body.participantId && body.status) {
    await updateParticipantStatus(body.participantId, body.status)
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: '잘못된 요청' }, { status: 400 })
}
