import { NextRequest, NextResponse } from 'next/server'
import { listGames, createGame } from '@/lib/db/games'
import { requireAdmin } from '@/lib/auth'

export async function GET() {
  const games = await listGames()
  return NextResponse.json(games)
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: '권한 없음' }, { status: 403 })

  const body = await request.json()
  const { name, description, zone, points, order_index, instagram_url } = body

  if (!name || !zone) {
    return NextResponse.json({ error: '이름과 구역은 필수입니다.' }, { status: 400 })
  }

  const game = await createGame({
    name,
    description,
    zone,
    points: points ?? null,
    order_index: order_index ?? 0,
    instagram_url: instagram_url ?? null,
  })

  return NextResponse.json(game, { status: 201 })
}
