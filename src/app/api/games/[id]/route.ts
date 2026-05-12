import { NextRequest, NextResponse } from 'next/server'
import { getGameById, updateGame, deleteGame } from '@/lib/db/games'
import { addScore } from '@/lib/db/scores'
import { requireAdmin } from '@/lib/auth'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: '권한 없음' }, { status: 403 })

  const { id } = await params
  const body = await request.json()

  const game = await updateGame(id, body)
  if (!game) return NextResponse.json({ error: '게임 없음' }, { status: 404 })

  if (body.status === 'completed' && body.winner_team && body.winner_team !== 'draw' && game.points) {
    await addScore({
      team: body.winner_team,
      points: game.points,
      game_id: id,
      created_by: admin.id,
    })
  }

  return NextResponse.json(game)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: '권한 없음' }, { status: 403 })

  const { id } = await params
  await deleteGame(id)
  return NextResponse.json({ ok: true })
}
