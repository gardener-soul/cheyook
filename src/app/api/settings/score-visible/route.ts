import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { getScoreVisible, setScoreVisible } from '@/lib/db/settings'

export async function GET() {
  const visible = await getScoreVisible()
  return NextResponse.json({ visible })
}

export async function PATCH(request: Request) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { visible } = await request.json()
  await setScoreVisible(Boolean(visible))
  return NextResponse.json({ visible: Boolean(visible) })
}
