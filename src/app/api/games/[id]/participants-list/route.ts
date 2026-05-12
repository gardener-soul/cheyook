import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { getParticipants } from '@/lib/db/participants'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: '권한 없음' }, { status: 403 })

  const { id: gameId } = await params
  const participants = await getParticipants(gameId)
  return NextResponse.json(participants)
}
