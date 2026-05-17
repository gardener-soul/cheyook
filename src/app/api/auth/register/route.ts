import { NextRequest, NextResponse } from 'next/server'
import { createUser, findUser } from '@/lib/db/users'
import { signToken, SESSION_COOKIE } from '@/lib/session'
import { VILLAGES, VILLAGE_TEAM } from '@/lib/constants'

export async function POST(request: NextRequest) {
  const { name, village } = await request.json()

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return NextResponse.json({ error: '이름을 입력해주세요.' }, { status: 400 })
  }
  if (!(VILLAGES as readonly string[]).includes(village)) {
    return NextResponse.json({ error: '올바른 마을을 선택해주세요.' }, { status: 400 })
  }

  const trimmedName = name.trim()
  const existing = await findUser(trimmedName, village)
  if (existing) {
    return NextResponse.json({ error: '이미 가입된 이름입니다.' }, { status: 409 })
  }

  const team = trimmedName === 'admin' ? null : VILLAGE_TEAM[village as keyof typeof VILLAGE_TEAM]
  const user = await createUser(trimmedName, village, team)
  if (!user) {
    return NextResponse.json({ error: '가입에 실패했습니다.' }, { status: 500 })
  }

  const token = signToken(user.id)
  const response = NextResponse.json({ ok: true })
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })
  return response
}
