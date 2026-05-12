import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { joinGame, leaveGame, getParticipation } from '@/lib/db/participants'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: '로그인 필요' }, { status: 401 })

  const { id: gameId } = await params

  const existing = await getParticipation(gameId, user.id)
  if (existing) {
    return NextResponse.json({ error: '이미 신청했습니다.' }, { status: 409 })
  }

  const participant = await joinGame(gameId, user.id)
  return NextResponse.json(participant, { status: 201 })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: '로그인 필요' }, { status: 401 })

  const { id: gameId } = await params
  await leaveGame(gameId, user.id)
  return NextResponse.json({ ok: true })
}
