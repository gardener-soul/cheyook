import { NextRequest, NextResponse } from 'next/server'
import { getTeamScores, addScore } from '@/lib/db/scores'
import { requireAdmin } from '@/lib/auth'

export async function GET() {
  const scores = await getTeamScores()
  return NextResponse.json(scores)
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: '권한 없음' }, { status: 403 })

  const { team, points, reason } = await request.json()

  if (!team || !['blue', 'white'].includes(team)) {
    return NextResponse.json({ error: '팀을 선택해주세요.' }, { status: 400 })
  }
  if (!points || typeof points !== 'number') {
    return NextResponse.json({ error: '점수를 입력해주세요.' }, { status: 400 })
  }

  await addScore({ team, points, reason, created_by: admin.id })
  return NextResponse.json({ ok: true })
}
