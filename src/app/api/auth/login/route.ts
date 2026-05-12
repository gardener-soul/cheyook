import { NextRequest, NextResponse } from 'next/server'
import { findUser } from '@/lib/db/users'
import { signToken, SESSION_COOKIE } from '@/lib/session'
import { VILLAGES } from '@/lib/constants'

export async function POST(request: NextRequest) {
  const { name, village } = await request.json()

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return NextResponse.json({ error: '이름을 입력해주세요.' }, { status: 400 })
  }
  if (!(VILLAGES as readonly string[]).includes(village)) {
    return NextResponse.json({ error: '올바른 마을을 선택해주세요.' }, { status: 400 })
  }

  const user = await findUser(name.trim(), village)
  if (!user) {
    return NextResponse.json({ error: '가입된 정보가 없습니다.' }, { status: 401 })
  }

  const token = signToken(user.id)
  const response = NextResponse.json({ ok: true, isAdmin: user.is_admin })
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })
  return response
}
