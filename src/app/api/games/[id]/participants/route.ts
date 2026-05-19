import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { updateParticipantStatus } from '@/lib/db/participants'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: '권한 없음' }, { status: 403 })

  const { id: gameId } = await params
  const body = await request.json()

  if (body.participantId && body.status) {
    await updateParticipantStatus(body.participantId, body.status)
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: '잘못된 요청' }, { status: 400 })
}
