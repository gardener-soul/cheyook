import { NextRequest, NextResponse } from 'next/server'
import { listRounds, addRound } from '@/lib/db/rounds'
import { addScore } from '@/lib/db/scores'
import { requireAdmin } from '@/lib/auth'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const rounds = await listRounds(id)
  return NextResponse.json(rounds)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: '권한 없음' }, { status: 403 })

  const { id } = await params
  const { round_number, winner_team, points_awarded } = await request.json()

  if (!winner_team || !['blue', 'white', 'draw'].includes(winner_team)) {
    return NextResponse.json({ error: '승자 팀을 선택해주세요.' }, { status: 400 })
  }
  if (typeof points_awarded !== 'number') {
    return NextResponse.json({ error: '점수를 입력해주세요.' }, { status: 400 })
  }
  if (typeof round_number !== 'number' || round_number < 1 || round_number > 3) {
    return NextResponse.json({ error: '판 번호가 올바르지 않습니다.' }, { status: 400 })
  }

  const round = await addRound({ game_id: id, round_number, winner_team, points_awarded })

  if (winner_team !== 'draw') {
    await addScore({
      team: winner_team as 'blue' | 'white',
      points: points_awarded,
      game_id: id,
      reason: `${round_number}판 결과`,
      created_by: admin.id,
    })
  }

  return NextResponse.json(round)
}
